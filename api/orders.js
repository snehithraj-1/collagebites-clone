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

  // GET /api/orders
  if (req.method === 'GET') {
    try {
      const studentEmail = req.query.studentEmail || req.query.email;
      const restaurantId = req.query.restaurantId || req.query.restaurant_id;
      let rows = [];

      if (studentEmail && restaurantId) {
        const cleanEmail = studentEmail.trim().toLowerCase();
        rows = await sql`
          SELECT * FROM orders 
          WHERE LOWER(student_email) = ${cleanEmail} AND restaurant_id = ${restaurantId}
          ORDER BY created_at DESC;
        `;
      } else if (studentEmail) {
        const cleanEmail = studentEmail.trim().toLowerCase();
        rows = await sql`
          SELECT * FROM orders 
          WHERE LOWER(student_email) = ${cleanEmail} 
          ORDER BY created_at DESC;
        `;
      } else if (restaurantId) {
        rows = await sql`
          SELECT * FROM orders 
          WHERE restaurant_id = ${restaurantId}
          ORDER BY created_at DESC 
          LIMIT 100;
        `;
      } else {
        rows = await sql`
          SELECT * FROM orders 
          ORDER BY created_at DESC 
          LIMIT 100;
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
        paymentMethod: r.payment_method,
        deliveryPartner: r.delivery_partner_id ? {
          id: r.delivery_partner_id,
          name: r.delivery_partner_name,
          phone: r.delivery_partner_phone
        } : null,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }));

      return res.status(200).json(formatted);
    } catch (err) {
      console.error('[Vercel Orders GET Error]:', err.message);
      return res.status(500).json({ error: 'Failed to fetch orders: ' + err.message });
    }
  }

  // POST /api/orders
  if (req.method === 'POST') {
    try {
      const {
        studentName,
        studentPhone,
        studentEmail,
        deliveryLocation,
        restaurantId,
        restaurantName,
        items,
        totalAmount,
        paymentMethod
      } = req.body || {};

      if (!studentName || !items || !items.length || !totalAmount) {
        return res.status(400).json({ error: 'Missing required order fields' });
      }

      const orderId = 'cb_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      const cleanEmail = (studentEmail || '').trim().toLowerCase();
      const itemsJson = JSON.stringify(items);

      await sql`
        INSERT INTO orders (
          id, student_name, student_email, student_phone,
          delivery_location, restaurant_id, restaurant_name,
          items, total_amount, status, payment_method,
          created_at, updated_at
        ) VALUES (
          ${orderId}, ${studentName}, ${cleanEmail}, ${studentPhone || '9989955833'},
          ${deliveryLocation || 'SRM University - Gate 3'}, ${restaurantId || 'local-home-kitchen'}, ${restaurantName || 'Campus Kitchen'},
          ${itemsJson}::jsonb, ${totalAmount}, 'CONFIRMED', ${paymentMethod || 'cod'},
          NOW(), NOW()
        );
      `;

      const newOrder = {
        id: orderId,
        studentName,
        studentEmail: cleanEmail,
        studentPhone: studentPhone || '9989955833',
        deliveryLocation: deliveryLocation || 'SRM University - Gate 3',
        restaurantId,
        restaurantName,
        items,
        totalAmount,
        status: 'CONFIRMED',
        paymentMethod: paymentMethod || 'cod',
        deliveryPartner: null,
        createdAt: new Date().toISOString()
      };

      return res.status(201).json(newOrder);
    } catch (err) {
      console.error('[Vercel Orders POST Error]:', err.message);
      return res.status(500).json({ error: 'Failed to create order: ' + err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
