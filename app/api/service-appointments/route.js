import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { validateServiceAppointment } from '@/lib/validations/service';
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
    const serviceAdvisor = searchParams.get('serviceAdvisor');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        sa.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        v.make, v.model, v.year, v.vin, v.mileage,
        u.name as service_advisor_name
      FROM service_appointments sa
      LEFT JOIN customers c ON sa.customer_id = c.id
      LEFT JOIN vehicles v ON sa.vehicle_id = v.id
      LEFT JOIN users u ON sa.service_advisor_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (status) {
      sql += ` AND sa.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (serviceAdvisor) {
      sql += ` AND sa.service_advisor_id = $${paramCount}`;
      params.push(serviceAdvisor);
      paramCount++;
    }

    if (dateFrom) {
      sql += ` AND sa.scheduled_date >= $${paramCount}`;
      params.push(dateFrom);
      paramCount++;
    }

    if (dateTo) {
      sql += ` AND sa.scheduled_date <= $${paramCount}`;
      params.push(dateTo);
      paramCount++;
    }

    if (search) {
      sql += ` AND (
        c.name ILIKE $${paramCount} OR 
        v.vin ILIKE $${paramCount} OR 
        sa.description ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as filtered_appointments`;
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].total);

    sql += ` ORDER BY sa.scheduled_date ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
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
    console.error('Error fetching service appointments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch service appointments' },
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
    const validation = validateServiceAppointment(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const {
      customer_id,
      vehicle_id,
      service_advisor_id,
      scheduled_date,
      scheduled_time,
      service_type,
      description,
      estimated_duration,
      estimated_cost,
      status,
      priority,
      notes
    } = body;

    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO service_appointments (
        customer_id, vehicle_id, service_advisor_id, scheduled_date,
        scheduled_time, service_type, description, estimated_duration,
        estimated_cost, status, priority, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        customer_id,
        vehicle_id,
        service_advisor_id,
        scheduled_date,
        scheduled_time,
        service_type,
        description,
        estimated_duration,
        estimated_cost,
        status || 'scheduled',
        priority || 'normal',
        notes,
        user.id
      ]
    );

    const appointment = result.rows[0];

    await logAudit({
      user_id: user.id,
      action: 'CREATE',
      resource_type: 'service_appointment',
      resource_id: appointment.id,
      details: { appointment_data: body }
    });

    await client.query('COMMIT');

    return NextResponse.json(
      { success: true, data: appointment },
      { status: 201 }
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating service appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create service appointment' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}