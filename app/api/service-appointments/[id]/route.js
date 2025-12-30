import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { validateServiceAppointment } from '@/lib/validations/service';
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
        sa.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        v.make, v.model, v.year, v.vin, v.mileage,
        v.exterior_color, v.interior_color,
        u.name as service_advisor_name,
        u.email as service_advisor_email,
        creator.name as created_by_name
      FROM service_appointments sa
      LEFT JOIN customers c ON sa.customer_id = c.id
      LEFT JOIN vehicles v ON sa.vehicle_id = v.id
      LEFT JOIN users u ON sa.service_advisor_id = u.id
      LEFT JOIN users creator ON sa.created_by = creator.id
      WHERE sa.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Service appointment not found' },
        { status: 404 }
      );
    }

    // Get associated repair orders
    const repairOrders = await query(
      `SELECT * FROM repair_orders
       WHERE service_appointment_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    const appointment = {
      ...result.rows[0],
      repair_orders: repairOrders.rows
    };

    return NextResponse.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Error fetching service appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch service appointment' },
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

    const currentAppointment = await query('SELECT * FROM service_appointments WHERE id = $1', [id]);
    if (currentAppointment.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Service appointment not found' },
        { status: 404 }
      );
    }

    const validation = validateServiceAppointment(body, true);
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
      'scheduled_date', 'scheduled_time', 'service_type', 'description',
      'estimated_duration', 'estimated_cost', 'actual_start_time',
      'actual_end_time', 'actual_cost', 'status', 'priority', 'notes'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateFields.push(`${field} = $${paramCount}`);
        updateValues.push(body[field]);
        paramCount++;
      }
    });

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(id);

    const result = await client.query(
      `UPDATE service_appointments SET ${updateFields.join(', ')} 
       WHERE id = $${paramCount}
       RETURNING *`,
      updateValues
    );

    await logAudit({
      user_id: user.id,
      action: 'UPDATE',
      resource_type: 'service_appointment',
      resource_id: id,
      details: {
        old_data: currentAppointment.rows[0],
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
    console.error('Error updating service appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update service appointment' },
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

    const appointmentCheck = await query('SELECT * FROM service_appointments WHERE id = $1', [id]);
    if (appointmentCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Service appointment not found' },
        { status: 404 }
      );
    }

    await client.query('BEGIN');

    // Check for associated repair orders
    const roCheck = await client.query(
      'SELECT COUNT(*) as count FROM repair_orders WHERE service_appointment_id = $1',
      [id]
    );

    if (parseInt(roCheck.rows[0].count) > 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'Cannot delete appointment with associated repair orders' },
        { status: 400 }
      );
    }

    await client.query('DELETE FROM service_appointments WHERE id = $1', [id]);

    await logAudit({
      user_id: user.id,
      action: 'DELETE',
      resource_type: 'service_appointment',
      resource_id: id,
      details: { appointment_data: appointmentCheck.rows[0] }
    });

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Service appointment deleted successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting service appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete service appointment' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}