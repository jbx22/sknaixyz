import type { PaymentProvider, PaymentIntentResult, WebhookEvent } from "./types";

/**
 * TODO: Implement HyperPay integration.
 * - Obtain credentials from HyperPay merchant dashboard
 * - Implement createPaymentIntent with HyperPay's checkout API
 * - Implement webhook signature verification using HyperPay's signature header
 * - Handle HyperPay-specific event types
 * Docs: https://www.hyperpay.com/
 */
export class HyperPayPaymentProvider implements PaymentProvider {
  name = "hyperpay" as const;

  async createPaymentIntent(params: {
    invoiceId: number;
    amount: number;
    currency?: string;
    metadata?: Record<string, any>;
  }): Promise<PaymentIntentResult> {
    // TODO: Replace with actual HyperPay API call
    throw new Error("HyperPay integration not yet implemented");
  }

  verifyWebhookSignature(_payload: string, _signature: string): boolean {
    // TODO: Implement HyperPay webhook signature verification
    throw new Error("HyperPay integration not yet implemented");
  }

  parseWebhookEvent(_payload: string): WebhookEvent {
    // TODO: Implement HyperPay webhook event parsing
    throw new Error("HyperPay integration not yet implemented");
  }
}
