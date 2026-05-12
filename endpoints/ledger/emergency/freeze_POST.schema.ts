import { z } from "zod";
import superjson from "superjson";
import { ControlKeyTypeArrayValues, AssetControls, GlobalControls } from "../../../helpers/schema";
import { Selectable } from "kysely";

export const schema = z.object({
  scope: z.enum(["asset", "global"]),
  action: z.enum(["freeze", "unfreeze"]),
  assetId: z.number().optional(),
  controlKey: z.enum(ControlKeyTypeArrayValues).optional(),
  type: z.enum(["full", "transfers", "issuance", "distributions"]).optional(),
  reason: z.string().min(5),
}).refine((data) => {
  if (data.scope === "asset" && !data.assetId) return false;
  if (data.scope === "global" && !data.controlKey) return false;
  return true;
}, {
  message: "Missing required fields for selected scope",
  path: ["scope"]
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  control: Selectable<AssetControls> | Selectable<GlobalControls>;
  message: string;
};

export const postEmergencyFreeze = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/ledger/emergency/freeze`, {
    method: "POST",
    body: superjson.stringify(body),
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