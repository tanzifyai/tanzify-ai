import { createTestDb, seedTestData } from './pgmem';
import type { PaymentDBClient } from '../../src/lib/payment-db-client';
// lightweight uuid generator for test inserts
import crypto from 'crypto';

function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

export function createPgMemPaymentClient() {
  const db = createTestDb();

  // seed default data
  seedTestData(db);

  const client: PaymentDBClient & { __db: any } = {
    __db: db,
    async upsertWebhookEvent(eventId: string, eventType: string, payload: string) {
      const sql = `INSERT INTO webhook_events (id, event_type, payload, processed) VALUES ('${eventId}', '${eventType}', '${payload.replace(/'/g, "''")}'::jsonb, false) ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload RETURNING processed`;
      const row = db.public.one(sql);
      return { data: row, error: null };
    },

    async markEventProcessed(eventId: string) {
      const row = db.public.one(`UPDATE webhook_events SET processed=true, processed_at=now() WHERE id='${eventId}' RETURNING *`);
      return { data: row, error: null };
    },

    async processPaymentRpc(orderId: string, paymentId: string, planName?: string | null) {
      try {
        // Simple transactional emulation: lock subscription, update period, insert notification
        db.public.none('BEGIN');
        const sub = db.public.oneOrNone ? db.public.oneOrNone(`SELECT * FROM subscriptions WHERE razorpay_order_id='${orderId}' LIMIT 1 FOR UPDATE`) : (() => {
          try { return db.public.one(`SELECT * FROM subscriptions WHERE razorpay_order_id='${orderId}' LIMIT 1 FOR UPDATE`); } catch (e) { return null; }
        })();

        if (!sub) {
          // No subscription found — create a lightweight entry with explicit id
          const id = crypto.randomUUID();
          db.public.none(`INSERT INTO subscriptions (id, razorpay_order_id, plan_name, status, current_period_start, current_period_end) VALUES ('${id}', '${orderId}', '${planName || ''}', 'active', now(), now() + interval '30 days')`);
        } else {
          db.public.none(`UPDATE subscriptions SET current_period_start=now(), current_period_end=now() + interval '30 days', updated_at=now() WHERE razorpay_order_id='${orderId}'`);
        }

        const note = JSON.stringify({ order_id: orderId, payment_id: paymentId }).replace(/'/g, "''");
        // generate explicit uuid for notifications to avoid default collision issues in pg-mem
        const noteId = crypto.randomUUID();
        const noteSql = `INSERT INTO notifications (id, event, payload) VALUES ('${noteId}', 'payment.processed', '${note}'::jsonb) ON CONFLICT (id) DO NOTHING RETURNING *`;
        const insertedNote = db.public.oneOrNone ? db.public.oneOrNone(noteSql) : (() => { try { return db.public.one(noteSql); } catch (e) { return null; } })();
        db.public.none('COMMIT');
        return { data: null, error: null };
      } catch (err: any) {
        try { db.public.none('ROLLBACK'); } catch (e) {}
        return { data: null, error: err };
      }
    },

    async upsertSubscriptionByRazorpayId(razorpaySubscriptionId: string, status: string) {
      const found = db.public.oneOrNone ? db.public.oneOrNone(`SELECT * FROM subscriptions WHERE razorpay_subscription_id='${razorpaySubscriptionId}' LIMIT 1`) : (() => {
        try { return db.public.one(`SELECT * FROM subscriptions WHERE razorpay_subscription_id='${razorpaySubscriptionId}' LIMIT 1`); } catch (e) { return null; }
      })();
      if (found) {
        db.public.none(`UPDATE subscriptions SET status='${status}', updated_at=now() WHERE razorpay_subscription_id='${razorpaySubscriptionId}'`);
        return { data: null, error: null };
      }
      const id = crypto.randomUUID();
      db.public.none(`INSERT INTO subscriptions (id, razorpay_subscription_id, status, created_at, updated_at) VALUES ('${id}', '${razorpaySubscriptionId}', '${status}', now(), now())`);
      return { data: null, error: null };
    },

    async updateSubscriptionByRazorpayId(razorpaySubscriptionId: string, data: Record<string, any>) {
      const sets = Object.entries(data).map(([k, v]) => `${k}='${String(v).replace(/'/g, "''")}'`).join(', ');
      db.public.none(`UPDATE subscriptions SET ${sets}, updated_at=now() WHERE razorpay_subscription_id='${razorpaySubscriptionId}'`);
      return { data: null, error: null };
    },

    async updateSubscriptionById(id: string, data: Record<string, any>) {
      const sets = Object.entries(data).map(([k, v]) => `${k}='${String(v).replace(/'/g, "''")}'`).join(', ');
      db.public.none(`UPDATE subscriptions SET ${sets}, updated_at=now() WHERE id='${id}'`);
      return { data: null, error: null };
    },

    async findSubscriptionByOrder(orderId: string) {
      try {
        const row = db.public.one(`SELECT * FROM subscriptions WHERE razorpay_order_id='${orderId}' LIMIT 1`);
        return { data: row, error: null };
      } catch (e) {
        return { data: null, error: null };
      }
    },

    async insertDeadLetter(record: Record<string, any>) {
      const id = record.id || crypto.randomUUID();
      const event_type = record.event_type || record.event || 'unknown';
      const payload = JSON.stringify(record.payload || {});
      const error = record.error || '';
      const sql = `INSERT INTO webhook_dead_letters (id, event_type, payload, error, attempts, created_at) VALUES ('${id}', '${event_type}', '${payload.replace(/'/g, "''")}'::jsonb, '${String(error).replace(/'/g, "''")}', ${record.attempts || 1}, now()) ON CONFLICT (id) DO UPDATE SET attempts = webhook_dead_letters.attempts + 1, error = EXCLUDED.error, payload = EXCLUDED.payload RETURNING *`;
      // retry loop for transient test races
      const maxAttempts = 3;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          // perform insert/upsert, then SELECT the persisted row to avoid RETURNING issues
          db.public.none(sql);
          const row = db.public.one(`SELECT * FROM webhook_dead_letters WHERE id='${id}' LIMIT 1`);
          return { data: row, error: null };
        } catch (err) {
          if (attempt === maxAttempts) return { data: null, error: err };
          await delay(50 * attempt);
        }
      }
      return { data: null, error: new Error('unknown') };
    },
  };

  return client;
}

export type PgMemClient = ReturnType<typeof createPgMemPaymentClient>;
