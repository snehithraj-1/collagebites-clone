import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL || 
  'postgresql://neondb_owner:npg_IDfEm7NR9gHC@ep-winter-moon-axhp8k01-pooler.c-4.us-east-2.aws.neon.tech/clgbytes?sslmode=require';

const sql = neon(DATABASE_URL);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  try {
    const { is_open } = req.body || {};
    let targetState = Boolean(is_open);

    if (typeof is_open === 'undefined') {
      const curr = await sql`SELECT is_open FROM restaurants WHERE id = ${id} LIMIT 1;`;
      if (curr && curr.length > 0) {
        targetState = !(curr[0].is_open !== false);
      }
    }

    const rows = await sql`
      UPDATE restaurants 
      SET is_open = ${targetState}, updated_at = NOW()
      WHERE id = ${id} OR id LIKE ${id + '%'}
      RETURNING *;
    `;
    return res.status(200).json({ success: true, restaurant: rows[0] });
  } catch (err) {
    console.error('[Update Restaurant Error]:', err.message);
    return res.status(500).json({ error: 'Failed to update restaurant: ' + err.message });
  }
}
