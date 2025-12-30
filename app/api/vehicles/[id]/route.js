import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { validateVehicle } from '@/lib/validations/vehicle';
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
        v.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        creator.name as created_by_name
      FROM vehicles v
      LEFT JOIN customers c ON v.customer_id = c.id
      LEFT JOIN users creator ON v.created_by = creator.id
      WHERE v.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    // Get service history
    const serviceHistory = await query(
      `SELECT sa.*, ro.total_cost, ro.status as repair_status
       FROM service_appointments sa
       LEFT JOIN repair_orders ro ON sa.id = ro.service_appointment_id
       WHERE sa.vehicle_id = $1
       ORDER BY sa.scheduled_date DESC
       LIMIT 10`,
      [id]
    );

    const vehicle = {
      ...result.rows[0],
      service_history: serviceHistory.rows
    };

    return NextResponse.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vehicle' },
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

    const currentVehicle = await query('SELECT * FROM vehicles WHERE id = $1', [id]);
    if (currentVehicle.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    const validation = validateVehicle(body, true);
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
      'stock_number', 'status', 'make', 'model', 'year', 'trim',
      'exterior_color', 'interior_color', 'mileage', 'transmission',
      'fuel_type', 'engine', 'drivetrain', 'body_style', 'price',
      'cost', 'msrp', 'customer_id', 'features', 'condition_notes', 'location'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        if (field === 'features') {
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
      `UPDATE vehicles SET ${updateFields.join(', ')} 
       WHERE id = $${paramCount}
       RETURNING *`,
      updateValues
    );

    await logAudit({
      user_id: user.id,
      action: 'UPDATE',
      resource_type: 'vehicle',
      resource_id: id,
      details: {
        old_data: currentVehicle.rows[0],
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
    console.error('Error updating vehicle:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update vehicle' },
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

    const vehicleCheck = await query('SELECT * FROM vehicles WHERE id = $1', [id]);
    if (vehicleCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    await client.query('BEGIN');

    // Check for dependencies
    const salesCheck = await client.query(
      'SELECT COUNT(*) as count FROM sales WHERE vehicle_id = $1',
      [id]
    );

    if (parseInt(salesCheck.rows[0].count) > 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'Cannot delete vehicle with associated sales records' },
        { status: 400 }
      );
    }

    await client.query('DELETE FROM vehicles WHERE id = $1', [id]);

    await logAudit({
      user_id: user.id,
      action: 'DELETE',
      resource_type: 'vehicle',
      resource_id: id,
      details: { vehicle_data: vehicleCheck.rows[0] }
    });

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting vehicle:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete vehicle' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}