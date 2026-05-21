/**
 * NDMO Compliance: Mask Saudi National IDs for data privacy.
 * Shows only first 2 + XXXXX + last 3 digits (e.g., 10XXXXX922)
 */
export function maskNationalId(id: string | number | null | undefined): string {
  if (!id) return "—";
  const s = String(id).replace(/\D/g, ""); // strip non-digits
  if (s.length !== 10) return `${s.slice(0, 2)}XXXXX${s.slice(-3)}`;
  return `${s.slice(0, 2)}XXXXX${s.slice(-3)}`;
}

/**
 * Calculate remaining days until a target date.
 */
export function daysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const d = new Date(date);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export type ComplianceLevel = "critical" | "warning" | "valid";

/**
 * Determine compliance level based on days remaining until contract end.
 * - critical: ≤ 10 days
 * - warning: ≤ 60 days (Saudi Rental Code 60-day notice period)
 * - valid: > 60 days or no end date
 */
export function getComplianceLevel(endDate: Date | string | null | undefined): ComplianceLevel {
  const days = daysUntil(endDate);
  if (days === null) return "valid";
  if (days <= 10) return "critical";
  if (days <= 60) return "warning";
  return "valid";
}

/**
 * Get display label for a compliance level.
 */
export function getComplianceLabel(level: ComplianceLevel, daysRemaining: number | null, language: "ar" | "en"): string {
  if (level === "critical") {
    return language === "ar"
      ? `⚠️ حرج (${daysRemaining} يوم)`
      : `⚠️ Critical (${daysRemaining} day${daysRemaining !== 1 ? "s" : ""})`;
  }
  if (level === "warning") {
    return language === "ar"
      ? `⚠️ تنبيه (${daysRemaining} يوم)`
      : `⚠️ Warning (${daysRemaining} day${daysRemaining !== 1 ? "s" : ""})`;
  }
  return language === "ar" ? "✅ متوافق" : "✅ Compliant";
}

/**
 * Get CSS color class for a compliance level.
 */
export function getComplianceColor(level: ComplianceLevel): string {
  switch (level) {
    case "critical": return "var(--danger, #ef4444)";
    case "warning": return "var(--warning, #f59e0b)";
    case "valid": return "var(--success, #22c55e)";
  }
}
