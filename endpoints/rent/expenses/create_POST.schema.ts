import { z } from "zod";
import superjson from "superjson";
import { ExpenseCategoryArrayValues } from "../../../helpers/schema";

export const schema = z.object({ propertyId: z.number(), category: z.enum(ExpenseCategoryArrayValues), description: z.string().optional(), amount: z.number().min(0), expenseDate: z.string(), receiptUrl: z.string().optional() });
export type InputType = z.infer<typeof schema>;
export type OutputType = { success: boolean; expense: { id: number } };
export const createRentExpense = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const r = await fetch("/_api/rent/expenses/create", { method: "POST", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }, body: superjson.stringify(params) });
  if (!r.ok) { const e = superjson.parse<{ error: string }>(await r.text()); throw new Error(e.error); }
  return superjson.parse<OutputType>(await r.text());
};
