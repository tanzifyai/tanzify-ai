import { supabase } from '@/lib/supabase';

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

    // In a real implementation, this would call your backend API
    // For now, we'll create a mock order
    const orderId = `order_${Date.now()}`;

    return {
      id: orderId,
      amount: plan.amount,
      currency: 'INR',
      planId,
      userId,
      userEmail,
    };
  },

  initiatePayment: async (planId: string, userId: string, userEmail: string, userName: string) => {
    const isLoaded = await razorpayService.loadRazorpay();
    if (!isLoaded) throw new Error('Razorpay failed to load');

    const order = await razorpayService.createOrder(planId, userId, userEmail);
    const plan = RAZORPAY_PLANS.find(p => p.id === planId);

    const options: RazorpayOptions = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
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
      // Update user plan in database
      const plan = RAZORPAY_PLANS.find(p => p.id === planId);

      await supabase
        .from('users')
        .update({
          subscription_plan: planId,
          minutes_used: 0, // Reset minutes on upgrade
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      // Show success message
      alert(`Payment successful! Welcome to ${plan?.name} Plan with ${plan?.minutes} minutes.`);

      // Redirect to dashboard
      window.location.href = '/dashboard';

    } catch (error) {
      console.error('Error updating user plan:', error);
      alert('Payment successful but failed to update your account. Please contact support.');
    }
  },
};