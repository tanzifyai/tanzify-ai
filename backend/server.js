// backend/server.js - Production Backend Implementation
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
const Razorpay = require('razorpay');
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
require('dotenv').config();

const app = express();

// Initialize services
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// AWS S3 setup
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET,
    key: function (req, file, cb) {
      cb(null, `uploads/${Date.now()}_${file.originalname}`);
    },
  }),
});

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

// File upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    res.json({
      success: true,
      file: {
        key: req.file.key,
        location: req.file.location,
        originalname: req.file.originalname,
        size: req.file.size,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Stripe checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { planId, userId, userEmail } = req.body;

    const plans = {
      'starter-monthly': { priceId: process.env.STRIPE_STARTER_PRICE_ID, name: 'Starter Monthly' },
      'pro-monthly': { priceId: process.env.STRIPE_PRO_PRICE_ID, name: 'Pro Monthly' },
      'team-monthly': { priceId: process.env.STRIPE_TEAM_PRICE_ID, name: 'Team Monthly' },
    };

    const plan = plans[planId];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

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

      await supabase
        .from('users')
        .update({ stripe_customer_id: customer.id })
        .eq('id', userId);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{ price: plan.priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&plan=${planId}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?canceled=true`,
      metadata: { userId, planName: plan.name },
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Razorpay order creation
app.post('/api/create-razorpay-order', async (req, res) => {
  try {
    const { planId, userId } = req.body;

    const plans = {
      'starter-monthly': { amount: 59900, name: 'Starter Monthly' }, // ₹599
      'pro-monthly': { amount: 149900, name: 'Pro Monthly' }, // ₹1499
      'team-monthly': { amount: 399900, name: 'Team Monthly' }, // ₹3999
    };

    const plan = plans[planId];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const options = {
      amount: plan.amount,
      currency: 'INR',
      receipt: `receipt_${userId}_${Date.now()}`,
      notes: {
        userId,
        planName: plan.name,
        planId,
      },
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Razorpay order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Razorpay payment verification
app.post('/api/verify-razorpay-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, planId } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSign) {
      // Update user subscription
      const plans = {
        'starter-monthly': { name: 'starter', minutes: 60 },
        'pro-monthly': { name: 'pro', minutes: 150 },
        'team-monthly': { name: 'team', minutes: 400 },
      };

      const plan = plans[planId];
      await supabase
        .from('users')
        .update({
          subscription_plan: plan.name,
          credits: plan.minutes,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// Stripe webhooks
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        const userId = session.metadata.userId;
        const planName = session.metadata.planName;

        const planLimits = {
          'Starter Monthly': { name: 'starter', minutes: 60 },
          'Pro Monthly': { name: 'pro', minutes: 150 },
          'Team Monthly': { name: 'team', minutes: 400 },
        };

        const plan = planLimits[planName];
        if (plan) {
          await supabase
            .from('users')
            .update({
              subscription_plan: plan.name,
              credits: plan.minutes,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
        }
        break;

      case 'invoice.payment_succeeded':
        // Handle successful subscription renewal
        break;

      case 'invoice.payment_failed':
        // Handle failed payment
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Live stats endpoint
app.get('/api/live-stats', async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('transcriptions')
      .select('user_id', { count: 'exact' })
      .gte('created_at', twentyFourHoursAgo);

    if (error) {
      console.error('Live stats error:', error);
      return res.status(500).json({ error: 'Failed to fetch stats' });
    }

    const activeUsers = new Set(data.map(t => t.user_id)).size;
    
    res.json({ activeUsers });
  } catch (error) {
    console.error('Live stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});