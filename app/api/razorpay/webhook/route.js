import crypto from 'crypto';
import { createPaymentDbClient } from '../../../lib/payment-db-client.js';
const ALERT_WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL;

// Initialize Sentry if provided
let Sentry = null;
try {
  // lazy require to avoid errors when package not installed
  // eslint-disable-next-line global-require
  const sentry = require('../../../src/lib/sentry');
  Sentry = sentry.initSentry();
} catch (e) {
  // ignore if Sentry not available
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function sendAlert(message, payload) {
  try {
    console.error('ALERT:', message);
    const url = process.env.ALERT_WEBHOOK_URL || ALERT_WEBHOOK_URL;
    if (url) {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, payload }),
      });
    }
  } catch (e) {
    console.error('Failed to send alert webhook', e);
  }
}

async function upsertWebhookEvent(eventId, ev, payload) {
  try {
    const { data, error } = await supabaseAdmin
      .from('webhook_events')
      .upsert({ id: eventId, event_type: ev, payload, processed: false }, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      // If table doesn't exist or other error, bubble up
      throw error;
    }
    return data;
  } catch (err) {
    throw err;
  }
}

async function markEventProcessed(eventId) {
  try {
    await supabaseAdmin.from('webhook_events').update({ processed: true, processed_at: new Date().toISOString() }).eq('id', eventId);
  } catch (e) {
    // ignore if table doesn't exist
    console.warn('markEventProcessed warning', e?.message || e);
  }
}

async function safeDbUpdate(fn, attempts = 3) {
  let lastErr = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const backoff = Math.pow(2, i) * 250;
      console.warn(`DB write failed, attempt=${i + 1}, retrying in ${backoff}ms`, err?.message || err);
      await sleep(backoff);
    }
  }
  throw lastErr;
}

export async function POST(req, { dbClient } = {}) {
  try {
    const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.VITE_RAZORPAY_WEBHOOK_SECRET;
    const payload = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || req.headers.get('X-Razorpay-Signature');

    if (!RAZORPAY_WEBHOOK_SECRET) {
      console.warn('Missing RAZORPAY_WEBHOOK_SECRET');
      return new Response('Webhook secret not configured', { status: 500 });
    }

    const expected = crypto.createHmac('sha256', RAZORPAY_WEBHOOK_SECRET).update(payload).digest('hex');
    if (!signature || expected !== signature) {
      console.warn('Invalid webhook signature');
      return new Response('Invalid signature', { status: 400 });
    }

    const event = JSON.parse(payload);
    const ev = event.event;
    const eventId = event.id || `${ev}:${event?.payload?.payment?.entity?.id || Date.now()}`;

    // prepare db client (injected or default)
    const client = dbClient || createPaymentDbClient();

    // Idempotency: upsert event record; if already processed, skip
    try {
      const e = await client.upsertWebhookEvent(eventId, ev, payload);
      if (e && e.processed) {
        console.info('Webhook already processed, skipping', eventId);
        return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200 });
      }
    } catch (e) {
      // If webhook_events table missing, continue but warn
      console.warn('webhook_events upsert failed (table may be missing):', e?.message || e);
    }

    // Centralized event processing with retry-safe DB writes
    if (ev === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;

        // Call Postgres stored procedure to atomically process payment
        await safeDbUpdate(async () => {
          const { data, error } = await client.processPaymentRpc(orderId, paymentId, null);
          if (error) {
            throw error;
          }
          return data;
        }).catch(async (err) => {
          console.error('Failed to process payment.captured via RPC', err?.message || err);
          // Insert into dead-letter queue
          try {
            await client.insertDeadLetter({ id: eventId, event_type: ev, payload: payload, error: String(err), attempts: 1 });
          } catch (dlErr) {
            console.error('Failed to write dead letter', dlErr?.message || dlErr);
          }
          await sendAlert('Failed to process payment.captured', { eventId, err: String(err) });
          throw err;
        });
    }

    if (ev === 'subscription.activated' || ev === 'subscription.created') {
      const subscription = event.payload.subscription.entity;
      const subscriptionId = subscription.id;
      const status = subscription.status || 'active';

      await safeDbUpdate(async () => {
        // Upsert subscription by razorpay_subscription_id
        const { data, error } = await client.upsertSubscriptionByRazorpayId(subscriptionId, status);
        if (error) throw error;
        return data;
      }).catch(async (err) => {
        console.error('Failed to process subscription.created/activated', err?.message || err);
        await sendAlert('Failed to process subscription.created/activated', { eventId, err: String(err) });
        throw err;
      });
    }

    if (ev === 'subscription.cancelled' || ev === 'subscription.paused') {
      const subscription = event.payload.subscription.entity;
      const subscriptionId = subscription.id;

      await safeDbUpdate(async () => {
        await client.updateSubscriptionByRazorpayId(subscriptionId, { status: 'cancelled' });
        return true;
      }).catch(async (err) => {
        console.error('Failed to process subscription.cancelled', err?.message || err);
        await sendAlert('Failed to process subscription.cancelled', { eventId, err: String(err) });
        throw err;
      });
    }

    if (ev === 'subscription.charged' || ev === 'payment.authorized' || ev === 'payment.failed') {
      // Handle recurring charge and payment failures
      try {
        const payment = event.payload.payment?.entity || event.payload?.payment_entity || null;
        if (payment) {
          const orderId = payment.order_id;
          const paymentId = payment.id;

          await safeDbUpdate(async () => {
            const { data: subs, error: subErr } = await client.findSubscriptionByOrder(orderId);
            if (!subErr && subs) {
              // For charged: record payment and extend period
              if (ev === 'subscription.charged' || event.event === 'payment.captured') {
                const now = new Date().toISOString();
                const periodEnd = new Date(Date.parse(now) + 30 * 24 * 60 * 60 * 1000).toISOString();
                await client.updateSubscriptionById(subs.id, { razorpay_payment_id: paymentId, status: 'active', current_period_end: periodEnd });
              }

              if (ev === 'payment.failed' || event.event === 'payment.failed') {
                // mark subscription past_due
                await client.updateSubscriptionById(subs.id, { status: 'past_due' });
                await sendAlert('Payment failed for subscription', { eventId, subscriptionId: subs.id });
              }
            }
          });
        }
      } catch (err) {
        console.error('Failed to process recurring/failed payment', err?.message || err);
        await sendAlert('Failed to process recurring/failed payment', { eventId, err: String(err) });
        throw err;
      }
    }

    // Mark processed and return
    try {
      await client.markEventProcessed(eventId);
    } catch (e) {
      console.warn('Could not mark event processed', e?.message || e);
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error('Webhook handler error', err);
    await sendAlert('Webhook handler error', { error: String(err) });
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
}

export const runtime = 'nodejs';
