import { schema, OutputType } from "./webhook_POST.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getPaymentProvider } from "../../../helpers/payment/index";

export async function handle(request: Request) {
  try {
    // Webhook endpoint - NO auth required (comes from payment providers)
    const body = superjson.parse(await request.text());
    const input = schema.parse(body);
    const provider = getPaymentProvider(input.provider);
    const rawBody = JSON.stringify(input.payload);
    const verification = await provider.verifyWebhook(rawBody, input.signature);
    if (!verification.verified || !verification.event) {
      return new Response(superjson.stringify({ error: "Webhook verification failed" }), { status: 400 });
    }
    const event = verification.event;
    // Store webhook event
    await db.insertInto("paymentWebhookEvents").values({
      provider: input.provider as "mock" | "tap" | "moyasar" | "hyperpay",
      eventType: event.eventType,
      providerEventId: event.providerEventId,
      payload: input.payload,
      processed: true,
      processingError: null,
    }).execute();
    // Update payment intent and invoice based on event
    if (event.providerReference) {
      const intent = await db.selectFrom("paymentIntents")
        .where("providerIntentId", "=", event.providerReference)
        .selectAll().executeTakeFirst();
      if (intent) {
        const newStatus = event.status === "completed" ? "succeeded" : event.status === "failed" ? "failed" : "processing";
        await db.updateTable("paymentIntents").set({ intentStatus: newStatus, updatedAt: new Date() }).where("id", "=", intent.id).execute();
        if (event.status === "completed") {
          await db.updateTable("rentInvoices").set({
            invoiceStatus: "paid",
            paidAmount: intent.amount,
            paidAt: event.paidAt ? new Date(event.paidAt) : new Date(),
            updatedAt: new Date(),
          }).where("id", "=", intent.invoiceId).execute();
        }
      }
    }
    return new Response(superjson.stringify({ success: true, message: "Webhook processed" } satisfies OutputType));
  } catch (error) {
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}
