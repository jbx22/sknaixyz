import { z } from "zod";
import superjson from "superjson";

const schema = z.object({}).default({});

export type InputType = z.infer<typeof schema>;
export type OutputType = {
  properties: Array<{
    id: number;
    title: string;
    locationName: string;
    status: string;
    myRole: string;
    unitsCount: number;
    activeContracts: number;
    monthlyIncome: number;
  }>;
  access: {
    canManage: boolean;
    canViewReports: boolean;
    canListUnits: boolean;
    canApproveTenants: boolean;
    role: string;
  };
};

const API_BASE = "/_api/rent";

export const getMyProperties = async (_input?: InputType, init?: RequestInit): Promise<OutputType> => {
  const res = await fetch(`${API_BASE}/my-properties`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const json = await res.json();
  return superjson.parse(json) as OutputType;
};
