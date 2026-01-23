#!/usr/bin/env node
/**
 * scripts/check-schema-critical.js
 * Reads scripts/schema-probe-output.json and exits non-zero when required
 * payment-related columns/tables are missing. Meant to be run in CI to fail PRs.
 */

import fs from 'fs';
import path from 'path';
const PROBE = path.resolve(process.cwd(), 'scripts', 'schema-probe-output.json');

if (!fs.existsSync(PROBE)) {
  console.error('Probe output not found. Run scripts/schema-probe.js first.');
  process.exit(2);
}

const probe = JSON.parse(fs.readFileSync(PROBE, 'utf8'));
const required = {
  subscriptions: ['razorpay_order_id', 'razorpay_subscription_id', 'status', 'current_period_start', 'current_period_end', 'user_id'],
  refunds: ['payment_id', 'amount', 'created_at']
};

let errors = [];
function findTable(name) {
  return Object.keys(probe.tables).find(t => t.endsWith(`.${name}`));
}

for (const t of Object.keys(required)) {
  const table = findTable(t);
  if (!table) {
    errors.push(`Missing required table: ${t}`);
    continue;
  }
  for (const col of required[t]) {
    if (!probe.tables[table].columns[col]) {
      errors.push(`Missing column ${col} on table ${table}`);
    }
  }
}

if (errors.length) {
  console.error('Critical schema issues detected:');
  for (const e of errors) console.error(' -', e);
  console.error('\nPlease run scripts/generate-migrations.js to produce suggested SQL.');
  process.exit(3);
}

console.log('No critical schema issues detected.');
process.exit(0);
