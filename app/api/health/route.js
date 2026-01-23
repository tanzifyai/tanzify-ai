import { Client } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export async function GET() {
  const results = { status: 'ok', checks: {} };

  // DB check
  if (!DATABASE_URL) {
    results.checks.database = { ok: false, error: 'DATABASE_URL not configured' };
  } else {
    const client = new Client({ connectionString: DATABASE_URL });
    try {
      await client.connect();
      const res = await client.query('SELECT 1 as ok');
      if (res && res.rows && res.rows[0] && res.rows[0].ok === 1) {
        results.checks.database = { ok: true };
      } else {
        results.checks.database = { ok: false, error: 'unexpected response' };
      }
    } catch (err) {
      results.checks.database = { ok: false, error: String(err) };
    } finally {
      try { await client.end(); } catch (e) {}
    }
  }

  // Razorpay API check (optional)
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    results.checks.razorpay = { ok: false, error: 'RAZORPAY_KEY_ID/SECRET not set' };
  } else {
    try {
      const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
      const res = await fetch('https://api.razorpay.com/v1/payments?count=1&skip=0', {
        method: 'GET',
        headers: { Authorization: `Basic ${auth}` },
      });
      if (res.ok) {
        results.checks.razorpay = { ok: true, status: res.status };
      } else {
        results.checks.razorpay = { ok: false, status: res.status, text: await res.text() };
      }
    } catch (err) {
      results.checks.razorpay = { ok: false, error: String(err) };
    }
  }

  const ok = Object.values(results.checks).every(c => c && c.ok);
  results.status = ok ? 'ok' : 'degraded';
  return new Response(JSON.stringify(results), { status: ok ? 200 : 500 });
}

export const runtime = 'nodejs';
