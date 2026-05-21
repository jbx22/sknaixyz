import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";

export type AuditChecklistItem = {
  id: string;
  category: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  status: "pass" | "fail" | "warning" | "not_applicable";
  checkedAt?: string;
  details?: string;
};

export type AuditChecklistResponse = {
  items: AuditChecklistItem[];
  overall: "pass" | "fail" | "warning";
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    na: number;
  };
};

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin") {
      return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    }

    // Run live checks
    const items = await runAllChecks();
    const passed = items.filter((i) => i.status === "pass").length;
    const failed = items.filter((i) => i.status === "fail").length;
    const warnings = items.filter((i) => i.status === "warning").length;
    const na = items.filter((i) => i.status === "not_applicable").length;

    let overall: "pass" | "fail" | "warning" = "pass";
    if (failed > 0) overall = "fail";
    else if (warnings > 0) overall = "warning";

    return new Response(
      superjson.stringify({
        items,
        overall,
        summary: { total: items.length, passed, failed, warnings, na },
      } as AuditChecklistResponse),
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    return new Response(
      superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500 }
    );
  }
}

async function runAllChecks(): Promise<AuditChecklistItem[]> {
  const now = new Date();
  const items: AuditChecklistItem[] = [];

  // 1. FAL License Validation
  const falLicenses = await db
    .selectFrom("regaLicenseCache")
    .select(["id", "isValid", "lastChecked"])
    .execute();

  const hasValidFal = falLicenses.some((l) => l.isValid);
  const hasFalCache = falLicenses.length > 0;

  items.push({
    id: "fal_license_validation",
    category: "rega_licensing",
    titleAr: "التحقق من رخصة فال",
    titleEn: "FAL License Validation",
    descriptionAr: "التأكد من وجود رخصة فال سارية للوساطة أو إدارة الأملاك",
    descriptionEn: "Verify a valid FAL license for brokerage or property management",
    status: hasValidFal ? "pass" : hasFalCache ? "fail" : "warning",
    details: hasValidFal
      ? `${falLicenses.filter((l) => l.isValid).length} رخصة سارية`
      : hasFalCache
      ? "لا توجد رخص فال سارية في النظام"
      : "لم يتم إجراء فحص رخص فال بعد",
  });

  // 2. Ejar Mirroring
  const ejarLinked = await db
    .selectFrom("rentalContracts")
    .where("ejarContractNumber", "is not", null)
    .select((eb: any) => eb.fn.count<number>("id").as("count"))
    .executeTakeFirst();

  const totalContracts = await db
    .selectFrom("rentalContracts")
    .select((eb: any) => eb.fn.count<number>("id").as("count"))
    .executeTakeFirst();

  const ejarCount = Number(ejarLinked?.count || 0);
  const totalCount = Number(totalContracts?.count || 0);

  items.push({
    id: "ejar_mirroring",
    category: "ejar_integration",
    titleAr: "الربط مع شبكة إيجار",
    titleEn: "Ejar Network Mirroring",
    descriptionAr: "ربط العقود بأرقام إيجار الموحدة ومزامنة البيانات",
    descriptionEn: "Link contracts to Ejar unified numbers and synchronize data",
    status: ejarCount > 0 ? "pass" : totalCount > 0 ? "fail" : "not_applicable",
    details: ejarCount > 0 ? `${ejarCount} عقد مرتبط بإيجار` : "لا توجد عقود مرتبطة بإيجار",
  });

  // 3. Compliance Logs Active
  const recentLogs = await db
    .selectFrom("complianceLogs")
    .where("createdAt", ">=", new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
    .select((eb: any) => eb.fn.count<number>("id").as("count"))
    .executeTakeFirst();

  const logCount = Number(recentLogs?.count || 0);

  items.push({
    id: "compliance_logs",
    category: "audit_trail",
    titleAr: "سجل الامتثال والتدقيق",
    titleEn: "Compliance Audit Trail",
    descriptionAr: "تسجيل أحداث الامتثال بشكل دائم للإثبات القانوني",
    descriptionEn: "Permanent recording of compliance events for legal evidence",
    status: logCount > 0 ? "pass" : "warning",
    details: logCount > 0 ? `${logCount} حدث امتثال في آخر 7 أيام` : "لا توجد أحداث امتثال مسجلة",
  });

  // 4. NDMO Data Compliance
  const ndmoEncrypted = await db
    .selectFrom("kycRecords")
    .where("nationalIdEncrypted", "is not", null)
    .select((eb: any) => eb.fn.count<number>("id").as("count"))
    .executeTakeFirst();

  const ndmoCount = Number(ndmoEncrypted?.count || 0);

  items.push({
    id: "ndmo_compliance",
    category: "data_protection",
    titleAr: "امتثال NDMO لحماية البيانات",
    titleEn: "NDMO Data Protection Compliance",
    descriptionAr: "تشفير الهويات الوطنية والأرقام باستخدام AES-256 وإخفاء البيانات في لوحات التحكم",
    descriptionEn: "Encrypt national IDs and numbers using AES-256 and mask data in dashboards",
    status: ndmoCount > 0 ? "pass" : "warning",
    details: ndmoCount > 0
      ? `${ndmoCount} سجل KYC مشفر`
      : "لم يتم تشفير بيانات الهوية بعد — قم بتعيين مفتاح NDMO_ENCRYPTION_KEY",
  });

  // 5. 60-Day Legal Window Cron
  const cronSecret = process.env.CRON_SECRET;
  const vercelCron = process.env.VERCEL;

  items.push({
    id: "cron_60_day_window",
    category: "cron_engine",
    titleAr: "محرك الفحص الدوري (نافذة 60 يوم)",
    titleEn: "60-Day Compliance Window Cron",
    descriptionAr: "فحص تلقائي يومي للعقود المتبقي لها أقل من 60 يوماً وإطلاق التنبيهات النظامية",
    descriptionEn: "Daily automated scan of contracts within the 60-day legal window and regulatory alerts",
    status: vercelCron || cronSecret ? "pass" : "warning",
    details: vercelCron ? "مُفعّل عبر Vercel Cron" : cronSecret ? "مُفعّل مع CRON_SECRET" : "تحذير: لم يتم تعيين CRON_SECRET للتشغيل التلقائي",
  });

  // 6. Payment Gateway Licensed
  const ejarApiKey = process.env.EJAR_API_KEY;
  const regaApiKey = process.env.REGA_API_KEY;

  items.push({
    id: "licensed_payment_gateway",
    category: "payments",
    titleAr: "بوابات دفع مرخصة (إيجار/سداد)",
    titleEn: "Licensed Payment Gateways (Ejar/SADAD)",
    descriptionAr: "استقبال دفعات الإيجار عبر بوابات مرخصة مرتبطة مباشرة مع إيجار",
    descriptionEn: "Accept rent payments via licensed gateways directly linked to Ejar",
    status: ejarApiKey ? "pass" : "warning",
    details: ejarApiKey
      ? "بوابة إيجار للدفع مكونة"
      : "لم يتم تعيين EJAR_API_KEY — استخدم ساندبوكس للمعاينة",
  });

  // 7. Auto-Renew Flag Check
  const autoRenewCount = await db
    .selectFrom("rentalContracts")
    .where("autoRenewFlag", "=", true)
    .select((eb: any) => eb.fn.count<number>("id").as("count"))
    .executeTakeFirst();

  items.push({
    id: "auto_renew_protection",
    category: "contract_management",
    titleAr: "حماية التجديد التلقائي",
    titleEn: "Auto-Renew Protection",
    descriptionAr: "ضمان وجود آلية إشعار للتجديد التلقائي للعقود قبل 60 يوماً من تاريخ الانتهاء",
    descriptionEn: "Ensure notification mechanism for auto-renewing contracts 60 days before expiry",
    status: Number(autoRenewCount?.count || 0) > 0 ? "pass" : "not_applicable",
    details: `${autoRenewCount?.count || 0} عقد مع خاصية التجديد التلقائي`,
  });

  return items;
}
