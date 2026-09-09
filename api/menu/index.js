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
          restaurant_id as "restaurantId", 
          restaurant_name as "restaurantName", 
          name, 
          description, 
          price::numeric as price, 
          category, 
          is_veg as "isVeg", 
          is_available as "isAvailable", 
          image_url as "imageUrl", 
          preparation_time as "preparationTime", 
          rating::numeric as rating
        FROM menu_items 
        ORDER BY restaurant_id, category, name;
      `;
      return res.status(200).json(rows);
    } catch (err) {
      console.error('[Admin Menu GET Error]:', err.message);
      return res.status(500).json({ error: 'Failed to fetch menu items: ' + err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
