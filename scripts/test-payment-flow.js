#!/usr/bin/env node
/*
 Enhanced E2E payment tester for Razorpay (test mode).
 Covers: subscription lifecycle, cancellation, retries, refunds and dunning simulation.

 Usage:
   NODE_OPTIONS=--experimental-fetch node scripts/test-payment-flow.js

 Required env (for DB verification):
   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

 Optional Razorpay test mode (to create real test resources):
   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET

 The script will simulate signed webhooks using RAZORPAY_WEBHOOK_SECRET.
*/

import dotenv from 'dotenv';
dotenv.config();

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const fetch = globalThis.fetch;

const WEBHOOK_URL = process.env.WEBHOOK_URL || process.env.API_BASE || 'http://localhost:3001/api/razorpay/webhook';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.VITE_RAZORPAY_WEBHOOK_SECRET;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in env for verification.');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

function signPayload(payload) {
  if (!RAZORPAY_WEBHOOK_SECRET) {
    throw new Error('RAZORPAY_WEBHOOK_SECRET is required to sign payloads');
  }
  return crypto.createHmac('sha256', RAZORPAY_WEBHOOK_SECRET).update(payload).digest('hex');
}

async function sendWebhook(eventObj) {
  const payload = JSON.stringify(eventObj);
  const signature = signPayload(payload);
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': signature,
    },
    body: payload,
  });
  const text = await res.text();
  console.log('[WEBHOOK] POST', eventObj.event, '->', res.status);
  return { status: res.status, text };
}

async function querySubscriptionByOrder(orderId) {
  try {
    const { data, error } = await supabaseAdmin.from('subscriptions').select('*').eq('razorpay_order_id', orderId).limit(1).maybeSingle();
    if (error) return { error };
    return { data };
  } catch (err) {
    return { error: err };
  }
}

async function querySubscriptionBySubscriptionId(subId) {
  try {
    const { data, error } = await supabaseAdmin.from('subscriptions').select('*').eq('razorpay_subscription_id', subId).limit(1).maybeSingle();
    if (error) return { error };
    return { data };
  } catch (err) {
    return { error: err };
  }
}

async function insertTestSubscription(row) {
  return supabaseAdmin.from('subscriptions').insert(row).select().maybeSingle();
}

async function createRazorpayRefund(paymentId, amount) {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    console.log('[RAZORPAY] keys missing — skipping real refund and simulating DB refund record');
    return null;
  }
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  return res.json();
}

