import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useLanguage } from "../helpers/useLanguage";
import { useComplianceStats, useCheckFalLicense, useEjarMirrorPayment, useComplianceChecklist } from "../helpers/useAdminCompliance";

export default function AdminComplianceDashboardPage() {
  const { language } = useLanguage();
  const isRtl = language === "ar";

  const { data: stats, isLoading: statsLoading } = useComplianceStats();
  const { data: checklist, isLoading: checklistLoading } = useComplianceChecklist();
  const checkFalLicense = useCheckFalLicense();
  const ejarMirror = useEjarMirrorPayment();

  const [falInput, setFalInput] = useState("");
  const [falResult, setFalResult] = useState<{ isValid: boolean; holderName?: string; message?: string } | null>(null);

  const [ejarContractId, setEjarContractId] = useState("");
  const [ejarResult, setEjarResult] = useState<{ success: boolean; ejarReference?: string; message?: string } | null>(null);

  const [scanResult, setScanResult] = useState<{ success: boolean; results?: { overdue: number; reminders: number; expiring: number; complianceNotices: number; smsSent: number; complianceUpdated: number }; error?: string } | null>(null);
  const [scanning, setScanning] = useState(false);

  const triggerComplianceScan = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const secret = import.meta.env.VITE_CRON_SECRET || 'sknai-cron-2024';
      const res = await fetch('/_api/cron/rent-checks', {
        headers: { 'Authorization': `Bearer ${secret}` }
      });
      const data = await res.json();
      setScanResult(data);
    } catch (err: any) {
      setScanResult({ success: false, error: err.message });
    } finally {
      setScanning(false);
    }
  };

  const translations = {
    ar: {
      title: "لوحة الامتثال التنظيمي",
      subtitle: "مراقبة الامتثال مع REGA، إيجار، وNDMO في الوقت الفعلي",
      totalContracts: "إجمالي العقود",
      validContracts: "متوافقة",
      warningContracts: "إنذار",
      criticalContracts: "حرجة",
      complianceRate: "نسبة الامتثال",
      ejarLinked: "مرتبطة بإيجار",
      monthlyRent: "الإيجار الشهري",
      recentLogs: "أحداث الامتثال (7 أيام)",
      falLicensesActive: "رخص فال نشطة",
      expiring60: "تنتهي خلال 60 يوم",
      expiring30: "تنتهي خلال 30 يوم",
      expiring7: "تنتهي خلال 7 أيام",
      checkFalTitle: "التحقق من رخصة فال",
      checkFalDesc: "أدخل رقم رخصة فال المكون من 10 أرقام للتحقق من صلاحيتها في الهيئة العامة للعقار",
      falPlaceholder: "أدخل رقم رخصة فال...",
      checkLicense: "التحقق",
      valid: "✔ سارية",
      invalid: "✘ غير صالحة",
      ejarMirrorTitle: "ربط الدفعة بإيجار",
      ejarMirrorDesc: "إرسال تأكيد سداد الدفعة الإيجارية إلى شبكة إيجار",
      contractId: "رقم العقد",
      paymentMethod: "طريقة الدفع",
      send: "إرسال",
      sent: "تم الإرسال ✅",
      failed: "فشل الإرسال ❌",
      auditChecklist: "قائمة تدقيق الجاهزية",
      pass: "ناجح",
      fail: "فاشل",
      warning: "تحذير",
      n_a: "غير مطبق",
      overall: "التقييم العام",
      loading: "جاري التحميل...",
      noData: "لا توجد بيانات",
      actions: "إجراءات سريعة",
      refresh: "تحديث",
      scanTitle: "فحص الامتثال الشامل",
      scanDesc: "تشغيل فحص شامل لجميع العقود للتحقق من الامتثال مع REGA وإيجار",
      runScan: "تشغيل الفحص",
      scanning: "جاري الفحص...",
      scanSuccess: "تم الفحص بنجاح",
      scanFailed: "فشل الفحص",
    },
    en: {
      title: "Regulatory Compliance Dashboard",
      subtitle: "Real-time compliance monitoring with REGA, Ejar, and NDMO",
      totalContracts: "Total Contracts",
      validContracts: "Compliant",
      warningContracts: "Warning",
      criticalContracts: "Critical",
      complianceRate: "Compliance Rate",
      ejarLinked: "Ejar Linked",
      monthlyRent: "Monthly Rent",
      recentLogs: "Compliance Events (7d)",
      falLicensesActive: "Active FAL Licenses",
      expiring60: "Expiring in 60 days",
      expiring30: "Expiring in 30 days",
      expiring7: "Expiring in 7 days",
      checkFalTitle: "FAL License Check",
      checkFalDesc: "Enter a 10-digit FAL license number to validate against REGA",
      falPlaceholder: "Enter FAL license number...",
      checkLicense: "Check",
      valid: "✔ Valid",
      invalid: "✘ Invalid",
      ejarMirrorTitle: "Mirror Payment to Ejar",
      ejarMirrorDesc: "Send rent payment confirmation to the Ejar network",
      contractId: "Contract ID",
      paymentMethod: "Payment Method",
      send: "Send",
      sent: "Sent ✅",
      failed: "Failed ❌",
      auditChecklist: "Audit Readiness Checklist",
      pass: "Pass",
      fail: "Fail",
      warning: "Warning",
      n_a: "N/A",
      overall: "Overall Rating",
      loading: "Loading...",
      noData: "No data available",
      actions: "Quick Actions",
      refresh: "Refresh",
      scanTitle: "Compliance Scan",
      scanDesc: "Run a full compliance scan on all active contracts against REGA & Ejar",
      runScan: "Run Scan",
      scanning: "Scanning...",
      scanSuccess: "Scan completed successfully",
      scanFailed: "Scan failed",
    },
  };

  const t = translations[language];

  const handleFalCheck = async () => {
    if (!falInput.trim()) return;
    try {
      const result = await checkFalLicense.mutateAsync(falInput.trim());
      setFalResult(result);
    } catch (err: any) {
      setFalResult({ isValid: false, message: err.message });
    }
  };

  const handleEjarMirror = async () => {
    if (!ejarContractId.trim()) return;
    try {
      const result = await ejarMirror.mutateAsync({
        contractId: Number(ejarContractId),
        paymentMethod: "SADAD",
      });
      setEjarResult(result);
    } catch (err: any) {
      setEjarResult({ success: false, message: err.message });
    }
  };

  const statCard = (label: string, value: string | number, color: string, icon: string) => (
    <div style={{
      background: "rgba(30, 41, 59, 0.4)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: "16px",
      padding: "16px",
      textAlign: isRtl ? "right" : "left",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <span style={{ color: "#94a3b8", fontSize: "12px" }}>{label}</span>
        <span style={{ fontSize: "18px" }}>{icon}</span>
      </div>
      <p style={{ fontSize: "28px", fontWeight: 800, color, margin: 0 }}>{value}</p>
    </div>
  );

  return (
    <div style={{ padding: "16px", maxWidth: "1200px", margin: "0 auto" }}>
      <Helmet>
        <title>{t.title} | SKNAI Admin</title>
      </Helmet>

      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ color: "#fff", fontSize: "24px", fontWeight: 800, margin: 0 }}>{t.title}</h1>
        <p style={{ color: "#94a3b8", fontSize: "14px", margin: "4px 0 0 0" }}>{t.subtitle}</p>
      </div>

      {/* Stats Cards */}
      {statsLoading ? (
        <p style={{ color: "#94a3b8" }}>{t.loading}</p>
      ) : !stats ? (
        <p style={{ color: "#94a3b8" }}>{t.noData}</p>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px", marginBottom: "24px" }}>
            {statCard(t.totalContracts, stats.totalContracts, "#fff", "📋")}
            {statCard(t.complianceRate, `${stats.complianceRate}%`, "#10b981", "✅")}
            {statCard(t.warningContracts, stats.warningContracts, "#f59e0b", "⚠️")}
            {statCard(t.criticalContracts, stats.criticalContracts, "#ef4444", "🚨")}
            {statCard(t.ejarLinked, stats.totalEjarLinked, "#3b82f6", "🔗")}
            {statCard(t.falLicensesActive, stats.activeFalLicenses, "#8b5cf6", "🪪")}
            {statCard(t.expiring60, stats.contractsExpiringIn60Days, "#f59e0b", "⏳")}
            {statCard(t.expiring7, stats.contractsExpiringIn7Days, "#ef4444", "🔴")}
          </div>

          {/* Quick Actions Section */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            {/* FAL License Check */}
            <div style={{
              background: "rgba(15, 23, 42, 0.45)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
              padding: "20px",
            }}>
              <h3 style={{ color: "#fff", fontSize: "14px", fontWeight: 700, margin: "0 0 8px 0" }}>{t.checkFalTitle}</h3>
              <p style={{ color: "#94a3b8", fontSize: "12px", margin: "0 0 12px 0" }}>{t.checkFalDesc}</p>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  value={falInput}
                  onChange={(e) => setFalInput(e.target.value)}
                  placeholder={t.falPlaceholder}
                  dir={isRtl ? "rtl" : "ltr"}
                  style={{
                    flex: 1,
                    background: "rgba(15, 23, 42, 0.6)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    padding: "10px 14px",
                    color: "#fff",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
                <button
                  onClick={handleFalCheck}
                  disabled={checkFalLicense.isPending}
                  style={{
                    padding: "10px 20px",
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    opacity: checkFalLicense.isPending ? 0.6 : 1,
                  }}
                >
                  {t.checkLicense}
                </button>
              </div>
              {falResult && (
                <div style={{
                  marginTop: "12px",
                  padding: "10px",
                  borderRadius: "10px",
                  background: falResult.isValid ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                  border: `1px solid ${falResult.isValid ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                  color: falResult.isValid ? "#10b981" : "#ef4444",
                  fontSize: "13px",
                  fontWeight: 600,
                }}>
                  {falResult.isValid ? t.valid : t.invalid}
                  {falResult.holderName && ` — ${falResult.holderName}`}
                  {falResult.message && ` — ${falResult.message}`}
                </div>
              )}
            </div>

            {/* Ejar Mirror */}
            <div style={{
              background: "rgba(15, 23, 42, 0.45)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
              padding: "20px",
            }}>
              <h3 style={{ color: "#fff", fontSize: "14px", fontWeight: 700, margin: "0 0 8px 0" }}>{t.ejarMirrorTitle}</h3>
              <p style={{ color: "#94a3b8", fontSize: "12px", margin: "0 0 12px 0" }}>{t.ejarMirrorDesc}</p>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="number"
                  value={ejarContractId}
                  onChange={(e) => setEjarContractId(e.target.value)}
                  placeholder={t.contractId}
                  style={{
                    flex: 1,
                    background: "rgba(15, 23, 42, 0.6)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    padding: "10px 14px",
                    color: "#fff",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
                <button
                  onClick={handleEjarMirror}
                  disabled={ejarMirror.isPending}
                  style={{
                    padding: "10px 20px",
                    background: "#10b981",
                    color: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    opacity: ejarMirror.isPending ? 0.6 : 1,
                  }}
                >
                  {t.send}
                </button>
              </div>
              {ejarResult && (
                <div style={{
                  marginTop: "12px",
                  padding: "10px",
                  borderRadius: "10px",
                  background: ejarResult.success ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                  border: `1px solid ${ejarResult.success ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                  color: ejarResult.success ? "#10b981" : "#ef4444",
                  fontSize: "13px",
                  fontWeight: 600,
                }}>
                  {ejarResult.success ? t.sent : t.failed}
                  {ejarResult.ejarReference && ` — Ref: ${ejarResult.ejarReference}`}
                  {ejarResult.message && ` — ${ejarResult.message}`}
                </div>
              )}
            </div>

            {/* Compliance Scan Trigger */}
            <div style={{
              background: "rgba(15, 23, 42, 0.45)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
              padding: "20px",
            }}>
              <h3 style={{ color: "#fff", fontSize: "14px", fontWeight: 700, margin: "0 0 8px 0" }}>{t.scanTitle}</h3>
              <p style={{ color: "#94a3b8", fontSize: "12px", margin: "0 0 12px 0" }}>{t.scanDesc}</p>
              <button
                onClick={triggerComplianceScan}
                disabled={scanning}
                style={{
                  padding: "10px 20px",
                  background: scanning ? "rgba(99,102,241,0.5)" : "#6366f1",
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: scanning ? "not-allowed" : "pointer",
                  width: "100%",
                }}
              >
                {scanning ? t.scanning : t.runScan}
              </button>
              {scanResult && (
                <div style={{
                  marginTop: "12px",
                  padding: "10px",
                  borderRadius: "10px",
                  background: scanResult.success ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                  border: `1px solid ${scanResult.success ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                  color: scanResult.success ? "#10b981" : "#ef4444",
                  fontSize: "13px",
                  fontWeight: 600,
                }}>
                  {scanResult.success ? t.scanSuccess : t.scanFailed}
                  {scanResult.results && ` — Overdue: ${scanResult.results.overdue}, Reminders: ${scanResult.results.reminders}, Expiring: ${scanResult.results.expiring}, Notices: ${scanResult.results.complianceNotices}, SMS: ${scanResult.results.smsSent}`}
                  {scanResult.error && ` — ${scanResult.error}`}
                </div>
              )}
            </div>
          </div>

          {/* Audit Checklist */}
          <div style={{
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "24px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ color: "#fff", fontSize: "16px", fontWeight: 700, margin: 0 }}>{t.auditChecklist}</h3>
              {checklist && (
                <span style={{
                  padding: "4px 12px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 700,
                  background: checklist.overall === "pass" ? "rgba(16,185,129,0.2)" :
                    checklist.overall === "warning" ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)",
                  color: checklist.overall === "pass" ? "#10b981" :
                    checklist.overall === "warning" ? "#f59e0b" : "#ef4444",
                  border: `1px solid ${checklist.overall === "pass" ? "rgba(16,185,129,0.3)" :
                    checklist.overall === "warning" ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.3)"}`,
                }}>
                  {t.overall}: {checklist.overall === "pass" ? t.pass : checklist.overall === "warning" ? t.warning : t.fail}
                </span>
              )}
            </div>

            {checklistLoading ? (
              <p style={{ color: "#94a3b8" }}>{t.loading}</p>
            ) : !checklist ? (
              <p style={{ color: "#94a3b8" }}>{t.noData}</p>
            ) : (
              <div style={{ display: "grid", gap: "8px" }}>
                {checklist.items.map((item) => {
                  const statusColors: Record<string, { bg: string; border: string; color: string; label: string }> = {
                    pass: { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)", color: "#10b981", label: t.pass },
                    fail: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)", color: "#ef4444", label: t.fail },
                    warning: { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)", color: "#f59e0b", label: t.warning },
                    not_applicable: { bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)", color: "#94a3b8", label: t.n_a },
                  };
                  const sc = statusColors[item.status] || statusColors.warning;

                  return (
                    <div key={item.id} style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      background: sc.bg,
                      border: `1px solid ${sc.border}`,
                      borderRadius: "12px",
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "#fff", fontSize: "13px", fontWeight: 600 }}>
                          {isRtl ? item.titleAr : item.titleEn}
                        </div>
                        <div style={{ color: "#94a3b8", fontSize: "11px", marginTop: "2px" }}>
                          {isRtl ? item.descriptionAr : item.descriptionEn}
                        </div>
                        {item.details && (
                          <div style={{ color: "#64748b", fontSize: "10px", marginTop: "4px" }}>
                            {item.details}
                          </div>
                        )}
                      </div>
                      <span style={{
                        padding: "4px 10px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: 700,
                        background: sc.bg,
                        color: sc.color,
                        border: `1px solid ${sc.border}`,
                        whiteSpace: "nowrap",
                        marginLeft: "8px",
                      }}>
                        {sc.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
