import { supabase } from '@/lib/supabase';
import API_BASE from '@/lib/api';

export interface RazorpayPlan {
  id: string;
  name: string;
  amount: number; // in paise
  minutes: number;
}

export const RAZORPAY_PLANS: RazorpayPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    amount: 19900, // ₹199 in paise
    minutes: 60,
  },
  {
    id: 'pro',
    name: 'Pro',
    amount: 49900, // ₹499 in paise
    minutes: 150,
  },
  {
    id: 'team',
    name: 'Team',
    amount: 99900, // ₹999 in paise
    minutes: 400,
  },
];

export const razorpayService = {
  loadRazorpay: () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  },

  createOrder: async (planId: string, userId: string, userEmail: string) => {
    const plan = RAZORPAY_PLANS.find(p => p.id === planId);
    if (!plan) throw new Error('Plan not found');

    // Call server endpoint to create an order (server will use service key)
    const endpoint = `${API_BASE.replace(/\/$/, '')}/api/subscriptions/create`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, plan: planId }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Order creation failed: ${res.status} ${text}`);
      }

      const json = await res.json();
      return {
        id: json.orderId,
        amount: json.amount || plan.amount,
        currency: json.currency || 'INR',
        keyId: json.keyId,
        planId,
        userId,
        userEmail,
      };
    } catch (err) {
      console.error('createOrder error', err);
      throw err;
    }
  },

  initiatePayment: async (planId: string, userId: string, userEmail: string, userName: string) => {
    const isLoaded = await razorpayService.loadRazorpay();
    if (!isLoaded) throw new Error('Razorpay failed to load');
    const order = await razorpayService.createOrder(planId, userId, userEmail);
    const plan = RAZORPAY_PLANS.find(p => p.id === planId);

    const options: RazorpayOptions = {
      key: (order.keyId as string) || import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'Tanzify AI',
      description: `${plan?.name} Plan - ${plan?.minutes} minutes`,
      order_id: order.id,
      prefill: {
        name: userName,
        email: userEmail,
      },
      theme: {
        color: '#8b5cf6',
      },
      handler: async (response: RazorpayResponse) => {
        await razorpayService.handlePaymentSuccess(response, planId, userId);
      },
      modal: {
        ondismiss: () => {
          console.log('Payment cancelled');
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  },

  handlePaymentSuccess: async (response: RazorpayResponse, planId: string, userId: string) => {
    try {
      // Let the server verify signature and finalize the subscription
      const endpoint = `${API_BASE.replace(/\/$/, '')}/api/subscriptions/create`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          plan: planId,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Server finalize failed: ${res.status} ${txt}`);
      }

      const json = await res.json();
      if (json.success) {
        const plan = RAZORPAY_PLANS.find(p => p.id === planId);
        alert(`Payment successful! Welcome to ${plan?.name} Plan.`);
        window.location.href = '/dashboard';
      } else {
        throw new Error(json.message || 'Subscription finalize failed');
      }
    } catch (error) {
      console.error('Error finalizing subscription:', error);
      alert('Payment succeeded, but we could not update your account automatically. Please contact support.');
    }
  },
};