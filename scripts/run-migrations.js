#!/usr/bin/env node
/*
 scripts/run-migrations.js
 - Runs SQL files in migrations/ in lexicographic order
 - Tracks applied migrations in schema_migrations table
 - Supports --rollback <name> to rollback (if rollback SQL provided as .down.sql)
*/

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { Client } from 'pg';
import { spawnSync } from 'child_process';
import readline from 'readline';

dotenv.config();

const MIGRATIONS_DIR = path.join(process.cwd(), 'migrations');
const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

const SAFETY_CONFIG_PATH = path.join(process.cwd(), 'safety-config.json');
const APPROVED_OVERRIDES = path.join(process.cwd(), 'safety', 'approved_overrides.json');
const AUDIT_LOG = path.join(process.cwd(), 'logs', 'rollback_audit.log');

if (!DATABASE_URL) {
  console.error('DATABASE_URL required to run migrations');
  process.exit(1);
}

const pg = new Client({ connectionString: DATABASE_URL });

async function ensureSchemaMigrations() {
  await pg.query(`CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());`);
}

async function getApplied() {
  const res = await pg.query('SELECT id FROM schema_migrations ORDER BY id');
  return res.rows.map(r => r.id);
}

function confirmPrompt(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question + ' (yes/no): ', (answer) => {
      rl.close();
      resolve(/^y(es)?$/i.test(answer));
    });
  });
}

function runPgDump(backupPath) {
  console.log('Creating DB backup to', backupPath);
  const args = ['--dbname', DATABASE_URL, '--file', backupPath];
  const res = spawnSync('pg_dump', args, { stdio: 'inherit' });
  if (res.error) throw res.error;
  if (res.status !== 0) throw new Error('pg_dump failed with exit ' + res.status);
}

function logAudit(entry) {
  try {
    fs.mkdirSync(path.dirname(AUDIT_LOG), { recursive: true });
    const payload = Object.assign({ when: new Date().toISOString(), user: (os.userInfo && os.userInfo().username) || process.env.USER || process.env.USERNAME || 'unknown' }, entry);
    fs.appendFileSync(AUDIT_LOG, JSON.stringify(payload) + '\n');
  } catch (e) {
    console.warn('Failed to write audit log:', e?.message || e);
  }
}

function loadSafetyConfig() {
  try {
    if (fs.existsSync(SAFETY_CONFIG_PATH)) return JSON.parse(fs.readFileSync(SAFETY_CONFIG_PATH, 'utf8'));
  } catch (e) { console.warn('Could not read safety-config.json:', e?.message || e); }
  return { businessHours: { start: 9, end: 18, days: [1,2,3,4,5] }, criticalTables: [] };
}

function isWithinBusinessHours(config) {
  try {
    const now = new Date();
    const day = now.getDay(); // 0 Sun .. 6 Sat
    const hour = now.getHours();
    // convert to 1-7 for comparison where Monday=1
    const day1 = day === 0 ? 7 : day;
    const days = config.businessHours && config.businessHours.days ? config.businessHours.days : [1,2,3,4,5];
    const start = config.businessHours.start ?? 9;
    const end = config.businessHours.end ?? 18;
    return days.includes(day1) && hour >= start && hour < end;
  } catch (e) { return false; }
}

function generateConfirmationToken() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function promptInput(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => { rl.close(); resolve(answer); });
  });
}

async function applyMigration(file) {
  const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
  console.log('Applying', file);
  await pg.query('BEGIN');
  try {
    await pg.query(sql);
    await pg.query('INSERT INTO schema_migrations (id) VALUES ($1) ON CONFLICT DO NOTHING', [file]);
    await pg.query('COMMIT');
    console.log('Applied', file);
  } catch (err) {
    await pg.query('ROLLBACK');
    console.error('Failed migration', file, err?.message || err);
    throw err;
  }
}

