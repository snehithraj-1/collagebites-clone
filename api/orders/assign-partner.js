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

  // Parse body if string
  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {}
  }

  // Extract orderId from body, query, or URL
  const urlMatch = (req.url || '').match(/\/api\/orders\/([^\/\?]+)/);
  const urlId = urlMatch && !['assign-partner', 'status', 'delete'].includes(urlMatch[1]) ? urlMatch[1] : null;
  const orderId = body.orderId || body.order_id || req.query.id || urlId;

  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  try {
    const { deliveryPartner, partnerId, partner_id, partnerName, partner_name, partnerPhone, partner_phone, unassign } = body;

    let pId = null;
    let pName = null;
    let pPhone = null;

    if (!unassign) {
      if (deliveryPartner) {
        pId = deliveryPartner.id || null;
        pName = deliveryPartner.name || null;
        pPhone = deliveryPartner.phone || null;
      } else if (partnerId || partner_id) {
        pId = partnerId || partner_id;
        pName = partnerName || partner_name || null;
        pPhone = partnerPhone || partner_phone || null;
      }

      if (pId && (!pName || !pPhone)) {
        const partners = await sql`SELECT * FROM delivery_partners WHERE id = ${pId} LIMIT 1;`;
        if (partners && partners.length > 0) {
          pName = partners[0].name;
          pPhone = partners[0].phone;
        }
      }
    }

    const cleanId = (orderId || '').trim();
    const updated = await sql`
      UPDATE orders 
      SET 
        delivery_partner_id = ${pId},
        delivery_partner_name = ${pName},
        delivery_partner_phone = ${pPhone},
        updated_at = NOW()
      WHERE id = ${cleanId} OR id LIKE ${cleanId + '%'}
      RETURNING *;
    `;

    if (!updated || updated.length === 0) {
      return res.status(404).json({ error: 'Order not found', receivedOrderId: orderId, cleanId, pId, pName, pPhone });
    }

    const r = updated[0];
    return res.status(200).json({
      success: true,
      order: {
        id: r.id,
        studentName: r.student_name,
        studentEmail: r.student_email,
        deliveryPartner: pId ? { id: pId, name: pName, phone: pPhone } : null
      }
    });
  } catch (err) {
    console.error('[Assign Partner Error]:', err.message);
    return res.status(500).json({ error: 'Failed to assign partner: ' + err.message });
  }
}
