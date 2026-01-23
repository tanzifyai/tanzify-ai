export interface PaymentDBClient {
  upsertWebhookEvent(eventId: string, eventType: string, payload: string): Promise<any>;
  markEventProcessed(eventId: string): Promise<any>;
  processPaymentRpc(orderId: string, paymentId: string, planName?: string | null): Promise<any>;
  upsertSubscriptionByRazorpayId(razorpaySubscriptionId: string, status: string): Promise<any>;
  updateSubscriptionByRazorpayId(razorpaySubscriptionId: string, data: Record<string, any>): Promise<any>;
  updateSubscriptionById(id: string, data: Record<string, any>): Promise<any>;
  findSubscriptionByOrder(orderId: string): Promise<any>;
  insertDeadLetter(record: Record<string, any>): Promise<any>;
}

export type Result = any;
