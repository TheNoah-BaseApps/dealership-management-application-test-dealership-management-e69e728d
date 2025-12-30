import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { validatePart } from '@/lib/validations/part';
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
    const category = searchParams.get('category');
    const inStock = searchParams.get('inStock');
    const lowStock = searchParams.get('lowStock');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        p.*,
        s.name as supplier_name,
        s.contact_person as supplier_contact
      FROM parts p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (category) {
      sql += ` AND p.category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (inStock === 'true') {
      sql += ` AND p.quantity_in_stock > 0`;
    }

    if (lowStock === 'true') {
      sql += ` AND p.quantity_in_stock <= p.reorder_level`;
    }

    if (search) {
      sql += ` AND (
        p.part_number ILIKE $${paramCount} OR 
        p.name ILIKE $${paramCount} OR 
        p.description ILIKE $${paramCount} OR
        p.manufacturer ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as filtered_parts`;
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].total);

    sql += ` ORDER BY p.name ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
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
    console.error('Error fetching parts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch parts' },
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
    const validation = validatePart(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const {
      part_number,
      name,
      description,
      category,
      manufacturer,
      supplier_id,
      cost_price,
      selling_price,
      quantity_in_stock,
      reorder_level,
      location,
      notes,
      compatible_vehicles
    } = body;

    await client.query('BEGIN');

    // Check for duplicate part number
    const partCheck = await client.query(
      'SELECT id FROM parts WHERE part_number = $1',
      [part_number]
    );

    if (partCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'Part with this part number already exists' },
        { status: 400 }
      );
    }

    const result = await client.query(
      `INSERT INTO parts (
        part_number, name, description, category, manufacturer, supplier_id,
        cost_price, selling_price, quantity_in_stock, reorder_level,
        location, notes, compatible_vehicles, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        part_number,
        name,
        description,
        category,
        manufacturer,
        supplier_id,
        cost_price,
        selling_price,
        quantity_in_stock || 0,
        reorder_level || 10,
        location,
        notes,
        JSON.stringify(compatible_vehicles || []),
        user.id
      ]
    );

    const part = result.rows[0];

    await logAudit({
      user_id: user.id,
      action: 'CREATE',
      resource_type: 'part',
      resource_id: part.id,
      details: { part_data: body }
    });

    await client.query('COMMIT');

    return NextResponse.json(
      { success: true, data: part },
      { status: 201 }
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating part:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create part' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}