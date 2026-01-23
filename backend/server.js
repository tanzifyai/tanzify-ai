// REMOVED: backend/server.js — backend removed from core repo per cleanup decision

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