import React from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '', { auth: { persistSession: false } });

export default async function PaymentsAdminPage() {
  // Server component: fetch metrics using service role key
  const [{ data: subscriptions }, { data: revenue }] = await Promise.all([
    supabaseAdmin.from('subscriptions').select('id,plan_name,status,created_at').limit(100),
    supabaseAdmin.rpc('calculate_revenue', {}) // optional RPC to compute revenue (create separately)
  ]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Payments Admin</h1>

      <section className="mb-6">
        <h2 className="text-lg font-semibold">Recent Subscriptions</h2>
        <table className="w-full text-sm mt-2">
          <thead>
            <tr>
              <th>ID</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions?.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.plan_name}</td>
                <td>{s.status}</td>
                <td>{new Date(s.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="mt-2">
          <button className="btn" onClick={async () => {
            const res = await fetch('/api/admin/payments/retry', { method: 'POST', body: JSON.stringify({}) });
            alert('Trigger sent: ' + res.status);
          }}>Retry Failed Webhooks</button>
        </div>
      </section>
    </div>
  );
}
