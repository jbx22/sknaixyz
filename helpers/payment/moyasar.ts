import type { PaymentProvider, PaymentIntentResult, WebhookEvent } from "./types";

/**
 * TODO: Implement Moyasar Payments integration.
 * - Obtain API key from Moyasar dashboard
 * - Implement createPaymentIntent with Moyasar's Payments API
 * - Implement webhook signature verification
 * - Handle Moyasar-specific event types: payment.paid, payment.failed, payment.refunded
 * Docs: https://moyasar.com/docs/api/
 */
export class MoyasarPaymentProvider implements PaymentProvider {
  name = "moyasar" as const;

  async createPaymentIntent(params: {
    invoiceId: number;
    amount: number;
    currency?: string;
    metadata?: Record<string, any>;
  }): Promise<PaymentIntentResult> {
    // TODO: Replace with actual Moyasar API call
    throw new Error("Moyasar Payments integration not yet implemented");
  }

  verifyWebhookSignature(_payload: string, _signature: string): boolean {
    // TODO: Implement Moyasar webhook signature verification
    throw new Error("Moyasar Payments integration not yet implemented");
  }

  parseWebhookEvent(_payload: string): WebhookEvent {
    // TODO: Implement Moyasar webhook event parsing
    throw new Error("Moyasar Payments integration not yet implemented");
  }
}
