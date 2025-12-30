import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { validateSale } from '@/lib/validations/sale';
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
        s.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.address as customer_address,
        v.make, v.model, v.year, v.vin, v.stock_number, v.mileage,
        v.exterior_color, v.interior_color,
        u.name as salesperson_name,
        u.email as salesperson_email,
        creator.name as created_by_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN vehicles v ON s.vehicle_id = v.id
      LEFT JOIN users u ON s.salesperson_id = u.id
      LEFT JOIN users creator ON s.created_by = creator.id
      WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sale not found' },
        { status: 404 }
      );
    }

    // Get associated documents
    const documents = await query(
      `SELECT * FROM documents
       WHERE related_to_type = 'sale' AND related_to_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    const sale = {
      ...result.rows[0],
      documents: documents.rows
    };

    return NextResponse.json({
      success: true,
      data: sale
    });
  } catch (error) {
    console.error('Error fetching sale:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sale' },
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

    const currentSale = await query('SELECT * FROM sales WHERE id = $1', [id]);
    if (currentSale.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sale not found' },
        { status: 404 }
      );
    }

    const validation = validateSale(body, true);
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
      'sale_date', 'sale_price', 'trade_in_value', 'down_payment',
      'financing_amount', 'monthly_payment', 'term_months', 'interest_rate',
      'finance_company', 'tax_amount', 'fees', 'final_price', 'payment_method',
      'status', 'delivery_date', 'warranty_info', 'notes'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        if (field === 'fees' || field === 'warranty_info') {
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
      `UPDATE sales SET ${updateFields.join(', ')} 
       WHERE id = $${paramCount}
       RETURNING *`,
      updateValues
    );

    await logAudit({
      user_id: user.id,
      action: 'UPDATE',
      resource_type: 'sale',
      resource_id: id,
      details: {
        old_data: currentSale.rows[0],
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
    console.error('Error updating sale:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update sale' },
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

    const saleCheck = await query('SELECT * FROM sales WHERE id = $1', [id]);
    if (saleCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sale not found' },
        { status: 404 }
      );
    }

    await client.query('BEGIN');

    const vehicleId = saleCheck.rows[0].vehicle_id;

    // Delete sale
    await client.query('DELETE FROM sales WHERE id = $1', [id]);

    // Update vehicle status back to available
    await client.query(
      `UPDATE vehicles SET status = 'available', customer_id = NULL, updated_at = NOW() WHERE id = $1`,
      [vehicleId]
    );

    await logAudit({
      user_id: user.id,
      action: 'DELETE',
      resource_type: 'sale',
      resource_id: id,
      details: { sale_data: saleCheck.rows[0] }
    });

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Sale deleted successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting sale:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete sale' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}