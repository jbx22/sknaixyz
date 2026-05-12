import React from "react";
import { Helmet } from "react-helmet";
import { useLanguage } from "../helpers/useLanguage";
import styles from "./privacy.module.css";

export default function PrivacyPage() {
  const { language } = useLanguage();

  const content = {
    en: {
      title: "Privacy Policy",
      lastUpdated: "Last Updated: October 26, 2023",
      intro: "At SKNAI, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our real estate services.",
      sections: [
        {
          title: "1. Information We Collect",
          text: "We collect information that you provide directly to us when you register for an account, create a property listing, or communicate with us. This includes:\n\n• Personal identification information (Name, email address, phone number)\n• Property details and location data\n• Payment information for subscription services\n• Communications and correspondence"
        },
        {
          title: "2. How We Use Your Information",
          text: "We use the information we collect to:\n\n• Provide, maintain, and improve our services\n• Process transactions and send related information\n• Send you technical notices, updates, security alerts, and support messages\n• Respond to your comments, questions, and requests\n• Monitor and analyze trends, usage, and activities in connection with our services"
        },
        {
          title: "3. Data Storage and Security",
          text: "We implement appropriate technical and organizational measures to protect your personal data against unauthorized or unlawful processing, accidental loss, destruction, or damage. Your data is stored on secure servers and we use encryption for sensitive information."
        },
        {
          title: "4. Your Rights (GDPR & Local Regulations)",
          text: "Under applicable data protection laws, you have the right to:\n\n• Access your personal data\n• Correct inaccurate personal data\n• Request deletion of your personal data\n• Object to processing of your personal data\n• Request data portability\n\nYou can exercise these rights through your account settings or by contacting us."
        },
        {
          title: "5. Cookies and Tracking",
          text: "We use cookies and similar tracking technologies to track the activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent."
        },
        {
          title: "6. Third-Party Services",
          text: "We may employ third-party companies and individuals to facilitate our service, to provide the service on our behalf, to perform service-related services, or to assist us in analyzing how our service is used. These third parties have access to your personal data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose."
        },
        {
          title: "7. Contact Us",
          text: "If you have any questions about this Privacy Policy, please contact us at:\n\nEmail: privacy@sknai\nAddress: Riyadh, Saudi Arabia"
        }
      ]
    },
    ar: {
      title: "سياسة الخصوصية",
      lastUpdated: "آخر تحديث: ٢٦ أكتوبر ٢٠٢٣",
      intro: "في سكني.xyz، نأخذ خصوصيتك على محمل الجد. تشرح سياسة الخصوصية هذه كيفية جمعنا واستخدامنا وكشفنا وحمايتنا لمعلوماتك عند زيارة موقعنا واستخدام خدماتنا العقارية.",
      sections: [
        {
          title: "١. المعلومات التي نجمعها",
          text: "نجمع المعلومات التي تقدمها لنا مباشرة عند التسجيل للحصول على حساب، أو إنشاء قائمة عقارية، أو التواصل معنا. ويشمل ذلك:\n\n• معلومات الهوية الشخصية (الاسم، البريد الإلكتروني، رقم الهاتف)\n• تفاصيل العقار وبيانات الموقع\n• معلومات الدفع لخدمات الاشتراك\n• المراسلات والتواصل"
        },
        {
          title: "٢. كيف نستخدم معلوماتك",
          text: "نستخدم المعلومات التي نجمعها من أجل:\n\n• تقديم خدماتنا وصيانتها وتحسينها\n• معالجة المعاملات وإرسال المعلومات ذات الصلة\n• إرسال الإشعارات الفنية والتحديثات وتنبيهات الأمان ورسائل الدعم\n• الرد على تعليقاتكم وأسئلتكم وطلباتكم\n• مراقبة وتحليل الاتجاهات والاستخدام والأنشطة المتعلقة بخدماتنا"
        },
        {
          title: "٣. تخزين البيانات وأمنها",
          text: "نطبق تدابير فنية وتنظيمية مناسبة لحماية بياناتك الشخصية من المعالجة غير المصرح بها أو غير القانونية، والفقدان العرضي، أو التدمير، أو التلف. يتم تخزين بياناتك على خوادم آمنة ونستخدم التشفير للمعلومات الحساسة."
        },
        {
          title: "٤. حقوقك (اللائحة العامة لحماية البيانات واللوائح المحلية)",
          text: "بموجب قوانين حماية البيانات المعمول بها، لديك الحق في:\n\n• الوصول إلى بياناتك الشخصية\n• تصحيح البيانات الشخصية غير الدقيقة\n• طلب حذف بياناتك الشخصية\n• الاعتراض على معالجة بياناتك الشخصية\n• طلب نقل البيانات\n\nيمكنك ممارسة هذه الحقوق من خلال إعدادات حسابك أو عن طريق الاتصال بنا."
        },
        {
          title: "٥. ملفات تعريف الارتباط والتتبع",
          text: "نستخدم ملفات تعريف الارتباط وتقنيات التتبع المماثلة لتتبع النشاط على خدمتنا والاحتفاظ بمعلومات معينة. يمكنك توجيه متصفحك لرفض جميع ملفات تعريف الارتباط أو للإشارة إلى وقت إرسال ملف تعريف الارتباط."
        },
        {
          title: "٦. خدمات الطرف الثالث",
          text: "قد نوظف شركات وأفراداً من أطراف ثالثة لتسهيل خدمتنا، أو لتقديم الخدمة نيابة عنا، أو لأداء خدمات متعلقة بالخدمة، أو لمساعدتنا في تحليل كيفية استخدام خدمتنا. لا يحق لهذه الأطراف الثالثة الوصول إلى بياناتك الشخصية إلا لأداء هذه المهام نيابة عنا وهي ملزمة بعدم الكشف عنها أو استخدامها لأي غرض آخر."
        },
        {
          title: "٧. اتصل بنا",
          text: "إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه، يرجى الاتصال بنا على:\n\nالبريد الإلكتروني: privacy@sknai\nالعنوان: الرياض، المملكة العربية السعودية"
        }
      ]
    }
  };

  const t = content[language];

  return (
    <div className={styles.container}>
      <Helmet>
        <title>{t.title} | SKNAI</title>
        <meta name="description" content={t.intro} />
      </Helmet>

      <div className={styles.content}>
        <h1 className={styles.title}>{t.title}</h1>
        <p className={styles.lastUpdated}>{t.lastUpdated}</p>
        
        <div className={styles.intro}>
          <p>{t.intro}</p>
        </div>

        <div className={styles.sections}>
          {t.sections.map((section, index) => (
            <section key={index} className={styles.section}>
              <h2 className={styles.sectionTitle}>{section.title}</h2>
              <div className={styles.sectionText}>
                {section.text.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}