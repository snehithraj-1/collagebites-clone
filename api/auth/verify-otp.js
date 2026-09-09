import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL || 
  'postgresql://neondb_owner:npg_IDfEm7NR9gHC@ep-winter-moon-axhp8k01-pooler.c-4.us-east-2.aws.neon.tech/clgbytes?sslmode=require';

const sql = neon(DATABASE_URL);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email, otp, name, phone } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and OTP are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    let isValid = false;
    let storedData = null;

    // 1. Check Neon DB for real OTP
    try {
      const rows = await sql`
        SELECT * FROM otp_verifications 
        WHERE email = ${cleanEmail} 
          AND otp = ${cleanOtp} 
          AND expires_at > NOW();
      `;
      if (rows && rows.length > 0) {
        isValid = true;
        storedData = rows[0];
      }
    } catch (dbErr) {
      console.warn('[Neon DB OTP Verify Warning]:', dbErr.message);
    }

    // 2. Developer / test fallback code
    if (cleanOtp === '123456') {
      isValid = true;
    }

    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP code. Please try again.' });
    }

    // Keep record in Neon DB for audit & visibility in console
    const studentName = name || storedData?.name || cleanEmail.split('@')[0];
    const studentPhone = phone || storedData?.phone || '9989955833';
    const studentId = `srm-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

    // Upsert into Neon DB students table
    try {
      await sql`
        INSERT INTO students (id, name, email, phone, role, created_at, updated_at)
        VALUES (${studentId}, ${studentName}, ${cleanEmail}, ${studentPhone}, 'student', NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          phone = EXCLUDED.phone,
          updated_at = NOW();
      `;
    } catch (upsertErr) {
      console.warn('[Neon DB Student Upsert Warning]:', upsertErr.message);
    }

    const userProfile = {
      id: studentId,
      name: studentName,
      email: cleanEmail,
      phone: studentPhone,
      role: 'student'
    };

    return res.status(200).json({
      success: true,
      user: userProfile,
      message: 'Logged in successfully'
    });
  } catch (err) {
    console.error('[Verify OTP Route Error]:', err.message);
    return res.status(500).json({ success: false, error: 'Verification failed: ' + err.message });
  }
}
