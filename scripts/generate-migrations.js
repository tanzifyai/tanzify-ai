#!/usr/bin/env node
/**
 * scripts/generate-migrations.js
 * Reads scripts/schema-probe-output.json and generates SQL migration suggestions
 * to add missing columns or tables required by the payment flow.
 */

import fs from 'fs';
import path from 'path';
const PROBE = path.resolve(process.cwd(), 'scripts', 'schema-probe-output.json');
const OUT = path.resolve(process.cwd(), 'scripts', 'generated', 'suggested-migrations.sql');

if (!fs.existsSync(PROBE)) {
  console.error('Run scripts/schema-probe.js first to produce', PROBE);
  process.exit(1);
}

const probe = JSON.parse(fs.readFileSync(PROBE, 'utf8'));

function findTable(name) {
  return Object.keys(probe.tables).find(t => t.endsWith(`.${name}`));
}

const suggestions = [];

// subscriptions table checks
const subsTable = findTable('subscriptions');
if (!subsTable) {
  suggestions.push(`-- Create subscriptions table (example)
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id),
  razorpay_order_id text,
  razorpay_subscription_id text,
  plan_name text,
  status text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
`);
} else {
  const cols = probe.tables[subsTable].columns;
  const want = ['razorpay_order_id','razorpay_subscription_id','status','current_period_start','current_period_end','user_id'];
  for (const c of want) {
    if (!cols[c]) {
      suggestions.push(`-- Add column ${c} to ${subsTable}
ALTER TABLE ${subsTable} ADD COLUMN ${c} text;
`);
    }
  }
}

// refunds table
const refundsTable = findTable('refunds');
if (!refundsTable) {
  suggestions.push(`-- Create refunds table (example)
CREATE TABLE public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id text,
  amount int,
  reason text,
  created_at timestamptz DEFAULT now()
);
`);
}

// Index suggestions
if (subsTable) {
  const idxs = probe.indexes[subsTable] || [];
  const hasOrderIdx = idxs.some(i => i.indexdef && i.indexdef.includes('razorpay_order_id'));
  if (!hasOrderIdx) suggestions.push(`-- Add index to speed lookups by razorpay_order_id
CREATE INDEX idx_subscriptions_razorpay_order_id ON ${subsTable} (razorpay_order_id);
`);
}

// Write suggestions
if (!fs.existsSync(path.dirname(OUT))) fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, suggestions.join('\n'));
console.log('Migration suggestions written to', OUT);
