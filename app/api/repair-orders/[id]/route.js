import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
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
        ro.*,
        sa.scheduled_date,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        v.make, v.model, v.year, v.vin, v.mileage,
        t.name as technician_name,
        creator.name as created_by_name
      FROM repair_orders ro
      LEFT JOIN service_appointments sa ON ro.service_appointment_id = sa.id
      LEFT JOIN customers c ON ro.customer_id = c.id
      LEFT JOIN vehicles v ON ro.vehicle_id = v.id
      LEFT JOIN users t ON ro.technician_id = t.id
      LEFT JOIN users creator ON ro.created_by = creator.id
      WHERE ro.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Repair order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching repair order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch repair order' },
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

    const currentRO = await query('SELECT * FROM repair_orders WHERE id = $1', [id]);
    if (currentRO.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Repair order not found' },
        { status: 404 }
      );
    }

    await client.query('BEGIN');

    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    const allowedFields = [
      'technician_id', 'description', 'services', 'parts', 'labor_hours',
      'labor_rate', 'parts_cost', 'labor_cost', 'tax_amount', 'total_cost',
      'status', 'priority', 'notes', 'completed_date'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        if (field === 'services' || field === 'parts') {
          updateFields.push(`${field} = $${paramCount}`);
          updateValues.push(JSON.stringify(body[field]));
        } else {
          updateFields.push(`${field} = $${paramCount}`);
          updateValues.push(body[field]);
        }
        paramCount++;
      }
    });

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(id);

    const result = await client.query(
      `UPDATE repair_orders SET ${updateFields.join(', ')} 
       WHERE id = $${paramCount}
       RETURNING *`,
      updateValues
    );

    await logAudit({
      user_id: user.id,
      action: 'UPDATE',
      resource_type: 'repair_order',
      resource_id: id,
      details: {
        old_data: currentRO.rows[0],
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
    console.error('Error updating repair order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update repair order' },
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

    const roCheck = await query('SELECT * FROM repair_orders WHERE id = $1', [id]);
    if (roCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Repair order not found' },
        { status: 404 }
      );
    }

    await client.query('BEGIN');

    await client.query('DELETE FROM repair_orders WHERE id = $1', [id]);

    await logAudit({
      user_id: user.id,
      action: 'DELETE',
      resource_type: 'repair_order',
      resource_id: id,
      details: { repair_order_data: roCheck.rows[0] }
    });

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Repair order deleted successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting repair order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete repair order' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}