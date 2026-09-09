import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL || 
  'postgresql://neondb_owner:npg_IDfEm7NR9gHC@ep-winter-moon-axhp8k01-pooler.c-4.us-east-2.aws.neon.tech/clgbytes?sslmode=require';

const sql = neon(DATABASE_URL);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {}
  }

  const urlMatch = (req.url || '').match(/\/api\/orders\/([^\/\?]+)/);
  const urlId = urlMatch && !['assign-partner', 'status', 'delete'].includes(urlMatch[1]) ? urlMatch[1] : null;
  const orderId = body.orderId || body.order_id || req.query.id || urlId;

  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  try {
    await sql`DELETE FROM orders WHERE id = ${orderId};`;
    return res.status(200).json({ success: true, message: `Order #${orderId} deleted` });
  } catch (err) {
    console.error('[Delete Order Error]:', err.message);
    return res.status(500).json({ error: 'Failed to delete order: ' + err.message });
  }
}
