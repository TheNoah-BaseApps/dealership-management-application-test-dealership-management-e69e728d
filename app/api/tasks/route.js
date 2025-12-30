import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { validateTask } from '@/lib/validations/task';
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
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assignedTo');
    const dueDate = searchParams.get('dueDate');
    const relatedType = searchParams.get('relatedType');
    const relatedId = searchParams.get('relatedId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        t.*,
        u.name as assigned_to_name,
        u.email as assigned_to_email,
        creator.name as created_by_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users creator ON t.created_by = creator.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (status) {
      sql += ` AND t.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (priority) {
      sql += ` AND t.priority = $${paramCount}`;
      params.push(priority);
      paramCount++;
    }

    if (assignedTo) {
      sql += ` AND t.assigned_to = $${paramCount}`;
      params.push(assignedTo);
      paramCount++;
    }

    if (dueDate) {
      sql += ` AND t.due_date::date = $${paramCount}::date`;
      params.push(dueDate);
      paramCount++;
    }

    if (relatedType && relatedId) {
      sql += ` AND t.related_to_type = $${paramCount} AND t.related_to_id = $${paramCount + 1}`;
      params.push(relatedType, relatedId);
      paramCount += 2;
    }

    if (search) {
      sql += ` AND (
        t.title ILIKE $${paramCount} OR 
        t.description ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as filtered_tasks`;
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].total);

    sql += ` ORDER BY 
      CASE t.priority 
        WHEN 'urgent' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        WHEN 'low' THEN 4 
      END,
      t.due_date ASC NULLS LAST
      LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
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
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
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
    const validation = validateTask(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      status,
      priority,
      assigned_to,
      due_date,
      related_to_type,
      related_to_id,
      tags,
      checklist
    } = body;

    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO tasks (
        title, description, status, priority, assigned_to, due_date,
        related_to_type, related_to_id, tags, checklist, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        title,
        description,
        status || 'pending',
        priority || 'medium',
        assigned_to,
        due_date,
        related_to_type,
        related_to_id,
        JSON.stringify(tags || []),
        JSON.stringify(checklist || []),
        user.id
      ]
    );

    const task = result.rows[0];

    await logAudit({
      user_id: user.id,
      action: 'CREATE',
      resource_type: 'task',
      resource_id: task.id,
      details: { task_data: body }
    });

    await client.query('COMMIT');

    return NextResponse.json(
      { success: true, data: task },
      { status: 201 }
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create task' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}