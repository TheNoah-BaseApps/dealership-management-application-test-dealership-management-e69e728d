import { pool } from '@/lib/database/aurora';

export const db = {
  query: async (text, params) => {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  },
  
  getClient: async () => {
    return await pool.connect();
  }
};

export default db;