#!/usr/bin/env node
/*
 scripts/emergency-recovery.js
 Usage: node scripts/emergency-recovery.js --backup <path-to-sql-dump>
 Restores the given SQL dump to DATABASE_URL using psql/pg_restore.
*/

import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL required');
  process.exit(1);
}

const argv = process.argv.slice(2);
let backup = null;
for (let i=0;i<argv.length;i++){
  if (argv[i] === '--backup') { backup = argv[i+1]; i++; }
}

if (!backup) {
  console.error('Please provide --backup <path>');
  process.exit(1);
}

if (!fs.existsSync(backup)) {
  console.error('Backup file not found:', backup);
  process.exit(1);
}

console.log('Starting emergency restore from', backup);

// Try psql first
const psql = spawnSync('psql', [DATABASE_URL, '-f', backup], { stdio: 'inherit' });
if (psql.error) {
  console.warn('psql failed to start:', psql.error.message || psql.error);
}
if (psql.status === 0) {
  console.log('Restore completed via psql successfully.');
  process.exit(0);
}

// Fallback to pg_restore (if dump is custom format)
const pgRestore = spawnSync('pg_restore', ['--dbname', DATABASE_URL, backup], { stdio: 'inherit' });
if (pgRestore.error) {
  console.error('pg_restore failed to start:', pgRestore.error.message || pgRestore.error);
  process.exit(1);
}
if (pgRestore.status !== 0) {
  console.error('pg_restore failed with status', pgRestore.status);
  process.exit(1);
}
console.log('Restore completed via pg_restore successfully.');
process.exit(0);
