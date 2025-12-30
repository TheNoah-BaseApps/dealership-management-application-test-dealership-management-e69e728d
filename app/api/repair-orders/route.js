import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
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
    const technician = searchParams.get('technician');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        ro.*,
        sa.scheduled_date,
        c.name as customer_name,
        v.make, v.model, v.year, v.vin,
        t.name as technician_name
      FROM repair_orders ro
      LEFT JOIN service_appointments sa ON ro.service_appointment_id = sa.id
      LEFT JOIN customers c ON ro.customer_id = c.id
      LEFT JOIN vehicles v ON ro.vehicle_id = v.id
      LEFT JOIN users t ON ro.technician_id = t.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (status) {
      sql += ` AND ro.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (technician) {
      sql += ` AND ro.technician_id = $${paramCount}`;
      params.push(technician);
      paramCount++;
    }

    if (search) {
      sql += ` AND (
        c.name ILIKE $${paramCount} OR 
        v.vin ILIKE $${paramCount} OR 
        ro.ro_number ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as filtered_orders`;
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].total);

    sql += ` ORDER BY ro.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
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
    console.error('Error fetching repair orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch repair orders' },
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
    const {
      service_appointment_id,
      customer_id,
      vehicle_id,
      technician_id,
      ro_number,
      description,
      services,
      parts,
      labor_hours,
      labor_rate,
      parts_cost,
      labor_cost,
      tax_amount,
      total_cost,
      status,
      priority,
      notes
    } = body;

    if (!customer_id || !vehicle_id) {
      return NextResponse.json(
        { success: false, error: 'Customer and vehicle are required' },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    // Generate RO number if not provided
    let roNumber = ro_number;
    if (!roNumber) {
      const roCount = await client.query(
        'SELECT COUNT(*) as count FROM repair_orders WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())'
      );
      const count = parseInt(roCount.rows[0].count) + 1;
      const year = new Date().getFullYear();
      roNumber = `RO-${year}-${String(count).padStart(6, '0')}`;
    }

    const result = await client.query(
      `INSERT INTO repair_orders (
        service_appointment_id, customer_id, vehicle_id, technician_id,
        ro_number, description, services, parts, labor_hours, labor_rate,
        parts_cost, labor_cost, tax_amount, total_cost, status, priority,
        notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        service_appointment_id,
        customer_id,
        vehicle_id,
        technician_id,
        roNumber,
        description,
        JSON.stringify(services || []),
        JSON.stringify(parts || []),
        labor_hours,
        labor_rate,
        parts_cost,
        labor_cost,
        tax_amount,
        total_cost,
        status || 'open',
        priority || 'normal',
        notes,
        user.id
      ]
    );

    const repairOrder = result.rows[0];

    await logAudit({
      user_id: user.id,
      action: 'CREATE',
      resource_type: 'repair_order',
      resource_id: repairOrder.id,
      details: { repair_order_data: body }
    });

    await client.query('COMMIT');

    return NextResponse.json(
      { success: true, data: repairOrder },
      { status: 201 }
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating repair order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create repair order' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}