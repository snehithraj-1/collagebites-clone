import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL || 
  'postgresql://neondb_owner:npg_IDfEm7NR9gHC@ep-winter-moon-axhp8k01-pooler.c-4.us-east-2.aws.neon.tech/clgbytes?sslmode=require';

const sql = neon(DATABASE_URL);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (req.method === 'PATCH') {
    try {
      const { isActive, is_active } = req.body || {};
      const activeState = typeof isActive !== 'undefined' ? Boolean(isActive) : Boolean(is_active);

      const rows = await sql`
        UPDATE delivery_partners 
        SET is_active = ${activeState}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *;
      `;
      return res.status(200).json({ success: true, partner: rows[0] });
    } catch (err) {
      console.error('[Update Courier Error]:', err.message);
      return res.status(500).json({ error: 'Failed to update courier: ' + err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await sql`DELETE FROM delivery_partners WHERE id = ${id};`;
      return res.status(200).json({ success: true, message: 'Courier deleted' });
    } catch (err) {
      console.error('[Delete Courier Error]:', err.message);
      return res.status(500).json({ error: 'Failed to delete courier: ' + err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
