#!/usr/bin/env node
/**
 * scripts/schema-probe.js
 *
 * Connects to the Postgres database and dumps schema information to
 * scripts/schema-probe-output.json. It tries to detect tables, columns,
 * indexes, constraints, foreign-key relationships, functions (RPCs) and RLS policies.
 *
 * Usage:
 *   node scripts/schema-probe.js
 * Environment:
 *   DATABASE_URL (preferred) or SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (not a direct DB connection)
 */

import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const OUT_FILE = path.resolve(process.cwd(), 'scripts', 'schema-probe-output.json');
const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.SUPABASE_DATABASE_URL;

async function probe() {
  if (!DATABASE_URL) {
    console.error('DATABASE_URL is required in env to run the schema probe.');
    process.exit(1);
  }

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  const out = { tables: {}, functions: [], indexes: {}, constraints: {}, foreign_keys: [], rls_policies: [] };

  // Tables and columns
  const tablesRes = await client.query(`
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_type='BASE TABLE' AND table_schema NOT IN ('pg_catalog','information_schema')
    ORDER BY table_schema, table_name
  `);

  for (const row of tablesRes.rows) {
    const schema = row.table_schema;
    const tname = row.table_name;
    const full = `${schema}.${tname}`;
    out.tables[full] = { schema, table: tname, columns: {} };
    const cols = await client.query(
      `SELECT column_name, data_type, is_nullable, column_default
       FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2`,
      [schema, tname]
    );
    for (const c of cols.rows) out.tables[full].columns[c.column_name] = c;
  }

  // Functions (RPCs)
  try {
    const funcs = await client.query(`
      SELECT n.nspname as schema, p.proname as name, pg_get_functiondef(p.oid) as ddl
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname NOT IN ('pg_catalog','information_schema')
      ORDER BY n.nspname, p.proname
    `);
    out.functions = funcs.rows.map(r => ({ schema: r.schema, name: r.name, ddl: r.ddl }));
  } catch (e) {
    out.functions = [];
  }

  // Indexes
  try {
    const idxs = await client.query(`
      SELECT schemaname, tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname NOT IN ('pg_catalog','information_schema')
      ORDER BY schemaname, tablename
    `);
    for (const r of idxs.rows) {
      const key = `${r.schemaname}.${r.tablename}`;
      out.indexes[key] = out.indexes[key] || [];
      out.indexes[key].push({ indexname: r.indexname, indexdef: r.indexdef });
    }
  } catch (e) {}

  // Constraints
  try {
    const cons = await client.query(`
      SELECT tc.constraint_type, tc.table_schema, tc.table_name, tc.constraint_name
      FROM information_schema.table_constraints tc
      WHERE tc.table_schema NOT IN ('pg_catalog','information_schema')
      ORDER BY tc.table_schema, tc.table_name
    `);
    for (const r of cons.rows) {
      const key = `${r.table_schema}.${r.table_name}`;
      out.constraints[key] = out.constraints[key] || [];
      out.constraints[key].push({ constraint_name: r.constraint_name, type: r.constraint_type });
    }
  } catch (e) {}

  // Foreign keys
  try {
    const fks = await client.query(`
      SELECT
        rc.constraint_name, kcu.table_schema, kcu.table_name, kcu.column_name,
        ccu.table_schema AS foreign_table_schema, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
      FROM information_schema.referential_constraints rc
      JOIN information_schema.key_column_usage kcu ON kcu.constraint_name = rc.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = rc.unique_constraint_name
      ORDER BY kcu.table_schema, kcu.table_name
    `);
    out.foreign_keys = fks.rows;
  } catch (e) {}

  // RLS policies (Postgres >= 9.5 has pg_policies view in psql)
  try {
    const pols = await client.query(`SELECT * FROM pg_policies`);
    out.rls_policies = pols.rows;
  } catch (e) {
    // Try fallback: query pg_catalog.pg_policy
    try {
      const pols2 = await client.query(`SELECT * FROM pg_catalog.pg_policy`);
      out.rls_policies = pols2.rows;
    } catch (e2) {
      out.rls_policies = [];
    }
  }

  await client.end();

  // Basic analysis for payment flow required columns
  const required = {
    subscriptions: ['razorpay_order_id', 'razorpay_subscription_id', 'status', 'current_period_start', 'current_period_end', 'user_id'],
    refunds: ['id', 'payment_id', 'amount', 'created_at']
  };
  out.analysis = { required_columns: {} };
  for (const t of Object.keys(required)) {
    const matches = [];
    for (const col of required[t]) {
      // find any table that endsWith t
      const foundTable = Object.keys(out.tables).find(k => k.endsWith(`.${t}`));
      if (!foundTable) {
        out.analysis.required_columns[t] = out.analysis.required_columns[t] || [];
        out.analysis.required_columns[t].push({ column: col, present: false });
        continue;
      }
      const present = Boolean(out.tables[foundTable].columns[col]);
      out.analysis.required_columns[t] = out.analysis.required_columns[t] || [];
      out.analysis.required_columns[t].push({ column: col, present, table: foundTable });
    }
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2));
  console.log('Schema probe written to', OUT_FILE);
}

probe().catch((err) => { console.error('Probe failed', err); process.exit(1); });
