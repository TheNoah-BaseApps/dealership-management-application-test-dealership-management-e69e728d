import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { pool } from '@/lib/database/aurora';

export const getCurrentUser = async () => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return null;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return null;
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id, email, first_name, last_name, role, status FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

export const requireAuth = async () => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
};

export const checkPermission = (user, requiredRole) => {
  const roleHierarchy = {
    admin: 7,
    sales_manager: 6,
    service_manager: 5,
    finance: 4,
    sales_rep: 3,
    technician: 2,
    viewer: 1
  };

  const userLevel = roleHierarchy[user.role] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  return userLevel >= requiredLevel;
};

export default {
  getCurrentUser,
  requireAuth,
  checkPermission
};