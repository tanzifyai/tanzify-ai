import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '', { auth: { persistSession: false } });

export async function POST(req) {
  try {
    const body = await req.json();
    const { id } = body;
    if (!id) return new Response(JSON.stringify({ success: false, message: 'id required' }), { status: 400 });

    // Fetch dead letter
    const { data: dl, error: dlErr } = await supabaseAdmin.from('webhook_dead_letters').select('*').eq('id', id).limit(1).single();
    if (dlErr || !dl) return new Response(JSON.stringify({ success: false, message: 'dead letter not found' }), { status: 404 });

    // Re-post payload to webhook handler for retry
    const webhookUrl = process.env.WEBHOOK_URL || process.env.API_BASE || 'http://localhost:3001/api/razorpay/webhook';
    const res = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': '' }, body: dl.payload });
    if (!res.ok) {
      // increment attempts
      await supabaseAdmin.from('webhook_dead_letters').update({ attempts: dl.attempts + 1 }).eq('id', id);
      return new Response(JSON.stringify({ success: false, status: res.status }), { status: 502 });
    }

    // On success remove dead letter
    await supabaseAdmin.from('webhook_dead_letters').delete().eq('id', id);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Retry endpoint error', err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), { status: 500 });
  }
}

export const runtime = 'edge';
