import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { validateCustomer } from '@/lib/validations/customer';
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
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        c.*,
        COUNT(DISTINCT s.id) as total_purchases,
        COUNT(DISTINCT sa.id) as total_service_visits,
        COALESCE(SUM(s.final_price), 0) as lifetime_value
      FROM customers c
      LEFT JOIN sales s ON c.id = s.customer_id
      LEFT JOIN service_appointments sa ON c.id = sa.customer_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (type) {
      sql += ` AND c.type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    if (search) {
      sql += ` AND (
        c.name ILIKE $${paramCount} OR 
        c.email ILIKE $${paramCount} OR 
        c.phone ILIKE $${paramCount} OR
        c.company ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    sql += ` GROUP BY c.id`;

    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as filtered_customers`;
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].total);

    sql += ` ORDER BY c.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
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
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
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
    const validation = validateCustomer(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      phone,
      type,
      company,
      address,
      city,
      state,
      zip_code,
      date_of_birth,
      drivers_license,
      notes,
      preferences,
      tags
    } = body;

    await client.query('BEGIN');

    // Check for duplicate email
    const emailCheck = await client.query(
      'SELECT id FROM customers WHERE email = $1',
      [email]
    );

    if (emailCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'Customer with this email already exists' },
        { status: 400 }
      );
    }

    const result = await client.query(
      `INSERT INTO customers (
        name, email, phone, type, company, address, city, state, zip_code,
        date_of_birth, drivers_license, notes, preferences, tags, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        name,
        email,
        phone,
        type || 'individual',
        company,
        address,
        city,
        state,
        zip_code,
        date_of_birth,
        drivers_license,
        notes,
        JSON.stringify(preferences || {}),
        JSON.stringify(tags || []),
        user.id
      ]
    );

    const customer = result.rows[0];

    await logAudit({
      user_id: user.id,
      action: 'CREATE',
      resource_type: 'customer',
      resource_id: customer.id,
      details: { customer_data: body }
    });

    await client.query('COMMIT');

    return NextResponse.json(
      { success: true, data: customer },
      { status: 201 }
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create customer' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}