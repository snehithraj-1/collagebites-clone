import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL || 
  'postgresql://neondb_owner:npg_IDfEm7NR9gHC@ep-winter-moon-axhp8k01-pooler.c-4.us-east-2.aws.neon.tech/clgbytes?sslmode=require';

const sql = neon(DATABASE_URL);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const rows = await sql`
        SELECT 
          id, 
          name, 
          phone, 
          is_active as "isActive", 
          total_deliveries as "totalDeliveries", 
          created_at as "createdAt"
        FROM delivery_partners 
        ORDER BY name ASC;
      `;
      return res.status(200).json({ success: true, partners: rows });
    } catch (err) {
      console.error('[Delivery Partners GET Error]:', err.message);
      return res.status(500).json({ error: 'Failed to fetch delivery partners: ' + err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, phone } = req.body || {};
      if (!name || !phone) {
        return res.status(400).json({ error: 'Name and phone are required' });
      }
      const id = 'dp-' + Date.now().toString(36);
      const rows = await sql`
        INSERT INTO delivery_partners (id, name, phone, is_active, total_deliveries, created_at, updated_at)
        VALUES (${id}, ${name.trim()}, ${phone.trim()}, true, 0, NOW(), NOW())
        RETURNING *;
      `;
      return res.status(201).json({ success: true, partner: rows[0] });
    } catch (err) {
      console.error('[Delivery Partners POST Error]:', err.message);
      return res.status(500).json({ error: 'Failed to add courier: ' + err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
