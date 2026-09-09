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

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {}
  }

  const urlMatch = (req.url || '').match(/\/api\/orders\/([^\/\?]+)/);
  const urlId = urlMatch && !['assign-partner', 'status', 'delete'].includes(urlMatch[1]) ? urlMatch[1] : null;
  const orderId = body.orderId || body.order_id || req.query.id || urlId;
  const status = body.status || req.query.status;

  if (!orderId || !status) {
    return res.status(400).json({ error: 'Order ID and status are required' });
  }

  try {
    const updated = await sql`
      UPDATE orders 
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${orderId}
      RETURNING *;
    `;

    if (!updated || updated.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.status(200).json({ success: true, order: updated[0] });
  } catch (err) {
    console.error('[Order Status Update Error]:', err.message);
    return res.status(500).json({ error: 'Failed to update order status: ' + err.message });
  }
}
