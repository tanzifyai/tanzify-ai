import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceId: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  credits: number; // minutes
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'forever-free',
    name: 'Free',
    priceId: 'price_free',
    amount: 0,
    currency: 'inr',
    interval: 'month',
    credits: 30,
  },
  {
    id: 'starter-monthly',
    name: 'Starter Monthly',
    priceId: 'price_starter_monthly_inr',
    amount: 19900, // Stripe expects amount in cents/paise
    currency: 'inr',
    interval: 'month',
    credits: 60,
  },
  {
    id: 'pro-monthly',
    name: 'Pro Monthly',
    priceId: 'price_pro_monthly_inr',
    amount: 49900,
    currency: 'inr',
    interval: 'month',
    credits: 150,
  },
  {
    id: 'team-monthly',
    name: 'Team Monthly',
    priceId: 'price_team_monthly_inr',
    amount: 99900,
    currency: 'inr',
    interval: 'month',
    credits: 400,
  },
];

export const stripeService = {
  getStripe: () => stripePromise,

  async redirectToCheckout(planId: string, userId: string, userEmail: string) {
    const stripe = await stripePromise;
    if (!stripe) throw new Error('Stripe failed to load');

    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) throw new Error('Plan not found');

    // For now, we'll use Stripe's hosted checkout
    // In production, you'd create a checkout session on your backend
    const checkoutUrl = `https://buy.stripe.com/test_${plan.priceId}?client_reference_id=${userId}&prefilled_email=${encodeURIComponent(userEmail)}`;

    // Redirect to Stripe Checkout
    window.location.href = checkoutUrl;
  },

  async redirectToCustomerPortal(customerId: string) {
    // For now, redirect to a customer portal URL
    // In production, this would create a portal session on your backend
    window.location.href = 'https://billing.stripe.com/p/login/test_your_customer_portal_link';
  }
};