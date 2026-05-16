import type { PaymentProvider, PaymentIntentResult, WebhookEvent } from "./types";

/**
 * TODO: Implement Tap Payments integration.
 * - Obtain API key from Tap Payments dashboard
 * - Implement createPaymentIntent with Tap's Charges API
 * - Implement webhook signature verification using Tap's HMAC header
 * - Handle Tap-specific event types: charge.created, charge.captured, charge.failed
 * Docs: https://www.tap.company/docs
 */
export class TapPaymentProvider implements PaymentProvider {
  name = "tap" as const;

  async createPaymentIntent(params: {
    invoiceId: number;
    amount: number;
    currency?: string;
    metadata?: Record<string, any>;
  }): Promise<PaymentIntentResult> {
    // TODO: Replace with actual Tap API call
    throw new Error("Tap Payments integration not yet implemented");
  }

  verifyWebhookSignature(_payload: string, _signature: string): boolean {
    // TODO: Implement Tap webhook signature verification
    throw new Error("Tap Payments integration not yet implemented");
  }

  parseWebhookEvent(_payload: string): WebhookEvent {
    // TODO: Implement Tap webhook event parsing
    throw new Error("Tap Payments integration not yet implemented");
  }
}
