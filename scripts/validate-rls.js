#!/usr/bin/env node
/**
 * scripts/validate-rls.js
 * Basic RLS validation: ensures critical tables have at least one RLS policy.
 * Exits non-zero when policies are missing. CI can use this to block PRs.
 */

import fs from 'fs';
import path from 'path';
const PROBE = path.resolve(process.cwd(), 'scripts', 'schema-probe-output.json');

if (!fs.existsSync(PROBE)) {
  console.error('Probe output not found. Run scripts/schema-probe.js first.');
  process.exit(2);
}

const probe = JSON.parse(fs.readFileSync(PROBE, 'utf8'));

const criticalTables = ['public.subscriptions', 'public.users', 'public.transcriptions'];

const missing = [];
for (const t of criticalTables) {
  const found = Object.keys(probe.tables).find(k => k === t || k.endsWith(`.${t.split('.').pop()}`));
  if (!found) {
    missing.push(`${t} not found`);
    continue;
  }
  const policies = (probe.rls_policies || []).filter(p => p.schemaname === found.split('.')[0] && p.tablename === found.split('.')[1]);
  if (!policies || policies.length === 0) missing.push(`No RLS policies for ${found}`);
}

if (missing.length) {
  console.error('RLS validation failed:');
  missing.forEach(m => console.error(' -', m));
  process.exit(4);
}

console.log('RLS validation passed for critical tables.');
process.exit(0);