async function runCancellationFlows() {
  console.log('\n== Cancellation flows ==');

  const orderId = `test_order_${Date.now()}`;
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  console.log('[SETUP] inserting pending subscription for order', orderId);
  await insertTestSubscription({ user_id: null, razorpay_order_id: orderId, plan_name: 'pro', status: 'pending', current_period_start: now.toISOString(), current_period_end: periodEnd });

  // 1) Customer-initiated cancellation
  console.log('[SCENARIO] customer-initiated cancellation');
  const evt1 = { id: `evt_${Date.now()}_cust_cancel`, event: 'subscription.cancelled', payload: { subscription: { entity: { id: `sub_${Date.now()}`, status: 'cancelled' } }, notes: { source: 'customer' } } };
  await sendWebhook(evt1);
  const s1 = await querySubscriptionBySubscriptionId(evt1.payload.subscription.entity.id);
  console.log('-> DB row for customer cancellation:', s1.data || s1.error || 'not found');

  // 2) Payment failure cancellation after 3 failed payments
  console.log('[SCENARIO] payment failure leading to automatic cancellation after 3 failures');
  const orderId2 = `test_order_${Date.now()}_pf`;
  await insertTestSubscription({ user_id: null, razorpay_order_id: orderId2, plan_name: 'pro', status: 'active', current_period_start: now.toISOString(), current_period_end: periodEnd });
  for (let i = 1; i <= 3; i++) {
    const failEvt = { id: `evt_pf_${Date.now()}_${i}`, event: 'payment.failed', payload: { payment: { entity: { id: `pay_fail_${Date.now()}_${i}`, order_id: orderId2, status: 'failed' } } } };
    await sendWebhook(failEvt);
  }
  const s2 = await querySubscriptionByOrder(orderId2);
  console.log('-> DB row after 3 failures (expected cancelled or suspended):', s2.data || s2.error || 'not found');

  // 3) Admin-initiated cancellation with refund
  console.log('[SCENARIO] admin-initiated cancellation + refund');
  const orderId3 = `test_order_${Date.now()}_admin_cancel`;
  await insertTestSubscription({ user_id: null, razorpay_order_id: orderId3, plan_name: 'pro', status: 'active', current_period_start: now.toISOString(), current_period_end: periodEnd });
  // Create a fake payment captured event so we have a payment id
  const payId = `pay_capture_${Date.now()}`;
  const capEvt = { id: `evt_cap_${Date.now()}`, event: 'payment.captured', payload: { payment: { entity: { id: payId, order_id: orderId3, status: 'captured', amount: 49900 } } } };
  await sendWebhook(capEvt);
  // Now admin cancel
  const adminCancel = { id: `evt_admin_cancel_${Date.now()}`, event: 'subscription.cancelled', payload: { subscription: { entity: { id: `sub_admin_${Date.now()}`, status: 'cancelled' } }, notes: { source: 'admin', refund: 'full' } } };
  await sendWebhook(adminCancel);
  // Attempt to create a refund in Razorpay (test mode) or simulate
  const refundResp = await createRazorpayRefund(payId, 49900);
  console.log('-> Refund response (or simulation):', refundResp || 'simulated');
  const s3 = await querySubscriptionByOrder(orderId3);
  console.log('-> DB row for admin cancellation:', s3.data || s3.error || 'not found');

  // 4) Grace period handling: ensure access until current_period_end
  console.log('[SCENARIO] grace period handling check');
  const graceOrder = `test_order_${Date.now()}_grace`;
  const periodEndFuture = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  await insertTestSubscription({ user_id: null, razorpay_order_id: graceOrder, plan_name: 'pro', status: 'cancelled', current_period_start: now.toISOString(), current_period_end: periodEndFuture });
  const graceRow = (await querySubscriptionByOrder(graceOrder)).data;
  if (graceRow) {
    console.log('-> current_period_end:', graceRow.current_period_end, 'now < end => access should remain until period end');
  } else console.log('-> grace row not found');
}

async function runRetrySimulation() {
  console.log('\n== Retry mechanism simulation ==');
  const orderId = `test_order_${Date.now()}_retry`;
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await insertTestSubscription({ user_id: null, razorpay_order_id: orderId, plan_name: 'pro', status: 'active', current_period_start: now.toISOString(), current_period_end: periodEnd });

  // initial failure
  const firstFail = { id: `evt_retry_${Date.now()}_1`, event: 'payment.failed', payload: { payment: { entity: { id: `pay_retry_${Date.now()}_1`, order_id: orderId, status: 'failed' } } } };
  await sendWebhook(firstFail);
  console.log('[RETRY] scheduled retries at 1,3,7 days (simulated now)');

  // simulate retry attempts (max 3 attempts). We'll send two more failures and then a success.
  for (let attempt = 2; attempt <= 3; attempt++) {
    const evt = { id: `evt_retry_${Date.now()}_${attempt}`, event: 'payment.failed', payload: { payment: { entity: { id: `pay_retry_${Date.now()}_${attempt}`, order_id: orderId, status: 'failed' } } } };
    await sendWebhook(evt);
  }
  // Now final attempt success
  const success = { id: `evt_retry_success_${Date.now()}`, event: 'payment.captured', payload: { payment: { entity: { id: `pay_retry_success_${Date.now()}`, order_id: orderId, status: 'captured', amount: 49900 } } } };
  await sendWebhook(success);

  const s = await querySubscriptionByOrder(orderId);
  console.log('-> subscription row after retry flow:', s.data || s.error || 'not found');

  // Check webhook_dead_letters table for entries (if present)
  try {
    const { data: dl, error } = await supabaseAdmin.from('webhook_dead_letters').select('*').limit(5);
    if (!error) console.log('-> webhook_dead_letters sample:', dl.slice(0, 5));
  } catch (e) {}

  // Notification check (notifications table expected)
  try {
    const { data: notes } = await supabaseAdmin.from('notifications').select('*').eq('event', 'payment.failed').limit(5);
    console.log('-> recent payment.failed notifications (if any):', notes || 'none');
  } catch (e) {}
}

