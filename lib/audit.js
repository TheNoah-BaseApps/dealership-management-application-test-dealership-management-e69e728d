import { pool } from '@/lib/database/aurora';

export const logAudit = async ({ userId, action, entityType, entityId, details, ipAddress }) => {
  try {
    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [userId, action, entityType, entityId, JSON.stringify(details), ipAddress]
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

export const getAuditLogs = async ({ userId, entityType, entityId, limit = 100 }) => {
  const client = await pool.connect();
  try {
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (userId) {
      query += ` AND user_id = $${paramCount}`;
      params.push(userId);
      paramCount++;
    }

    if (entityType) {
      query += ` AND entity_type = $${paramCount}`;
      params.push(entityType);
      paramCount++;
    }

    if (entityId) {
      query += ` AND entity_id = $${paramCount}`;
      params.push(entityId);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
    params.push(limit);

    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
};

export default {
  logAudit,
  getAuditLogs
};