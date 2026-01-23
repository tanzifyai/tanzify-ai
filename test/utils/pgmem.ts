import { newDb } from 'pg-mem';

export function createTestDb() {
  const db = newDb({ autoCreateForeignKeyIndices: true });
  // pg-mem doesn't implement some Postgres functions by default; register gen_random_uuid
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require('crypto');
    // Register gen_random_uuid as uuid-returning function so defaults produce UUID values
    db.public.registerFunction({
      name: 'gen_random_uuid',
      returns: 'uuid',
      implementation: () => crypto.randomUUID(),
    });
  } catch (e) {
    // ignore if registration not needed
  }
  // Basic schema for payments tests
  db.public.none(`
    CREATE TABLE users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text);
    CREATE TABLE subscriptions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES users(id),
      razorpay_order_id text,
      razorpay_subscription_id text,
      plan_name text,
      status text,
      current_period_start timestamptz,
      current_period_end timestamptz,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    CREATE TABLE webhook_events (id text PRIMARY KEY, event_type text, payload jsonb, processed boolean DEFAULT false, processed_at timestamptz);
    CREATE TABLE webhook_dead_letters (id text PRIMARY KEY, event_type text, payload jsonb, error text, attempts int DEFAULT 0, created_at timestamptz DEFAULT now());
    CREATE TABLE refunds (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), payment_id text, amount int, reason text, created_at timestamptz DEFAULT now());
    CREATE TABLE notifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event text, payload jsonb, created_at timestamptz DEFAULT now());
  `);

  return db;
}

export function seedTestData(db: any) {
  const now = new Date().toISOString();
  db.public.none(`INSERT INTO users (id, email) VALUES ('00000000-0000-0000-0000-000000000001', 'test@example.com');`);
  const seedSubId = '00000000-0000-0000-0000-000000000010';
  db.public.none(`INSERT INTO subscriptions (id, user_id, razorpay_order_id, plan_name, status, current_period_start, current_period_end) VALUES ('${seedSubId}', '00000000-0000-0000-0000-000000000001', 'order_seed_1','pro','active','${now}','${now}');`);
}
