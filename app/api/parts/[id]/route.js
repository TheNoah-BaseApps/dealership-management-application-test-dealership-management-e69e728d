import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { validatePart } from '@/lib/validations/part';
import { logAudit } from '@/lib/audit';

export async function GET(request, { params }) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    const result = await query(
      `SELECT 
        p.*,
        s.name as supplier_name,
        s.contact_person as supplier_contact,
        s.email as supplier_email,
        s.phone as supplier_phone,
        creator.name as created_by_name
      FROM parts p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN users creator ON p.created_by = creator.id
      WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Part not found' },
        { status: 404 }
      );
    }

    // Get stock history
    const stockHistory = await query(
      `SELECT * FROM part_stock_history
       WHERE part_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [id]
    );

    const part = {
      ...result.rows[0],
      stock_history: stockHistory.rows
    };

    return NextResponse.json({
      success: true,
      data: part
    });
  } catch (error) {
    console.error('Error fetching part:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch part' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  const client = await getClient();
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();

    const currentPart = await query('SELECT * FROM parts WHERE id = $1', [id]);
    if (currentPart.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Part not found' },
        { status: 404 }
      );
    }

    const validation = validatePart(body, true);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    const allowedFields = [
      'name', 'description', 'category', 'manufacturer', 'supplier_id',
      'cost_price', 'selling_price', 'quantity_in_stock', 'reorder_level',
      'location', 'notes', 'compatible_vehicles'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        if (field === 'compatible_vehicles') {
          updateFields.push(`${field} = $${paramCount}`);
          updateValues.push(JSON.stringify(body[field]));
        } else {
          updateFields.push(`${field} = $${paramCount}`);
          updateValues.push(body[field]);
        }
        paramCount++;
      }
    });

    // Track stock changes
    if (body.quantity_in_stock !== undefined && body.quantity_in_stock !== currentPart.rows[0].quantity_in_stock) {
      await client.query(
        `INSERT INTO part_stock_history (part_id, previous_quantity, new_quantity, change_type, changed_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          id,
          currentPart.rows[0].quantity_in_stock,
          body.quantity_in_stock,
          body.quantity_in_stock > currentPart.rows[0].quantity_in_stock ? 'increase' : 'decrease',
          user.id
        ]
      );
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(id);

    const result = await client.query(
      `UPDATE parts SET ${updateFields.join(', ')} 
       WHERE id = $${paramCount}
       RETURNING *`,
      updateValues
    );

    await logAudit({
      user_id: user.id,
      action: 'UPDATE',
      resource_type: 'part',
      resource_id: id,
      details: {
        old_data: currentPart.rows[0],
        new_data: body
      }
    });

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating part:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update part' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function DELETE(request, { params }) {
  const client = await getClient();
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    const partCheck = await query('SELECT * FROM parts WHERE id = $1', [id]);
    if (partCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Part not found' },
        { status: 404 }
      );
    }

    await client.query('BEGIN');

    await client.query('DELETE FROM parts WHERE id = $1', [id]);

    await logAudit({
      user_id: user.id,
      action: 'DELETE',
      resource_type: 'part',
      resource_id: id,
      details: { part_data: partCheck.rows[0] }
    });

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Part deleted successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting part:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete part' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}