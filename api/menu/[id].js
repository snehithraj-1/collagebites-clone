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
      const { is_available, isAvailable } = req.body || {};
      const availableState = typeof isAvailable !== 'undefined' ? Boolean(isAvailable) : Boolean(is_available);

      await sql`
        UPDATE menu_items 
        SET is_available = ${availableState}, updated_at = NOW()
        WHERE id = ${id};
      `;
      return res.status(200).json({ success: true, id, isAvailable: availableState });
    } catch (err) {
      console.error('[Update Menu Item Error]:', err.message);
      return res.status(500).json({ error: 'Failed to update dish: ' + err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await sql`DELETE FROM menu_items WHERE id = ${id};`;
      return res.status(200).json({ success: true, message: `Dish #${id} deleted` });
    } catch (err) {
      console.error('[Delete Menu Item Error]:', err.message);
      return res.status(500).json({ error: 'Failed to delete dish: ' + err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