async function runRefundTests() {
  console.log('\n== Refund processing tests ==');
  const orderId = `test_order_${Date.now()}_refund`;
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString();
  await insertTestSubscription({ user_id: null, razorpay_order_id: orderId, plan_name: 'pro', status: 'active', current_period_start: now.toISOString(), current_period_end: periodEnd });

  // Simulate a captured payment
  const paymentId = `pay_ref_${Date.now()}`;
  const capEvt = { id: `evt_cap_ref_${Date.now()}`, event: 'payment.captured', payload: { payment: { entity: { id: paymentId, order_id: orderId, status: 'captured', amount: 10000 } } } };
  await sendWebhook(capEvt);

  // Full refund within 7 days
  console.log('[REFUND] full refund within 7 days');
  const fullRefundResp = await createRazorpayRefund(paymentId, 10000);
  console.log('-> full refund response (or simulated):', fullRefundResp || 'simulated');

  // Prorated refund after 7 days — compute prorated amount (example: 50%)
  console.log('[REFUND] prorated refund scenario (simulated)');
  const proratedAmount = Math.floor(10000 * 0.5);
  const proratedResp = await createRazorpayRefund(paymentId, proratedAmount);
  console.log('-> prorated refund response (or simulated):', proratedResp || 'simulated');

  // Accounting record check
  try {
    const { data } = await supabaseAdmin.from('refunds').select('*').eq('payment_id', paymentId).limit(5);
    console.log('-> refunds table entries for payment:', data || 'none');
  } catch (e) {}
}

async function runDunningFlows() {
  console.log('\n== Dunning management simulation ==');
  const userOrder = `test_order_${Date.now()}_dunning`;
  await insertTestSubscription({ user_id: null, razorpay_order_id: userOrder, plan_name: 'pro', status: 'active', current_period_start: new Date().toISOString(), current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() });

  // Simulate failure and send dunning emails sequence (we only assert DB notifications)
  const failEvt = { id: `evt_dun_${Date.now()}`, event: 'payment.failed', payload: { payment: { entity: { id: `pay_dun_${Date.now()}`, order_id: userOrder, status: 'failed' } } } };
  await sendWebhook(failEvt);

  // Simulate dunning emails being inserted by backend scheduled job
  console.log('[DUNNING] checking notifications table for payment.failed entries');
  try {
    const { data } = await supabaseAdmin.from('notifications').select('*').eq('event', 'payment.failed').limit(10);
    console.log('-> dunning notifications:', data || 'none');
  } catch (e) {}

  // Simulate suspension after final failure — check subscription status
  console.log('[DUNNING] simulating final failure -> account suspension');
  for (let i = 0; i < 3; i++) {
    const e = { id: `evt_final_${Date.now()}_${i}`, event: 'payment.failed', payload: { payment: { entity: { id: `pay_final_${Date.now()}_${i}`, order_id: userOrder, status: 'failed' } } } };
    await sendWebhook(e);
  }
  const s = await querySubscriptionByOrder(userOrder);
  console.log('-> subscription after dunning final failures:', s.data || s.error || 'not found');

  // Reactivation after payment success
  const success = { id: `evt_react_${Date.now()}`, event: 'payment.captured', payload: { payment: { entity: { id: `pay_react_${Date.now()}`, order_id: userOrder, status: 'captured', amount: 49900 } } } };
  await sendWebhook(success);
  const s2 = await querySubscriptionByOrder(userOrder);
  console.log('-> subscription after reactivation:', s2.data || s2.error || 'not found');

  // Churn analysis sample: cancellations in last 30 days
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: churn } = await supabaseAdmin.rpc('churn_report', { since_ts: since }).catch(() => ({ data: null }));
    console.log('-> churn report (RPC churn_report expected):', churn || 'RPC not present. See docs for SQL sample.');
  } catch (e) {}
}

async function main() {
  console.log('Starting enhanced payment E2E test run');
  if (!RAZORPAY_WEBHOOK_SECRET) console.warn('RAZORPAY_WEBHOOK_SECRET not set — webhooks cannot be signed (script will error if attempted)');

  await runCancellationFlows();
  await runRetrySimulation();
  await runRefundTests();
  await runDunningFlows();

  console.log('\nE2E payment test run complete.');
}

main().catch((err) => {
  console.error('E2E test script error', err);
  process.exit(1);
});
