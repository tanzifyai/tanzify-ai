#!/usr/bin/env node
// scripts/check-health-local.js
// Checks: DATABASE_URL (connect), Supabase admin access, local server /api/health

import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import { Client } from 'pg';

// Auto-detect env vars (frontend -> vite -> backend)
const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || process.env.SUPABASE_DB_URL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const API_BASE = process.env.VITE_API_BASE || process.env.VITE_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5173';

let overallOk = true;

const checkDatabase = async () => {
  if (!DATABASE_URL) {
    console.error('FAIL: DATABASE_URL not set');
    overallOk = false;
    return;
  }
  console.log('Checking database connection...');
  try {
    const client = new Client({ connectionString: DATABASE_URL });
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    console.log('OK: Database connection successful');
  } catch (err) {
    console.error('FAIL: Database check failed:', err?.message || err);
    overallOk = false;
  }
};

const checkSupabase = async () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('FAIL: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
    overallOk = false;
    return;
  }
  console.log('Checking Supabase admin access (will retry up to 3 times)...');
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  let lastErr = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { error } = await admin.from('users').select('id').limit(1);
      if (error) throw error;
      console.log(`OK: Supabase admin query succeeded (attempt ${attempt})`);
      return;
    } catch (err) {
      lastErr = err;
      console.warn('Supabase admin attempt', attempt, 'failed:', err?.message || err);
      if (attempt < 3) await new Promise((res) => setTimeout(res, 2000));
    }
  }

  console.error('FAIL: Supabase admin check failed after 3 attempts:', lastErr?.message || lastErr);
  overallOk = false;
};

const checkLocalServer = async () => {
  console.log('Checking local server health at', API_BASE + '/api/health');
  // We'll treat local server failures as WARN (not fatal) and try fallbacks
  let serverResponding = false;
  try {
    const base = new URL(API_BASE, 'http://localhost:5173').toString();
    const apiHealth = base.replace(/\/$/, '') + '/api/health';
    try {
      const res = await fetch(apiHealth);
      if (res.ok) {
        const body = await res.text();
        console.log('OK: /api/health returned', res.status, '-', body.slice(0, 200));
        serverResponding = true;
      } else {
        console.warn('/api/health returned non-OK status', res.status);
      }
    } catch (e) {
      console.warn('/api/health request failed:', e?.message || e);
    }

    if (!serverResponding) {
      // Try root /
      const root = base.replace(/\/$/, '') + '/';
      try {
        const res2 = await fetch(root, { redirect: 'follow' });
        if (res2.ok) {
          const b2 = await res2.text();
          console.log('WARN: Root endpoint responded', res2.status, '-', b2.slice(0, 200));
          serverResponding = true;
        } else {
          console.warn('Root endpoint returned non-OK status', res2.status);
        }
      } catch (e2) {
        console.warn('Root endpoint request failed:', e2?.message || e2);
      }
    }
  } catch (err) {
    console.warn('Local server health checks failed to run:', err?.message || err);
  }

  if (!serverResponding) {
    console.warn('WARN: Dev server not responding at', API_BASE, '- treating as non-fatal for local checks.');
  }
};

const main = async () => {
  console.log('Running local health checks...');
  await checkDatabase();
  await checkSupabase();
  await checkLocalServer();

  if (!overallOk) {
    console.error('\nOne or more checks failed.');
    process.exit(1);
  }
  console.log('\nAll local health checks passed.');
  process.exit(0);
};

main();
