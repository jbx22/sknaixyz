import React from "react";
import { Helmet } from "react-helmet";
import { useLanguage } from "../helpers/useLanguage";
import styles from "./terms.module.css";

export default function TermsPage() {
  const { language } = useLanguage();

  const content = {
    en: {
      title: "Terms of Service",
      lastUpdated: "Last Updated: October 26, 2023",
      intro: "Welcome to SKNAI. By accessing or using our website and services, you agree to be bound by these Terms of Service and all applicable laws and regulations in the Kingdom of Saudi Arabia.",
      sections: [
        {
          title: "1. Acceptance of Terms",
          text: "By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service."
        },
        {
          title: "2. User Responsibilities",
          text: "You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account or password. You must provide accurate and complete information when creating an account."
        },
        {
          title: "3. Property Listings",
          text: "Users who post property listings must ensure that:\n\n• They have the legal right to list the property\n• All information provided is accurate and truthful\n• The listing complies with Saudi Real Estate General Authority regulations\n• Photos and descriptions do not violate any third-party rights"
        },
        {
          title: "4. Prohibited Activities",
          text: "You may not use the Service for any illegal or unauthorized purpose. You agree not to:\n\n• Violate any laws in your jurisdiction\n• Post false or misleading information\n• Harass, abuse, or harm another person\n• Attempt to gain unauthorized access to the Service\n• Use the Service to distribute spam or malicious content"
        },
        {
          title: "5. Intellectual Property",
          text: "The Service and its original content, features, and functionality are and will remain the exclusive property of SKNAI and its licensors. The Service is protected by copyright, trademark, and other laws of both Saudi Arabia and foreign countries."
        },
        {
          title: "6. Limitation of Liability",
          text: "In no event shall SKNAI, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses."
        },
        {
          title: "7. Termination",
          text: "We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms."
        },
        {
          title: "8. Governing Law",
          text: "These Terms shall be governed and construed in accordance with the laws of the Kingdom of Saudi Arabia, without regard to its conflict of law provisions."
        }
      ]
    },
    ar: {
      title: "شروط الخدمة",
      lastUpdated: "آخر تحديث: ٢٦ أكتوبر ٢٠٢٣",
      intro: "مرحبًا بكم في سكني.xyz. من خلال الوصول إلى موقعنا وخدماتنا أو استخدامها، فإنك توافق على الالتزام بشروط الخدمة هذه وجميع القوانين واللوائح المعمول بها في المملكة العربية السعودية.",
      sections: [
        {
          title: "١. قبول الشروط",
          text: "من خلال الوصول إلى الخدمة أو استخدامها، فإنك توافق على الالتزام بهذه الشروط. إذا كنت لا توافق على أي جزء من الشروط، فلا يجوز لك الوصول إلى الخدمة."
        },
        {
          title: "٢. مسؤوليات المستخدم",
          text: "أنت مسؤول عن الحفاظ على سرية حسابك وكلمة المرور الخاصة بك. أنت توافق على قبول المسؤولية عن جميع الأنشطة التي تحدث تحت حسابك أو كلمة المرور الخاصة بك. يجب عليك تقديم معلومات دقيقة وكاملة عند إنشاء حساب."
        },
        {
          title: "٣. قوائم العقارات",
          text: "يجب على المستخدمين الذين ينشرون قوائم العقارات التأكد من أن:\n\n• لديهم الحق القانوني في إدراج العقار\n• جميع المعلومات المقدمة دقيقة وصادقة\n• القائمة تتوافق مع لوائح الهيئة العامة للعقار السعودية\n• الصور والأوصاف لا تنتهك أي حقوق لطرف ثالث"
        },
        {
          title: "٤. الأنشطة المحظورة",
          text: "لا يجوز لك استخدام الخدمة لأي غرض غير قانوني أو غير مصرح به. أنت توافق على عدم:\n\n• انتهاك أي قوانين في ولايتك القضائية\n• نشر معلومات كاذبة أو مضللة\n• مضايقة أو إساءة أو إيذاء شخص آخر\n• محاولة الوصول غير المصرح به إلى الخدمة\n• استخدام الخدمة لتوزيع البريد العشوائي أو المحتوى الضار"
        },
        {
          title: "٥. الملكية الفكرية",
          text: "الخدمة ومحتواها الأصلي وميزاتها ووظائفها هي وستظل الملكية الحصرية لـ سكني.xyz ومرخصيها. الخدمة محمية بموجب حقوق النشر والعلامات التجارية والقوانين الأخرى لكل من المملكة العربية السعودية والدول الأجنبية."
        },
        {
          title: "٦. حدود المسؤولية",
          text: "لا تتحمل سكني.xyz، ولا مديروها أو موظفوها أو شركاؤها أو وكلاؤها أو موردوها أو الشركات التابعة لها، بأي حال من الأحوال المسؤولية عن أي أضرار غير مباشرة أو عرضية أو خاصة أو تبعية أو عقابية، بما في ذلك على سبيل المثال لا الحصر، خسارة الأرباح أو البيانات أو الاستخدام أو الشهرة أو الخسائر غير الملموسة الأخرى."
        },
        {
          title: "٧. الإنهاء",
          text: "يجوز لنا إنهاء أو تعليق حسابك فورًا، دون إشعار مسبق أو مسؤولية، لأي سبب كان، بما في ذلك على سبيل المثال لا الحصر إذا انتهكت الشروط."
        },
        {
          title: "٨. القانون الحاكم",
          text: "تخضع هذه الشروط وتفسر وفقًا لقوانين المملكة العربية السعودية، بغض النظر عن تعارضها مع أحكام القانون."
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