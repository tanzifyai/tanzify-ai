#!/usr/bin/env node
/*
 Simple churn-report helper.
 Requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in env.
 Expects a Postgres RPC `churn_report(since_ts text)` or falls back to a basic query.
*/
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function main() {
  const since = process.argv[2] || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  console.log('Generating churn report since', since);
  // Try RPC first
  try {
    const { data } = await supabaseAdmin.rpc('churn_report', { since_ts: since });
    if (data) {
      console.log('RPC churn_report result:', JSON.stringify(data, null, 2));
      return;
    }
  } catch (e) {}

  // Fallback: basic cancellations count
  try {
    const { data } = await supabaseAdmin.from('subscriptions').select('status, count(*)').gte('updated_at', since).group('status');
    console.log('Fallback churn summary:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Failed to run churn query', err);
  }
}

main().catch((e)=>{ console.error(e); process.exit(1); });
