import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { validateLead } from '@/lib/validations/lead';
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
    const source = searchParams.get('source');
    const assignedTo = searchParams.get('assignedTo');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        l.*,
        u.name as assigned_to_name,
        u.email as assigned_to_email,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone
      FROM leads l
      LEFT JOIN users u ON l.assigned_to = u.id
      LEFT JOIN customers c ON l.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (status) {
      sql += ` AND l.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (source) {
      sql += ` AND l.source = $${paramCount}`;
      params.push(source);
      paramCount++;
    }

    if (assignedTo) {
      sql += ` AND l.assigned_to = $${paramCount}`;
      params.push(assignedTo);
      paramCount++;
    }

    if (search) {
      sql += ` AND (
        c.name ILIKE $${paramCount} OR 
        c.email ILIKE $${paramCount} OR 
        c.phone ILIKE $${paramCount} OR
        l.notes ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    // Count total records
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as filtered_leads`;
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    sql += ` ORDER BY l.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
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
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leads' },
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
    const validation = validateLead(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const {
      customer_id,
      source,
      status,
      interest_type,
      vehicle_of_interest,
      budget_min,
      budget_max,
      trade_in_vehicle,
      notes,
      assigned_to,
      expected_close_date,
      priority
    } = body;

    await client.query('BEGIN');

    // Calculate AI score based on lead quality
    const aiScore = await calculateLeadScore({
      source,
      budget_min,
      budget_max,
      interest_type,
      expected_close_date
    });

    const result = await client.query(
      `INSERT INTO leads (
        customer_id, source, status, interest_type, vehicle_of_interest,
        budget_min, budget_max, trade_in_vehicle, notes, assigned_to,
        expected_close_date, priority, ai_score, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        customer_id,
        source,
        status || 'new',
        interest_type,
        vehicle_of_interest,
        budget_min,
        budget_max,
        trade_in_vehicle,
        notes,
        assigned_to,
        expected_close_date,
        priority || 'medium',
        aiScore,
        user.id
      ]
    );

    const lead = result.rows[0];

    // Log audit trail
    await logAudit({
      user_id: user.id,
      action: 'CREATE',
      resource_type: 'lead',
      resource_id: lead.id,
      details: { lead_data: body }
    });

    await client.query('COMMIT');

    return NextResponse.json(
      { success: true, data: lead },
      { status: 201 }
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create lead' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

async function calculateLeadScore(leadData) {
  let score = 50; // Base score

  // Source scoring
  const sourceScores = {
    'website': 10,
    'referral': 15,
    'walk-in': 12,
    'phone': 8,
    'email': 7,
    'social-media': 5
  };
  score += sourceScores[leadData.source] || 5;

  // Budget scoring
  if (leadData.budget_min && leadData.budget_max) {
    const avgBudget = (leadData.budget_min + leadData.budget_max) / 2;
    if (avgBudget > 50000) score += 20;
    else if (avgBudget > 30000) score += 15;
    else if (avgBudget > 15000) score += 10;
    else score += 5;
  }

  // Timeline scoring
  if (leadData.expected_close_date) {
    const daysUntilClose = Math.ceil(
      (new Date(leadData.expected_close_date) - new Date()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilClose <= 7) score += 15;
    else if (daysUntilClose <= 30) score += 10;
    else if (daysUntilClose <= 90) score += 5;
  }

  return Math.min(100, Math.max(0, score));
}