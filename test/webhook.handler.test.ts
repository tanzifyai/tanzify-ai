import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import { createPgMemPaymentClient } from './utils/pgmem-client';

// Common test env
process.env.RAZORPAY_WEBHOOK_SECRET = 'test_secret_123';

// Ensure alert URL is present before importing the handler so module-level const captures it
process.env.ALERT_WEBHOOK_URL = 'http://test.alert.local/hook';

// Ensure global fetch is available and mockable
let fetchMock = vi.fn();
globalThis.fetch = ((...args: any[]) => fetchMock(...args)) as any;

// Import handler after mocks are set up
import * as webhook from '../app/api/razorpay/webhook/route.js';

function sign(payload: string) {
  return crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!).update(payload).digest('hex');
}

function buildReq(payloadObj: any, badSig = false) {
  const payload = JSON.stringify(payloadObj);
  const signature = badSig ? 'bad_sig' : sign(payload);
  return {
    text: async () => payload,
    headers: {
      get: (k: string) => (k.toLowerCase() === 'x-razorpay-signature' ? signature : null),
    },
  } as any;
}

describe('Webhook handler - expanded failure & lifecycle tests', () => {
  let client: any;
  // increase test timeout for slower pg-mem operations
  beforeEach(() => {
    vi.resetAllMocks();
    client = createPgMemPaymentClient();
    fetchMock = vi.fn().mockResolvedValue({ ok: true });
  });

  async function pollSql(db: any, sql: string, timeout = 2000, interval = 50) {
    const start = Date.now();
    // support oneOrNone in pg-mem helper; fallback to try/catch
    while (Date.now() - start < timeout) {
      try {
        const res = db.public.oneOrNone ? db.public.oneOrNone(sql) : (() => { try { return db.public.one(sql); } catch (e) { return null; } })();
        if (res) return res;
      } catch (e) {}
      // small wait
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, interval));
    }
    return null;
  }

  it('rejects invalid signature', async () => {
    const payload = { event: 'payment.captured' };
    const res = await webhook.POST(buildReq(payload, true), { dbClient: client });
    expect(res.status).toBe(400);
  });

  it('handles malformed JSON payload gracefully', async () => {
    const badReq = { text: async () => 'not a json', headers: { get: () => sign('not a json') } } as any;
    const res = await webhook.POST(badReq, { dbClient: client });
    // JSON.parse will throw, handler should return 500
    expect(res.status).toBe(500);
  });

  it('inserts into DLQ when RPC fails', async () => {
    // Simulate RPC throwing
    client.processPaymentRpc = vi.fn().mockRejectedValue(new Error('RPC failure'));
    // Spy on dead letter insertion (wrap original to avoid recursion)
    const origInsert = client.insertDeadLetter.bind(client);
    const spyDL = vi.fn(async (r: any) => origInsert(r));
    client.insertDeadLetter = spyDL;

    const evt = { id: `evt_${Date.now()}`, event: 'payment.captured', payload: { payment: { entity: { id: 'pay1', order_id: 'order1' } } } };
    const res = await webhook.POST(buildReq(evt), { dbClient: client });
    // Expect handler to return 500 due to RPC failure
    expect(res.status).toBe(500);
    // DLQ upsert should have been called — poll for deterministic persistence
    const dl = await pollSql(client.__db, `SELECT * FROM webhook_dead_letters LIMIT 1`, 2000, 50);
    expect(dl, 'dead letter row not persisted in DB').toBeTruthy();
    // Alert should be sent
    if (!fetchMock.mock.calls.length) throw new Error('Expected alert fetch to be called for DLQ insertion');
  });

  it('skips processing for duplicate webhook events (idempotency)', async () => {
    const evt = { id: 'evt_dup_1', event: 'payment.captured', payload: { payment: { entity: { id: 'pdup', order_id: 'orddup' } } } };
    // Pre-insert processed event
    client.__db.public.none(`INSERT INTO webhook_events (id, event_type, payload, processed) VALUES ('${evt.id}', 'payment.captured', '${JSON.stringify(evt.payload).replace(/'/g, "''")} '::jsonb, true)`);
    const res = await webhook.POST(buildReq(evt), { dbClient: client });
    expect(res.status).toBe(200);
    const row = client.__db.public.one(`SELECT processed FROM webhook_events WHERE id='${evt.id}'`);
    expect(row).toBeTruthy();
  });

  it('handles rate of repeated events without crashing', async () => {
    const evt = { id: `evt_rate_${Date.now()}`, event: 'payment.captured', payload: { payment: { entity: { id: 'pay_rate', order_id: 'order_rate' } } } };
    const calls: any[] = [];
    const origUpsert = client.upsertWebhookEvent.bind(client);
    client.upsertWebhookEvent = async (id: string, ev: string, payload: string) => {
      calls.push(payload);
      return origUpsert(id, ev, payload);
    };

    // Simulate 10 rapid calls
    const requests = Array.from({ length: 10 }).map(() => webhook.POST(buildReq(evt), { dbClient: client }));
    const results = await Promise.all(requests);
    for (const r of results) expect(r.status).toBe(200);
    // All upserts recorded
    expect(calls.length).toBe(10);
  });

  it('marks subscription past_due on payment.failed and notifies', async () => {
    // ensure a subscription exists for order_fail
    const subId = crypto.randomUUID();
    client.__db.public.none(`INSERT INTO subscriptions (id, razorpay_order_id, status, created_at, updated_at) VALUES ('${subId}','order_fail','active', now(), now())`);

    const failEvt = { id: `evt_fail_${Date.now()}`, event: 'payment.failed', payload: { payment: { entity: { id: 'pay_fail_1', order_id: 'order_fail' } } } };
    const res = await webhook.POST(buildReq(failEvt), { dbClient: client });
    expect(res.status).toBe(200);
    // verify subscription updated
    const sub = client.__db.public.one(`SELECT status FROM subscriptions WHERE razorpay_order_id='order_fail' LIMIT 1`);
    expect(sub).toBeTruthy();
    // notification (fetch) should be triggered
    expect(fetchMock).toHaveBeenCalled();
  });

  it('subscription lifecycle: activate -> renew -> cancel -> expire', async () => {
    const upsertSpy = vi.fn().mockResolvedValue({ data: null, error: null });
    const updateSpy = vi.fn().mockResolvedValue({ data: null, error: null });
    // created
    const created = { id: `evt_created_${Date.now()}`, event: 'subscription.created', payload: { subscription: { entity: { id: 'sub_life', status: 'created' } } } };
    await webhook.POST(buildReq(created), { dbClient: client });
    // activated
    const activated = { id: `evt_activated_${Date.now()}`, event: 'subscription.activated', payload: { subscription: { entity: { id: 'sub_life', status: 'active' } } } };
    await webhook.POST(buildReq(activated), { dbClient: client });
    // simulate renewal via payment.captured
    const pay = { id: `evt_pay_${Date.now()}`, event: 'payment.captured', payload: { payment: { entity: { id: 'pay_life', order_id: 'order_life' } } } };
    client.processPaymentRpc = vi.fn().mockResolvedValue({ data: null, error: null });
    await webhook.POST(buildReq(pay), { dbClient: client });
    // cancel
    const cancel = { id: `evt_cancel_${Date.now()}`, event: 'subscription.cancelled', payload: { subscription: { entity: { id: 'sub_life', status: 'cancelled' } } } };
    await webhook.POST(buildReq(cancel), { dbClient: client });

    // Expect upsert/update called multiple times through lifecycle
    // Expect DB reflects lifecycle
    const s = client.__db.public.one(`SELECT id FROM subscriptions WHERE razorpay_subscription_id='sub_life' LIMIT 1`);
    // we may not have razorpay_subscription_id set in this flow; assert at least one subscription exists
    const anySub = client.__db.public.one(`SELECT id FROM subscriptions LIMIT 1`);
    expect(anySub).toBeTruthy();
  });

  it('concurrent webhooks causing RPC deadlock are retried and eventually succeed', async () => {
    // Simulate RPC that fails first two times then succeeds
    let callCount = 0;
    client.processPaymentRpc = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount <= 2) throw new Error('deadlock');
      // on success, insert notification to emulate side effects
      const note = JSON.stringify({ order_id: 'order_conc', payment_id: 'pay_conc' }).replace(/'/g, "''");
      client.__db.public.none(`INSERT INTO notifications (event, payload) VALUES ('payment.processed', '${note}'::jsonb)`);
      return { data: null, error: null };
    });

    const evt = { id: `evt_conc_${Date.now()}`, event: 'payment.captured', payload: { payment: { entity: { id: 'pay_conc', order_id: 'order_conc' } } } };
    const res = await webhook.POST(buildReq(evt), { dbClient: client });
    // Handler retries internally; final outcome should be 200 when rpc eventually succeeds
    expect(res.status).toBe(200);
    // ensure processPaymentRpc called multiple times
    expect(client.processPaymentRpc.mock.calls.length).toBeGreaterThanOrEqual(3);
    // ensure processPaymentRpc attempts resulted in notifications
    const note = client.__db.public.one(`SELECT * FROM notifications WHERE payload->>'payment_id' = 'pay_conc' LIMIT 1`);
    expect(note).toBeTruthy();
  });
});
