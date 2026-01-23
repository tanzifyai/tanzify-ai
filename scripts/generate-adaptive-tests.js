#!/usr/bin/env node
/**
 * scripts/generate-adaptive-tests.js
 * Reads scripts/schema-probe-output.json and generates a skeleton adaptive
 * E2E test file at scripts/generated/payment-e2e-adaptive.js that only uses
 * available columns/features.
 */

import fs from 'fs';
import path from 'path';
const OUT_DIR = path.resolve(process.cwd(), 'scripts', 'generated');
const PROBE = path.resolve(process.cwd(), 'scripts', 'schema-probe-output.json');

if (!fs.existsSync(PROBE)) {
  console.error('Run scripts/schema-probe.js first to produce', PROBE);
  process.exit(1);
}

const probe = JSON.parse(fs.readFileSync(PROBE, 'utf8'));

function hasTable(name) {
  return Object.keys(probe.tables).some(t => t.endsWith(`.${name}`));
}

function tableFullName(name) {
  return Object.keys(probe.tables).find(t => t.endsWith(`.${name}`));
}

function hasColumn(table, col) {
  const full = tableFullName(table);
  if (!full) return false;
  return Boolean(probe.tables[full].columns[col]);
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const outFile = path.join(OUT_DIR, 'payment-e2e-adaptive.js');
const lines = [];
lines.push("#!/usr/bin/env node");
lines.push("// Auto-generated adaptive E2E test stub");
lines.push("import fs from 'fs';");
lines.push("import path from 'path';");
lines.push("console.log('Adaptive E2E test generated from schema probe.\n');");

// Subscription flows
if (hasTable('subscriptions')) {
  lines.push("// Subscriptions table detected — generating subscription tests");
  lines.push("// Available columns:\n" + Object.keys(probe.tables[tableFullName('subscriptions')].columns).join(', '));
  lines.push("// Test: create, capture, cancel flows (stubs)");
  lines.push(`console.log('Subscriptions table found: ${tableFullName('subscriptions')}');`);
  if (hasColumn('subscriptions', 'razorpay_order_id')) lines.push("// Will test order -> payment captured flow using razorpay_order_id");
  if (hasColumn('subscriptions', 'status')) lines.push("// Will assert subscription status transitions (pending -> active -> cancelled)");
} else {
  lines.push("// No subscriptions table detected — skipping subscription tests");
}

if (hasTable('refunds')) {
  lines.push("console.log('Refunds table detected — will include refund assertions');");
} else {
  lines.push("console.log('Refunds table missing — refund tests will be simulated and SQL suggestions provided');");
}

// Write file
fs.writeFileSync(outFile, lines.join('\n') + '\n');
console.log('Adaptive test stub written to', outFile);
