import superjson from "superjson";
export type OutputType = { success: boolean; ejarReference?: string; message?: string };

export interface InputType {
  contractId: number;
  paymentMethod: "SADAD" | "MADA" | "BANK_TRANSFER" | "CASH";
  amountSar?: number;
}
