import superjson from "superjson";
export type OutputType = { success: boolean; results: { overdue: number; reminders: number; expiring: number } };
const API_BASE = "/_api";
export const triggerRentChecks = async (secret: string): Promise<OutputType> => {
  const res = await fetch(`${API_BASE}/cron/rent-checks`, { method: "GET", headers: { "Authorization": `Bearer ${secret}` } });
  if (!res.ok) { const e = superjson.parse<{ error: string }>(await res.text()); throw new Error(e.error); }
  return superjson.parse<OutputType>(await res.text());
};
