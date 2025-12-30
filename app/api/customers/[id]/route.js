import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { validateCustomer } from '@/lib/validations/customer';
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
        c.*,
        creator.name as created_by_name,
        COUNT(DISTINCT s.id) as total_purchases,
        COUNT(DISTINCT sa.id) as total_service_visits,
        COALESCE(SUM(s.final_price), 0) as lifetime_value
      FROM customers c
      LEFT JOIN users creator ON c.created_by = creator.id
      LEFT JOIN sales s ON c.id = s.customer_id
      LEFT JOIN service_appointments sa ON c.id = sa.customer_id
      WHERE c.id = $1
      GROUP BY c.id, creator.name`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get owned vehicles
    const vehicles = await query(
      `SELECT * FROM vehicles WHERE customer_id = $1 ORDER BY created_at DESC`,
      [id]
    );

    // Get recent sales
    const sales = await query(
      `SELECT s.*, v.make, v.model, v.year, v.vin
       FROM sales s
       LEFT JOIN vehicles v ON s.vehicle_id = v.id
       WHERE s.customer_id = $1
       ORDER BY s.sale_date DESC
       LIMIT 5`,
      [id]
    );

    // Get service appointments
    const serviceAppointments = await query(
      `SELECT sa.*, v.make, v.model, v.year, v.vin
       FROM service_appointments sa
       LEFT JOIN vehicles v ON sa.vehicle_id = v.id
       WHERE sa.customer_id = $1
       ORDER BY sa.scheduled_date DESC
       LIMIT 10`,
      [id]
    );

    // Get communications
    const communications = await query(
      `SELECT * FROM communications
       WHERE related_to_type = 'customer' AND related_to_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [id]
    );

    const customer = {
      ...result.rows[0],
      vehicles: vehicles.rows,
      recent_sales: sales.rows,
      service_appointments: serviceAppointments.rows,
      recent_communications: communications.rows
    };

    return NextResponse.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer' },
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

    const currentCustomer = await query('SELECT * FROM customers WHERE id = $1', [id]);
    if (currentCustomer.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    const validation = validateCustomer(body, true);
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
      'name', 'email', 'phone', 'type', 'company', 'address', 'city',
      'state', 'zip_code', 'date_of_birth', 'drivers_license', 'notes',
      'preferences', 'tags'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        if (field === 'preferences' || field === 'tags') {
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
      `UPDATE customers SET ${updateFields.join(', ')} 
       WHERE id = $${paramCount}
       RETURNING *`,
      updateValues
    );

    await logAudit({
      user_id: user.id,
      action: 'UPDATE',
      resource_type: 'customer',
      resource_id: id,
      details: {
        old_data: currentCustomer.rows[0],
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
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update customer' },
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

    const customerCheck = await query('SELECT * FROM customers WHERE id = $1', [id]);
    if (customerCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    await client.query('BEGIN');

    // Check for dependencies
    const salesCheck = await client.query(
      'SELECT COUNT(*) as count FROM sales WHERE customer_id = $1',
      [id]
    );

    if (parseInt(salesCheck.rows[0].count) > 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'Cannot delete customer with associated sales records' },
        { status: 400 }
      );
    }

    await client.query('DELETE FROM customers WHERE id = $1', [id]);

    await logAudit({
      user_id: user.id,
      action: 'DELETE',
      resource_type: 'customer',
      resource_id: id,
      details: { customer_data: customerCheck.rows[0] }
    });

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete customer' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}