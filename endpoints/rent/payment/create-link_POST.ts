import { schema, OutputType } from "./create-link_POST.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";
import { getPaymentProvider } from "../../../helpers/payment/index";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin" && session.user.role !== "user") {
      return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    }
    const body = superjson.parse(await request.text());
    const input = schema.parse(body);
    const invoice = await db.selectFrom("rentInvoices").where("id", "=", input.invoiceId).selectAll().executeTakeFirstOrThrow();
    const provider = getPaymentProvider(input.provider);
    const result = await provider.createPaymentLink({
      invoiceId: input.invoiceId,
      amount: Number(invoice.amount),
      currency: "SAR",
      description: `Rent invoice #${invoice.id}`,
      returnUrl: input.returnUrl,
      cancelUrl: input.cancelUrl,
    });
    await db.insertInto("paymentIntents").values({
      invoiceId: input.invoiceId,
      provider: input.provider as "mock" | "tap" | "moyasar" | "hyperpay",
      providerIntentId: result.providerReference,
      amount: String(result.amount),
      currency: result.currency,
      paymentUrl: result.paymentUrl,
      intentStatus: "created",
    }).execute();
    return new Response(superjson.stringify({ success: true, paymentUrl: result.paymentUrl, providerReference: result.providerReference } satisfies OutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}
