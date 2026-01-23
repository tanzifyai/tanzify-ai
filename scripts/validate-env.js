#!/usr/bin/env node
/*
 scripts/validate-env.js
 Validates required environment variables and performs lightweight checks:
  - Supabase service role key connectivity
  - Razorpay keys (creates a test order when possible)
  - Firebase presence check (if enabled)
 Usage:
   node scripts/validate-env.js
*/

import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET;
// Firebase removed — no checks here

async function checkSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Supabase service role key or URL missing.');
    return false;
  }
  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { data, error } = await supabaseAdmin.from('subscriptions').select('id').limit(1);
    if (error) {
      console.error('Supabase test query failed:', error.message || error);
      return false;
    }
    console.log('Supabase connection OK (queried subscriptions).');
    return true;
  } catch (err) {
    console.error('Supabase check error', err);
    return false;
  }
}

async function checkRazorpay() {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    console.warn('Razorpay keys missing - cannot run test API call.');
    return false;
  }
  try {
    const rz = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
    // create and immediately fetch a small test order (in test mode these are fine)
    const order = await rz.orders.create({ amount: 100, currency: 'INR', receipt: `test_${Date.now()}` });
    if (order && order.id) {
      console.log('Razorpay API call succeeded (created order). Order id:', order.id);
      return true;
    }
    console.warn('Razorpay response unexpected', order);
    return false;
  } catch (err) {
    console.error('Razorpay test call failed', err?.message || err);
    return false;
  }
}

// Firebase removed — no runtime checks

async function main() {
  console.log('Validating environment...');
  const sa = await checkSupabase();
  const rz = await checkRazorpay();
  console.log('\nSummary:');
  console.log('Supabase:', sa ? 'OK' : 'FAIL');
  console.log('Razorpay:', rz ? 'OK' : 'WARN/FAIL');
  if (!sa || !rz) process.exit(1);
}

main().catch((err) => {
  console.error('validate-env error', err);
  process.exit(1);
});
