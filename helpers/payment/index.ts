import type { PaymentProviderName } from "../schema";
import type { PaymentProvider } from "./types";
import { MockPaymentProvider } from "./mock";
import { TapPaymentProvider } from "./tap";
import { MoyasarPaymentProvider } from "./moyasar";
import { HyperPayPaymentProvider } from "./hyperpay";

const providers: Record<PaymentProviderName, () => PaymentProvider> = {
  mock: () => new MockPaymentProvider(),
  tap: () => new TapPaymentProvider(),
  moyasar: () => new MoyasarPaymentProvider(),
  hyperpay: () => new HyperPayPaymentProvider(),
};

export function getPaymentProvider(providerName?: PaymentProviderName): PaymentProvider {
  const name = providerName || (process.env.PAYMENT_PROVIDER as PaymentProviderName) || "mock";
  const factory = providers[name];
  if (!factory) {
    throw new Error(`Unknown payment provider: ${name}`);
  }
  return factory();
}
