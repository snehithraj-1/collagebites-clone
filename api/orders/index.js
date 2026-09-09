import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL || 
  'postgresql://neondb_owner:npg_IDfEm7NR9gHC@ep-winter-moon-axhp8k01-pooler.c-4.us-east-2.aws.neon.tech/clgbytes?sslmode=require';

const sql = neon(DATABASE_URL);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const restaurantId = req.query.restaurant_id || req.query.restaurant;
      let rows;
      if (restaurantId) {
        rows = await sql`
          SELECT * FROM orders 
          WHERE restaurant_id = ${restaurantId}
          ORDER BY created_at DESC 
          LIMIT 200;
        `;
      } else {
        rows = await sql`
          SELECT * FROM orders 
          ORDER BY created_at DESC 
          LIMIT 200;
        `;
      }
      const formatted = rows.map(r => ({
        id: r.id,
        studentName: r.student_name,
        studentEmail: r.student_email,
        studentPhone: r.student_phone,
        deliveryLocation: r.delivery_location,
        restaurantId: r.restaurant_id,
        restaurantName: r.restaurant_name,
        items: typeof r.items === 'string' ? JSON.parse(r.items) : (r.items || []),
        totalAmount: Number(r.total_amount),
        status: r.status,
        paymentMethod: r.payment_method || 'cod',
        deliveryPartner: r.delivery_partner_id ? {
          id: r.delivery_partner_id,
          name: r.delivery_partner_name,
          phone: r.delivery_partner_phone
        } : null,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }));
      return res.status(200).json({ success: true, orders: formatted });
    } catch (err) {
      console.error('[Admin Orders GET Error]:', err.message);
      return res.status(500).json({ error: 'Failed to fetch orders: ' + err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
