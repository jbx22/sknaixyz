import type { PaymentProviderName } from "../schema";

export interface PaymentIntentResult {
  providerIntentId: string;
  paymentUrl: string;
  status: "created" | "processing" | "succeeded" | "failed" | "cancelled";
  expiresAt?: Date;
}

export interface WebhookEvent {
  eventType: string;
  providerEventId: string;
  payload: Record<string, any>;
  invoiceId?: number;
  amount?: string;
  status?: string;
}

export interface PaymentProvider {
  name: PaymentProviderName;
  createPaymentIntent(params: {
    invoiceId: number;
    amount: number;
    currency?: string;
    metadata?: Record<string, any>;
  }): Promise<PaymentIntentResult>;

  verifyWebhookSignature(payload: string, signature: string): boolean;
  parseWebhookEvent(payload: string): WebhookEvent;
}
