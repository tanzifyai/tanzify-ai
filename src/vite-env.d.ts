/// <reference types="vite/client" />

declare global {
  interface Window {
    Razorpay: {
      new (options: RazorpayOptions): RazorpayInstance;
    };
  }

  interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description?: string;
    order_id?: string;
    prefill?: {
      name?: string;
      email?: string;
    };
    theme?: {
      color?: string;
    };
    handler?: (response: RazorpayResponse) => void;
    modal?: {
      ondismiss?: () => void;
    };
  }

  interface RazorpayInstance {
    open(): void;
  }

  interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }
}