async function applyRollback(file) {
  const downFile = file.replace(/\.sql$/i, '.down.sql');
  const downPath = path.join(MIGRATIONS_DIR, downFile);
  if (!fs.existsSync(downPath)) {
    throw new Error(`Rollback SQL not found for ${file} -> expected ${downFile}`);
  }

  const sql = fs.readFileSync(downPath, 'utf8');
  console.log('Rolling back', file, 'using', downFile);
  await pg.query('BEGIN');
  try {
    await pg.query(sql);
    await pg.query('DELETE FROM schema_migrations WHERE id = $1', [file]);
    await pg.query('COMMIT');
    console.log('Rolled back', file);
  } catch (err) {
    await pg.query('ROLLBACK');
    console.error('Rollback failed for', file, err?.message || err);
    throw err;
  }
}

async function checkActiveConnections(tables = []) {
  try {
    const res = await pg.query(`SELECT count(*) FROM pg_stat_activity WHERE pid <> pg_backend_pid() AND state <> 'idle'`);
    const count = Number(res.rows[0].count || 0);
    return count;
  } catch (err) {
    console.warn('Could not check active connections:', err?.message || err);
    return -1;
  }
}

async function performMigrations(opts) {
  await pg.connect();
  await ensureSchemaMigrations();
  const applied = await getApplied();
  // Only include migration SQL files (exclude rollback `.down.sql` files)
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql') && !f.endsWith('.down.sql'))
    .sort();

  if (opts.dryRun) {
    console.log('Dry run: the following migrations would be applied:');
    for (const f of files) if (!applied.includes(f)) console.log('  -', f);
    await pg.end();
    return;
  }

  for (const f of files) {
    if (!applied.includes(f)) {
      await applyMigration(f);
    } else {
      console.log('Skipping already applied', f);
    }
  }

  await pg.end();
}

