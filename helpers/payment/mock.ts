import type { PaymentProvider, PaymentIntentResult, WebhookEvent } from "./types";

export class MockPaymentProvider implements PaymentProvider {
  name = "mock" as const;

  async createPaymentIntent(params: {
    invoiceId: number;
    amount: number;
    currency?: string;
    metadata?: Record<string, any>;
  }): Promise<PaymentIntentResult> {
    const id = `mock_intent_${Date.now()}_${params.invoiceId}`;
    return {
      providerIntentId: id,
      paymentUrl: `https://mock-pay.sknaixyz.test/pay/${id}?amount=${params.amount}`,
      status: "created",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min
    };
  }

  verifyWebhookSignature(_payload: string, _signature: string): boolean {
    return true;
  }

  parseWebhookEvent(payload: string): WebhookEvent {
    try {
      const parsed = JSON.parse(payload);
      return {
        eventType: parsed.event_type || "payment.completed",
        providerEventId: parsed.id || `evt_${Date.now()}`,
        payload: parsed,
        invoiceId: parsed.invoice_id,
        amount: parsed.amount,
        status: parsed.status,
      };
    } catch {
      return {
        eventType: "unknown",
        providerEventId: `evt_${Date.now()}`,
        payload: {},
      };
    }
  }

  simulateWebhook(invoiceId: number, amount: number, status = "completed"): WebhookEvent {
    return {
      eventType: "payment.completed",
      providerEventId: `sim_evt_${Date.now()}`,
      payload: { invoice_id: invoiceId, amount, status },
      invoiceId,
      amount: String(amount),
      status,
    };
  }
}
