import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({ page: z.number().min(1).default(1), limit: z.number().min(1).max(100).default(20), propertyId: z.number().optional(), category: z.string().optional(), });
export type InputType = z.infer<typeof schema>;
export type ExpenseItem = { id: number; propertyId: number; category: string; description: string | null; amount: number; expenseDate: Date | null; receiptUrl: string | null; recordedBy: number | null; createdAt: Date | null };
export type OutputType = { expenses: ExpenseItem[]; total: number; page: number; limit: number; totalPages: number };
export const getRentExpenses = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const sp = new URLSearchParams(); sp.append("page", String(params.page)); sp.append("limit", String(params.limit));
  if (params.propertyId) sp.append("propertyId", String(params.propertyId));
  if (params.category) sp.append("category", params.category);
  const r = await fetch(`/_api/rent/expenses/list?${sp}`, { method: "GET", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  if (!r.ok) { const e = superjson.parse<{ error: string }>(await r.text()); throw new Error(e.error); }
  return superjson.parse<OutputType>(await r.text());
};
