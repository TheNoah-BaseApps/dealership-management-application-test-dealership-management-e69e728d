import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { validateSale } from '@/lib/validations/sale';
import { logAudit } from '@/lib/audit';

export async function GET(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const salesperson = searchParams.get('salesperson');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        s.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        v.make, v.model, v.year, v.vin, v.stock_number,
        u.name as salesperson_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN vehicles v ON s.vehicle_id = v.id
      LEFT JOIN users u ON s.salesperson_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (status) {
      sql += ` AND s.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (salesperson) {
      sql += ` AND s.salesperson_id = $${paramCount}`;
      params.push(salesperson);
      paramCount++;
    }

    if (dateFrom) {
      sql += ` AND s.sale_date >= $${paramCount}`;
      params.push(dateFrom);
      paramCount++;
    }

    if (dateTo) {
      sql += ` AND s.sale_date <= $${paramCount}`;
      params.push(dateTo);
      paramCount++;
    }

    if (search) {
      sql += ` AND (
        c.name ILIKE $${paramCount} OR 
        v.vin ILIKE $${paramCount} OR 
        v.stock_number ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as filtered_sales`;
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].total);

    sql += ` ORDER BY s.sale_date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sales' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const client = await getClient();
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = validateSale(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const {
      customer_id,
      vehicle_id,
      salesperson_id,
      sale_date,
      sale_price,
      trade_in_value,
      down_payment,
      financing_amount,
      monthly_payment,
      term_months,
      interest_rate,
      finance_company,
      tax_amount,
      fees,
      final_price,
      payment_method,
      status,
      delivery_date,
      warranty_info,
      notes
    } = body;

    await client.query('BEGIN');

    // Verify vehicle is available
    const vehicleCheck = await client.query(
      'SELECT status FROM vehicles WHERE id = $1',
      [vehicle_id]
    );

    if (vehicleCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    if (vehicleCheck.rows[0].status === 'sold') {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'Vehicle is already sold' },
        { status: 400 }
      );
    }

    const result = await client.query(
      `INSERT INTO sales (
        customer_id, vehicle_id, salesperson_id, sale_date, sale_price,
        trade_in_value, down_payment, financing_amount, monthly_payment,
        term_months, interest_rate, finance_company, tax_amount, fees,
        final_price, payment_method, status, delivery_date, warranty_info,
        notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *`,
      [
        customer_id,
        vehicle_id,
        salesperson_id,
        sale_date,
        sale_price,
        trade_in_value,
        down_payment,
        financing_amount,
        monthly_payment,
        term_months,
        interest_rate,
        finance_company,
        tax_amount,
        JSON.stringify(fees || {}),
        final_price,
        payment_method,
        status || 'pending',
        delivery_date,
        JSON.stringify(warranty_info || {}),
        notes,
        user.id
      ]
    );

    const sale = result.rows[0];

    // Update vehicle status to sold
    await client.query(
      `UPDATE vehicles SET status = 'sold', customer_id = $1, updated_at = NOW() WHERE id = $2`,
      [customer_id, vehicle_id]
    );

    await logAudit({
      user_id: user.id,
      action: 'CREATE',
      resource_type: 'sale',
      resource_id: sale.id,
      details: { sale_data: body }
    });

    await client.query('COMMIT');

    return NextResponse.json(
      { success: true, data: sale },
      { status: 201 }
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating sale:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create sale' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}