import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { validateLead } from '@/lib/validations/lead';
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
        l.*,
        u.name as assigned_to_name,
        u.email as assigned_to_email,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.address as customer_address,
        creator.name as created_by_name
      FROM leads l
      LEFT JOIN users u ON l.assigned_to = u.id
      LEFT JOIN customers c ON l.customer_id = c.id
      LEFT JOIN users creator ON l.created_by = creator.id
      WHERE l.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Get related activities/communications
    const activities = await query(
      `SELECT * FROM communications 
       WHERE related_to_type = 'lead' AND related_to_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [id]
    );

    const lead = {
      ...result.rows[0],
      recent_activities: activities.rows
    };

    return NextResponse.json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('Error fetching lead:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lead' },
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

    // Get current lead data
    const currentLead = await query('SELECT * FROM leads WHERE id = $1', [id]);
    if (currentLead.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    const validation = validateLead(body, true); // Partial validation
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
      'source', 'status', 'interest_type', 'vehicle_of_interest',
      'budget_min', 'budget_max', 'trade_in_vehicle', 'notes',
      'assigned_to', 'expected_close_date', 'priority'
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
      `UPDATE leads SET ${updateFields.join(', ')} 
       WHERE id = $${paramCount}
       RETURNING *`,
      updateValues
    );

    await logAudit({
      user_id: user.id,
      action: 'UPDATE',
      resource_type: 'lead',
      resource_id: id,
      details: {
        old_data: currentLead.rows[0],
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
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update lead' },
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

    const leadCheck = await query('SELECT * FROM leads WHERE id = $1', [id]);
    if (leadCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    await client.query('BEGIN');

    // Soft delete by updating status
    await client.query(
      `UPDATE leads SET status = 'deleted', updated_at = NOW() WHERE id = $1`,
      [id]
    );

    await logAudit({
      user_id: user.id,
      action: 'DELETE',
      resource_type: 'lead',
      resource_id: id,
      details: { lead_data: leadCheck.rows[0] }
    });

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting lead:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete lead' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}