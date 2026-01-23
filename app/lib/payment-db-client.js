import { createClient } from '@supabase/supabase-js';

export function createPaymentDbClient() {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  return {
    upsertWebhookEvent: async (eventId, eventType, payload) => {
      return supabaseAdmin.from('webhook_events').upsert({ id: eventId, event_type: eventType, payload, processed: false }, { onConflict: 'id' }).select().single();
    },

    markEventProcessed: async (eventId) => {
      return supabaseAdmin.from('webhook_events').update({ processed: true, processed_at: new Date().toISOString() }).eq('id', eventId);
    },

    processPaymentRpc: async (orderId, paymentId, planName = null) => {
      return supabaseAdmin.rpc('process_razorpay_payment', { p_order_id: orderId, p_payment_id: paymentId, p_plan_name: planName });
    },

    upsertSubscriptionByRazorpayId: async (razorpaySubscriptionId, status) => {
      return supabaseAdmin.from('subscriptions').upsert({ razorpay_subscription_id: razorpaySubscriptionId, status }, { onConflict: 'razorpay_subscription_id' });
    },

    updateSubscriptionByRazorpayId: async (razorpaySubscriptionId, data) => {
      return supabaseAdmin.from('subscriptions').update(data).eq('razorpay_subscription_id', razorpaySubscriptionId);
    },

    updateSubscriptionById: async (id, data) => {
      return supabaseAdmin.from('subscriptions').update(data).eq('id', id);
    },

    findSubscriptionByOrder: async (orderId) => {
      return supabaseAdmin.from('subscriptions').select('*').eq('razorpay_order_id', orderId).limit(1).single();
    },

    insertDeadLetter: async (record) => {
      return supabaseAdmin.from('webhook_dead_letters').upsert(record);
    },
  };
}
