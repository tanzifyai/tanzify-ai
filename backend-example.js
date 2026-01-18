// backend/server.js - Example backend implementation
// This is a Node.js/Express server that handles server-side operations

const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

app.use(cors());
app.use(express.json());

// Email transporter
const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Create Stripe checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { planId, userId, userEmail } = req.body;

    // Get plan details
    const plans = {
      'starter-monthly': { priceId: 'price_starter_monthly_inr', name: 'Starter Monthly' },
      'pro-monthly': { priceId: 'price_pro_monthly_inr', name: 'Pro Monthly' },
      'team-monthly': { priceId: 'price_team_monthly_inr', name: 'Team Monthly' },
    };

    const plan = plans[planId];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // Create or retrieve Stripe customer
    let customer;
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (user?.stripe_customer_id) {
      customer = await stripe.customers.retrieve(user.stripe_customer_id);
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
      });

      // Update user with Stripe customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: customer.id })
        .eq('id', userId);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&plan=${planId}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?canceled=true`,
      metadata: {
        userId,
        planName: plan.name,
      },
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Create customer portal session
app.post('/api/create-portal-session', async (req, res) => {
  try {
    const { customerId } = req.body;

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.FRONTEND_URL}/dashboard`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// Stripe webhooks
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        await handleCheckoutCompleted(session);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        await handlePaymentSucceeded(invoice);
        break;

      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        await handleSubscriptionCancelled(subscription);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

async function handleCheckoutCompleted(session) {
  const userId = session.metadata.userId;
  const planName = session.metadata.planName;

  // Map plan name to plan type
  const planTypeMap = {
    'Starter Monthly': 'starter',
    'Pro Monthly': 'pro',
    'Team Monthly': 'team',
  };

  const planType = planTypeMap[planName] || 'free';

  // Update user subscription and reset minutes
  await supabase
    .from('users')
    .update({
      subscription_plan: planType,
      minutes_used: 0, // Reset minutes on upgrade
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  // Create subscription record
  const subscription = await stripe.subscriptions.retrieve(session.subscription);

  await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      plan_name: planName,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
    });

  // Send confirmation email
  const { data: user } = await supabase
    .from('users')
    .select('email, name')
    .eq('id', userId)
    .single();

  if (user) {
    await sendPaymentConfirmationEmail(user.email, planName, subscription.items.data[0].price.unit_amount);
  }
}

async function handlePaymentSucceeded(invoice) {
  // Update subscription status if needed
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', invoice.subscription);
}

async function handleSubscriptionCancelled(subscription) {
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  // Optionally downgrade user to free plan
  const { data: subData } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (subData) {
    await supabase
      .from('users')
      .update({
        subscription_plan: 'forever-free',
        updated_at: new Date().toISOString()
      })
      .eq('id', subData.user_id);
  }
}

async function sendPaymentConfirmationEmail(email, planName, amount) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #8b5cf6;">Payment Confirmed!</h1>
      <p>Thank you for subscribing to <strong>${planName}</strong>.</p>
      <div style="background: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
        <p><strong>Amount Paid:</strong> $${(amount / 100).toFixed(2)}</p>
      </div>
      <p>Your subscription is now active!</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Payment Confirmed - ${planName} Subscription`,
    html,
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});