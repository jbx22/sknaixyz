// NDMO Compliance — Saudi National Data Management Office
// AES-256-GCM encryption + PII masking for identity data

const ALGORITHM = "aes-256-gcm";
const KEY_ENV = "NDMO_ENCRYPTION_KEY"; // Must be 32 bytes hex (64 hex chars)

function getKey(): Buffer {
  const raw = process.env[KEY_ENV];
  if (!raw) {
    // Dev-only fallback — log a loud warning in production
    if (process.env.NODE_ENV === "production") {
      throw new Error(`NDMO: ${KEY_ENV} is not set. Cannot encrypt PII.`);
    }
    console.warn(`NDMO: ${KEY_ENV} not set. Using insecure dev fallback. Set 32-byte hex key in production.`);
    return Buffer.from("dev-ndmo-key-32bytes-fallback!!!!!", "utf8").slice(0, 32);
  }
  return Buffer.from(raw, "hex");
}

// Encrypt a plaintext national ID, phone, or other PII
// Returns `iv:ciphertext:authTag` (all hex-encoded)
export function ndmoEncrypt(plaintext: string): string {
  const crypto = require("crypto");
  const key = getKey();
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${encrypted}:${authTag}`;
}

// Decrypt a value produced by ndmoEncrypt
export function ndmoDecrypt(payload: string): string {
  const crypto = require("crypto");
  const key = getKey();
  const parts = payload.split(":");
  if (parts.length !== 3) throw new Error("NDMO: Invalid encrypted payload format");
  const [ivHex, ciphertext, authTagHex] = parts;
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// Mask a national ID for display on dashboards/cards: "1234567890" → "1XXXXX7890"
// Keeps first 1 and last 4 digits visible per NDMO data masking guidelines
export function ndmoMaskNationalId(raw: string): string {
  if (!raw || raw.length < 6) return raw;
  return raw.slice(0, 1) + "X".repeat(raw.length - 5) + raw.slice(-4);
}

// Mask a phone number: "0555123456" → "055XXXX456"
export function ndmoMaskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  return phone.slice(0, 3) + "X".repeat(phone.length - 6) + phone.slice(-3);
}

// Process KYC record: encrypt PII fields, generate masked versions for display
export async function ndmoProcessKycRecord(
  db: any,
  kycId: number,
  nationalId: string,
  phone: string
): Promise<void> {
  const maskedNationalId = ndmoMaskNationalId(nationalId);
  const encryptedNationalId = ndmoEncrypt(nationalId);
  const encryptedPhone = ndmoEncrypt(phone);

  await db
    .updateTable("kycRecords")
    .set({
      nationalIdEncrypted: encryptedNationalId,
      phoneEncrypted: encryptedPhone,
      ndmoMaskedNationalId: maskedNationalId,
    })
    .where("id", "=", kycId)
    .execute();
}

// Mask sensitive fields in a compliance log entry for frontend display
export function ndmoMaskLogDetails(details: any): any {
  if (!details || typeof details !== "object") return details;
  const masked = { ...details };
  if (masked.nationalId) masked.nationalId = ndmoMaskNationalId(masked.nationalId);
  if (masked.phone) masked.phone = ndmoMaskPhone(masked.phone);
  if (masked.tenantPhone) masked.tenantPhone = ndmoMaskPhone(masked.tenantPhone);
  if (masked.landlordPhone) masked.landlordPhone = ndmoMaskPhone(masked.landlordPhone);
  return masked;
}
