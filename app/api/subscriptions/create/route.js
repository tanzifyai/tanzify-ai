import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Supabase service role key or URL not configured. subscription endpoint will error if called.');
}

const supabaseAdmin = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '', {
  auth: { persistSession: false },
});

const razorpay = RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET ? new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET }) : null;

// Plan definitions — amounts in smallest currency unit (e.g., paise for INR)
const PLANS = {
  basic: {
    name: 'basic',
    amount: Number(process.env.RAZORPAY_AMOUNT_BASIC || '50000'), // default 500.00
    currency: process.env.RAZORPAY_CURRENCY || 'INR',
    periodDays: Number(process.env.RAZORPAY_PERIOD_DAYS_BASIC || '30'),
  },
  pro: {
    name: 'pro',
    amount: Number(process.env.RAZORPAY_AMOUNT_PRO || '150000'), // default 1500.00
    currency: process.env.RAZORPAY_CURRENCY || 'INR',
    periodDays: Number(process.env.RAZORPAY_PERIOD_DAYS_PRO || '365'),
  },
};

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, plan, razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;

    if (!userId || !plan) {
      return new Response(JSON.stringify({ success: false, message: 'userId and plan are required' }), { status: 400 });
    }

    const planDef = PLANS[plan];
    if (!planDef) {
      return new Response(JSON.stringify({ success: false, message: 'Unknown plan' }), { status: 400 });
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ success: false, message: 'Server not configured (missing SUPABASE_SERVICE_ROLE_KEY)' }), { status: 500 });
    }

    // Validate user exists
    const { data: user, error: userErr } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userErr || !user) {
      return new Response(JSON.stringify({ success: false, message: 'User not found' }), { status: 404 });
    }

    if (!razorpay) {
      return new Response(JSON.stringify({ success: false, message: 'Razorpay not configured on server' }), { status: 500 });
    }

    // If a payment was completed on the client, verify signature and finalize subscription
    if (razorpay_payment_id && razorpay_order_id && razorpay_signature) {
      const generated_signature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

      if (generated_signature !== razorpay_signature) {
        return new Response(JSON.stringify({ success: false, message: 'Invalid payment signature' }), { status: 400 });
      }

      // Mark subscription active and persist payment info
      const now = new Date();
      const expiresAt = new Date(now.getTime() + planDef.periodDays * 24 * 60 * 60 * 1000).toISOString();

      const { data: createdSub, error: createErr } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id: userId,
          razorpay_order_id: razorpay_order_id,
          razorpay_payment_id: razorpay_payment_id,
          plan_name: planDef.name,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: expiresAt,
        })
        .select()
        .single();

      if (createErr) {
        console.error('Failed to insert subscription record', createErr);
        return new Response(JSON.stringify({ success: false, message: 'Failed to record subscription' }), { status: 500 });
      }

      // Update user's subscription_plan and store customer id if available
      await supabaseAdmin.from('users').update({ subscription_plan: planDef.name }).eq('id', userId);

      return new Response(JSON.stringify({ success: true, subscriptionId: createdSub.id, expiresAt }), { status: 200 });
    }

    // Otherwise create a Razorpay order and return order details for client checkout
    const receipt = `order_rcpt_${userId}_${Date.now()}`;
    const order = await razorpay.orders.create({
      amount: planDef.amount,
      currency: planDef.currency,
      receipt,
      payment_capture: 1,
    });

    // Persist a pending subscription row referencing the order
    const { data: pendingSub, error: pendingErr } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: userId,
        razorpay_order_id: order.id,
        plan_name: planDef.name,
        status: 'pending',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date().toISOString(),
      })
      .select()
      .single();

    if (pendingErr) {
      console.error('Failed to insert pending subscription record', pendingErr);
      // continue — still return order info to client to let them attempt payment
    }

    return new Response(
      JSON.stringify({ success: true, orderId: order.id, amount: planDef.amount, currency: planDef.currency, keyId: RAZORPAY_KEY_ID }),
      { status: 200 },
    );
  } catch (err) {
    console.error('Subscription endpoint error', err);
    return new Response(JSON.stringify({ success: false, message: 'Server error', error: String(err) }), { status: 500 });
  }
}

export const runtime = 'edge';
