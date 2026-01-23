import { describe, it, expect } from 'vitest';
import { createTestDb, seedTestData } from './utils/pgmem';

describe('Payments DB integration (pg-mem)', () => {
  it('creates and queries subscription', () => {
    const db = createTestDb();
    seedTestData(db);
    const row = db.public.one("SELECT razorpay_order_id, status FROM subscriptions LIMIT 1");
    expect(row.razorpay_order_id).toBe('order_seed_1');
    expect(row.status).toBe('active');
  });

  it('records refunds and can query accounting entries', () => {
    const db = createTestDb();
    db.public.none(`INSERT INTO refunds (payment_id, amount, reason) VALUES ('pay123', 1000, 'test refund')`);
    const r = db.public.one(`SELECT payment_id, amount FROM refunds WHERE payment_id='pay123'`);
    expect(r.payment_id).toBe('pay123');
    expect(r.amount).toBe(1000);
  });
});
