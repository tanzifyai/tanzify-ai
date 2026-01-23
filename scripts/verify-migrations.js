#!/usr/bin/env node
/*
 scripts/verify-migrations.js
 - Verifies all migrations are applied and RPC functions exist
*/

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

const MIGRATIONS_DIR = path.join(process.cwd(), 'migrations');
const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL required to verify migrations');
  process.exit(1);
}

const pg = new Client({ connectionString: DATABASE_URL });

async function getApplied() {
  const res = await pg.query('SELECT id FROM schema_migrations ORDER BY id');
  return new Set(res.rows.map(r => r.id));
}

async function checkFunctionExists(name) {
  const res = await pg.query("SELECT proname FROM pg_proc WHERE proname = $1", [name]);
  return res.rowCount > 0;
}

async function main() {
  await pg.connect();
  const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();
  const applied = await getApplied();

  let allOk = true;
  for (const f of files) {
    if (!applied.has(f)) {
      console.error('Migration not applied:', f);
      allOk = false;
    } else {
      console.log('Applied:', f);
    }
  }

  // Verify RPC exists
  const rpcOk = await checkFunctionExists('process_razorpay_payment');
  console.log('RPC process_razorpay_payment exists:', rpcOk);
  if (!rpcOk) allOk = false;

  // Test calling the function in a dry run if possible
  try {
    const res = await pg.query("SELECT public.process_razorpay_payment($1,$2,$3) as res", ['__test_order__', '__test_payment__', null]);
    console.log('RPC test call result:', res.rows[0]);
  } catch (err) {
    console.warn('RPC test call failed (expected if no test order exists):', err.message || err);
  }

  await pg.end();
  if (!allOk) process.exit(2);
}

main().catch(err => {
  console.error('verify-migrations failed', err);
  process.exit(1);
});
