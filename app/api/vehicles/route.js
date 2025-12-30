import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { validateVehicle } from '@/lib/validations/vehicle';
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
    const type = searchParams.get('type');
    const make = searchParams.get('make');
    const model = searchParams.get('model');
    const yearMin = searchParams.get('yearMin');
    const yearMax = searchParams.get('yearMax');
    const priceMin = searchParams.get('priceMin');
    const priceMax = searchParams.get('priceMax');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        v.*,
        c.name as customer_name,
        c.email as customer_email
      FROM vehicles v
      LEFT JOIN customers c ON v.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (status) {
      sql += ` AND v.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (type) {
      sql += ` AND v.type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    if (make) {
      sql += ` AND v.make ILIKE $${paramCount}`;
      params.push(`%${make}%`);
      paramCount++;
    }

    if (model) {
      sql += ` AND v.model ILIKE $${paramCount}`;
      params.push(`%${model}%`);
      paramCount++;
    }

    if (yearMin) {
      sql += ` AND v.year >= $${paramCount}`;
      params.push(parseInt(yearMin));
      paramCount++;
    }

    if (yearMax) {
      sql += ` AND v.year <= $${paramCount}`;
      params.push(parseInt(yearMax));
      paramCount++;
    }

    if (priceMin) {
      sql += ` AND v.price >= $${paramCount}`;
      params.push(parseFloat(priceMin));
      paramCount++;
    }

    if (priceMax) {
      sql += ` AND v.price <= $${paramCount}`;
      params.push(parseFloat(priceMax));
      paramCount++;
    }

    if (search) {
      sql += ` AND (
        v.make ILIKE $${paramCount} OR 
        v.model ILIKE $${paramCount} OR 
        v.vin ILIKE $${paramCount} OR
        v.stock_number ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as filtered_vehicles`;
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].total);

    sql += ` ORDER BY v.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
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
    console.error('Error fetching vehicles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vehicles' },
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
    const validation = validateVehicle(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const {
      vin,
      stock_number,
      type,
      status,
      make,
      model,
      year,
      trim,
      exterior_color,
      interior_color,
      mileage,
      transmission,
      fuel_type,
      engine,
      drivetrain,
      body_style,
      price,
      cost,
      msrp,
      customer_id,
      features,
      condition_notes,
      location
    } = body;

    await client.query('BEGIN');

    // Check for duplicate VIN
    const vinCheck = await client.query(
      'SELECT id FROM vehicles WHERE vin = $1',
      [vin]
    );

    if (vinCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'Vehicle with this VIN already exists' },
        { status: 400 }
      );
    }

    const result = await client.query(
      `INSERT INTO vehicles (
        vin, stock_number, type, status, make, model, year, trim,
        exterior_color, interior_color, mileage, transmission, fuel_type,
        engine, drivetrain, body_style, price, cost, msrp, customer_id,
        features, condition_notes, location, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING *`,
      [
        vin,
        stock_number,
        type,
        status || 'available',
        make,
        model,
        year,
        trim,
        exterior_color,
        interior_color,
        mileage,
        transmission,
        fuel_type,
        engine,
        drivetrain,
        body_style,
        price,
        cost,
        msrp,
        customer_id,
        JSON.stringify(features || []),
        condition_notes,
        location,
        user.id
      ]
    );

    const vehicle = result.rows[0];

    await logAudit({
      user_id: user.id,
      action: 'CREATE',
      resource_type: 'vehicle',
      resource_id: vehicle.id,
      details: { vehicle_data: body }
    });

    await client.query('COMMIT');

    return NextResponse.json(
      { success: true, data: vehicle },
      { status: 201 }
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating vehicle:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create vehicle' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}