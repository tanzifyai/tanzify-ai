#!/usr/bin/env node
/*
 scripts/backup-rotate.js
 - Creates a daily pg_dump and rotates backups by retention policy.
 - Usage: node scripts/backup-rotate.js
*/

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '7', 10);

if (!DATABASE_URL) {
  console.error('DATABASE_URL required');
  process.exit(1);
}

fs.mkdirSync(BACKUP_DIR, { recursive: true });
const timestamp = new Date().toISOString().replace(/[:\.]/g, '-');
const backupPath = path.join(BACKUP_DIR, `backup_${timestamp}.sql`);
console.log('Creating backup:', backupPath);

const res = spawnSync('pg_dump', ['--dbname', DATABASE_URL, '--file', backupPath], { stdio: 'inherit' });
if (res.error || res.status !== 0) {
  console.error('pg_dump failed', res.error || ('exit ' + res.status));
  process.exit(1);
}

// Rotate old backups
const files = fs.readdirSync(BACKUP_DIR).map(f => ({ f, t: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }));
files.sort((a,b)=>b.t-a.t);
const now = Date.now();
for (const { f, t } of files) {
  const ageDays = Math.floor((now - t)/(1000*60*60*24));
  if (ageDays > RETENTION_DAYS) {
    try { fs.unlinkSync(path.join(BACKUP_DIR, f)); console.log('Removed old backup', f); } catch (e) { console.warn('Failed to remove', f, e?.message || e); }
  }
}

console.log('Backup complete and rotated.');
