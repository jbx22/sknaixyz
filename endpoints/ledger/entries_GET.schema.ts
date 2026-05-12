import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { LedgerEntries, LedgerEntryTypeArrayValues, LedgerEntryStatusArrayValues } from "../../helpers/schema";

export const schema = z.object({
  assetId: z.number().optional(),
  userId: z.number().optional(),
  entryType: z.enum(LedgerEntryTypeArrayValues).optional(),
  status: z.enum(LedgerEntryStatusArrayValues).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(50),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  entries: Selectable<LedgerEntries>[];
  total: number;
  page: number;
  limit: number;
};

export const getLedgerEntriesEndpoint = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  if (params.assetId) searchParams.append("assetId", params.assetId.toString());
  if (params.userId) searchParams.append("userId", params.userId.toString());
  if (params.entryType) searchParams.append("entryType", params.entryType);
  if (params.status) searchParams.append("status", params.status);
  if (params.startDate) searchParams.append("startDate", params.startDate.toISOString());
  if (params.endDate) searchParams.append("endDate", params.endDate.toISOString());
  searchParams.append("page", params.page.toString());
  searchParams.append("limit", params.limit.toString());

  const result = await fetch(`/_api/ledger/entries?${searchParams.toString()}`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(await result.text());
    throw new Error(errorObject.error);
  }
  return superjson.parse<OutputType>(await result.text());
};