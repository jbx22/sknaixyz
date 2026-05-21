// Saudi SMS Gateway Integration
// Supports Unifonic, Yamamah, and other local providers for REGA compliance notifications

export type SmsProvider = "unifonic" | "yamamah" | "console";

interface SmsConfig {
  provider: SmsProvider;
  apiKey?: string;
  senderId?: string;
}

function getConfig(): SmsConfig {
  return {
    provider: (process.env.SMS_PROVIDER as SmsProvider) || "console",
    apiKey: process.env.SMS_API_KEY,
    senderId: process.env.SMS_SENDER_ID || "SKNAI",
  };
}

// Send an SMS notification via the configured provider
export async function sendSmsNotification(
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; provider: SmsProvider; messageId?: string }> {
  const config = getConfig();

  // Normalize Saudi numbers: remove leading 0 or +966, ensure 9665xxxxxxxx format
  const normalized = normalizeSaudiNumber(phoneNumber);
  if (!normalized) {
    console.error(`[SMS GATEWAY] Invalid Saudi phone number: ${phoneNumber}`);
    return { success: false, provider: config.provider };
  }

  switch (config.provider) {
    case "unifonic":
      return sendUnifonic(normalized, message, config);
    case "yamamah":
      return sendYamamah(normalized, message, config);
    case "console":
    default:
      console.log(`[SMS GATEWAY] [${config.provider}] To: ${normalized} — "${message}"`);
      return { success: true, provider: "console" };
  }
}

// Unifonic REST API
async function sendUnifonic(
  phoneNumber: string,
  message: string,
  config: SmsConfig
): Promise<{ success: boolean; provider: "unifonic"; messageId?: string }> {
  if (!config.apiKey) {
    console.warn("[SMS GATEWAY] Unifonic: SMS_API_KEY not configured. Falling back to console log.");
    console.log(`[SMS UNIFONIC] To: ${phoneNumber} — "${message}"`);
    return { success: true, provider: "unifonic" };
  }

  try {
    const response = await fetch("https://el.cloud.unifonic.com/rest/SMS/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        recipient: phoneNumber,
        body: message,
        sender: config.senderId || "SKNAI",
      }),
    });

    const data = await response.json();
    if (response.ok && data.messageID) {
      return { success: true, provider: "unifonic", messageId: data.messageID };
    }
    console.error("[SMS UNIFONIC] API error:", data);
    return { success: false, provider: "unifonic" };
  } catch (err) {
    console.error("[SMS UNIFONIC] Network error:", err);
    return { success: false, provider: "unifonic" };
  }
}

// Yamamah SMS REST API
async function sendYamamah(
  phoneNumber: string,
  message: string,
  config: SmsConfig
): Promise<{ success: boolean; provider: "yamamah"; messageId?: string }> {
  if (!config.apiKey) {
    console.warn("[SMS GATEWAY] Yamamah: SMS_API_KEY not configured. Falling back to console log.");
    console.log(`[SMS YAMAMAH] To: ${phoneNumber} — "${message}"`);
    return { success: true, provider: "yamamah" };
  }

  try {
    const response = await fetch("https://api.yamamah.com/v1/send-sms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        numbers: phoneNumber,
        message,
        sender: config.senderId || "SKNAI",
      }),
    });

    const data = await response.json();
    if (response.ok && data.message_id) {
      return { success: true, provider: "yamamah", messageId: data.message_id };
    }
    console.error("[SMS YAMAMAH] API error:", data);
    return { success: false, provider: "yamamah" };
  } catch (err) {
    console.error("[SMS YAMAMAH] Network error:", err);
    return { success: false, provider: "yamamah" };
  }
}

// Normalize Saudi phone numbers to international format 966xxxxxxxxx
function normalizeSaudiNumber(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 9 && digits.startsWith("5")) return `966${digits}`;
  if (digits.length === 10 && digits.startsWith("05")) return `966${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith("966")) return digits;
  if (digits.length === 13 && digits.startsWith("00966")) return `966${digits.slice(5)}`;
  if (digits.length === 14 && digits.startsWith("+966")) return digits.slice(1);
  // Allow non-Saudi numbers through if they look valid
  if (digits.length >= 10 && digits.length <= 15) return digits;
  return null;
}

// Compliance notification templates (Arabic)
export function getComplianceSmsTemplates() {
  return {
    sixtyDayNotice: (contractNumber: string, daysLeft: number, propertyName: string) =>
      `📋 تنبيه نظامي من SKNAI: العقد رقم ${contractNumber} للعقار "${propertyName}" ينتهي بعد ${daysLeft} يوماً. سيتم التجديد التلقائي ما لم يتم الإنهاء حسب الأنظمة.`,
    
    paymentOverdue: (amount: number, daysOverdue: number, contractNumber: string) =>
      `💰 تذكير من SKNAI: قيمة الإيجار المستحق ${amount} ريال للعقد رقم ${contractNumber} متأخر بـ ${daysOverdue} يوماً. يرجى السداد لتجنب الإجراءات النظامية.`,
    
    paymentReminder: (amount: number, daysLeft: number) =>
      `💳 تذكير من SKNAI: استحقاق قيمة الإيجار ${amount} ريال بعد ${daysLeft} أيام. يرجى السداد في الوقت المحدد.`,
    
    contractExpiring: (contractNumber: string, daysLeft: number) =>
      `⚠️ تنبيه من SKNAI: العقد رقم ${contractNumber} سينتهي بعد ${daysLeft} يوماً. يرجى التواصل مع المالك للتجديد أو الإخلاء النظامي.`,
  };
}