async function performRollback(opts) {
  await pg.connect();
  await ensureSchemaMigrations();
  let applied = await getApplied();
  applied = applied.sort();

  if (applied.length === 0) {
    console.log('No applied migrations found.');
    await pg.end();
    return;
  }

  if (opts.dryRun) {
    console.log('Dry run: would rollback the following (most recent first):');
    const toList = opts.to ? applied.filter(f => f > opts.to) : [applied[applied.length - 1]];
    toList.reverse().forEach(f => console.log('  -', f));
    await pg.end();
    return;
  }

  // Pre-flight checks
  const active = await checkActiveConnections();
  if (active > 0 && !opts.yes) {
    console.warn(`Detected ${active} active DB connections. It's recommended to quiesce the DB before rollback.`);
    const ok = await confirmPrompt('Continue with rollback despite active connections?');
    if (!ok) {
      console.log('Aborting rollback.');
      await pg.end();
      return;
    }
  }

  // Load safety config and enforce peak-hours prevention
  const safety = loadSafetyConfig();
  if (isWithinBusinessHours(safety) && !opts.overrideToken) {
    console.error('Rollback blocked: current time is within configured business hours. Provide an approved override token to proceed.');
    logAudit({ action: 'rollback_blocked_peak_hours', opts });
    await pg.end();
    process.exit(3);
  }

  // If override token provided, validate it against approved overrides
  if (opts.overrideToken) {
    try {
      const approved = fs.existsSync(APPROVED_OVERRIDES) ? JSON.parse(fs.readFileSync(APPROVED_OVERRIDES, 'utf8')) : [];
      if (!approved.includes(opts.overrideToken)) {
        console.error('Provided override token is not approved. Abort.');
        logAudit({ action: 'rollback_invalid_override', opts });
        await pg.end();
        process.exit(4);
      }
    } catch (e) {
      console.error('Failed to validate override token:', e?.message || e);
      logAudit({ action: 'rollback_override_validation_error', opts, error: String(e) });
      await pg.end();
      process.exit(5);
    }
  }

  // Create backup
  const timestamp = new Date().toISOString().replace(/[:\.]/g, '-');
  const backupPath = path.join(process.cwd(), `backups`, `pre_rollback_${timestamp}.sql`);
  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  try {
    runPgDump(backupPath);
    console.log('Backup created at', backupPath);
    // verify backup exists and is non-empty
    try {
      const stat = fs.statSync(backupPath);
      if (!stat || stat.size === 0) throw new Error('Backup file is empty');
    } catch (e) {
      throw new Error('Backup verification failed: ' + (e?.message || e));
    }
  } catch (err) {
    console.error('Backup failed:', err?.message || err);
    if (!opts.yes) {
      const ok = await confirmPrompt('Backup failed. Continue with rollback?');
      if (!ok) {
        await pg.end();
        return;
      }
    }
  }

  // Determine which migrations to roll back
  let toRollback = [];
  if (opts.to) {
    if (!applied.includes(opts.to)) {
      throw new Error('Target migration to rollback-to not found in applied migrations: ' + opts.to);
    }
    // Rollback those applied after opts.to
    toRollback = applied.filter(f => f > opts.to);
  } else {
    // rollback last migration
    toRollback = [applied[applied.length - 1]];
  }

  if (toRollback.length === 0) {
    console.log('Nothing to rollback.');
    await pg.end();
    return;
  }

  // Confirm if not auto-confirmed: show impact and require confirmation token
  if (!opts.yes) {
    console.log('Migrations to rollback (most recent first):');
    toRollback.slice().reverse().forEach(f => console.log('  -', f));
    console.log('\nImpact assessment: parsing down-sql for affected tables/operations...');
    const impact = new Map();
    for (const f of toRollback) {
      const downFile = path.join(MIGRATIONS_DIR, f.replace(/\.sql$/i, '.down.sql'));
      if (!fs.existsSync(downFile)) continue;
      const content = fs.readFileSync(downFile, 'utf8');
      // crude regex to pick up table names from DROP/ALTER/CREATE statements
      const tbls = [...content.matchAll(/(?:DROP TABLE|ALTER TABLE|CREATE TABLE|ALTER TABLE\s+IF\s+EXISTS)\s+(["`]?)([a-zA-Z0-9_\.]+)\1/gi)].map(m => m[2]);
      const drops = [...content.matchAll(/DROP\s+COLUMN\s+([a-zA-Z0-9_]+)/gi)].map(m => m[1]);
      impact.set(f, { tables: Array.from(new Set(tbls)), columns: Array.from(new Set(drops)) });
    }
    for (const [k, v] of impact.entries()) {
      console.log(`- ${k}: tables -> ${v.tables.join(', ') || 'none'}, columns -> ${v.columns.join(', ') || 'none'}`);
    }

    // Confirmation token flow
    const token = generateConfirmationToken();
    console.log('\nTo confirm rollback, type the following 6-digit confirmation token:');
    console.log('  >>>', token, '\n');
    const typed = (await promptInput('Enter confirmation token: ')).trim();
    if (typed !== token) {
      console.log('Confirmation token mismatch. Aborting rollback.');
      logAudit({ action: 'rollback_confirmation_failed', opts, impact });
      await pg.end();
      return;
    }
    console.log('Confirmation token accepted. Proceeding...');
  }

  // Apply rollbacks in reverse order with timeout protection
  const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
  for (const f of toRollback.slice().reverse()) {
    try {
      logAudit({ action: 'rollback_start', migration: f, opts });
      await Promise.race([
        applyRollback(f),
        new Promise((_, rej) => setTimeout(() => rej(new Error('Rollback timed out after 5 minutes')), TIMEOUT_MS))
      ]);
      logAudit({ action: 'rollback_success', migration: f, opts });
    } catch (err) {
      console.error('Rollback failed for', f, err?.message || err);
      logAudit({ action: 'rollback_error', migration: f, error: String(err), opts });
      console.error('Stopping further rollbacks. Check backup and run emergency recovery if needed.');
      await pg.end();
      process.exit(1);
    }
  }

  console.log('Rollback completed successfully.');
  await pg.end();
}

async function main() {
  const argv = process.argv.slice(2);
  const opts = { rollback: false, to: null, dryRun: false, yes: false, overrideToken: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--rollback') opts.rollback = true;
    if (a === '--dry-run') opts.dryRun = true;
    if (a === '--yes') opts.yes = true;
    if (a === '--rollback-to' || a === '--to') { opts.rollback = true; opts.to = argv[i+1]; i++; }
    if (a === '--override-token' || a === '--override') { opts.overrideToken = argv[i+1]; i++; }
  }

  if (opts.rollback) {
    try { await performRollback(opts); process.exit(0); } catch (err) { console.error('Rollback process failed', err?.message || err); process.exit(2); }
  }

  // default: apply migrations
  try { await performMigrations(opts); process.exit(0); } catch (err) { console.error('Migration runner failed', err?.message || err); process.exit(1); }
}

main();
