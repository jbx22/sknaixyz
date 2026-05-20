import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { LandingNavigation } from "../components/LandingNavigation";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { ArrowRight, ArrowLeft, Mail, Phone, MapPin, Send, CheckCircle, Loader2 } from "lucide-react";
import { useLanguage } from "../helpers/useLanguage";
import styles from "./contact.module.css";

const CONTACT_EMAIL = "contact@sknai.xyz";

export default function ContactPage() {
  const { language, direction } = useLanguage();
  const [formState, setFormState] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const t = {
    ar: {
      title: "اتصل بنا - SKNAI",
      metaDescription: "تواصل مع فريق SKNAI - منصة العقارات الذكية في السعودية",
      heroTitle: "اتصل بنا",
      heroSubtitle: "نحن هنا للإجابة على أسئلتك",
      emailTitle: "البريد الإلكتروني",
      emailDesc: "تواصل معنا عبر البريد الإلكتروني للاستفسارات والدعم الفني",
      phoneTitle: "رقم الهاتف",
      phoneDesc: "اتصل بنا مباشرة لأي استفسارات عاجلة",
      locationTitle: "الموقع",
      locationDesc: "زر مكتبنا في الرياض خلال ساعات العمل",
      locationValue: "الرياض، المملكة العربية السعودية",
      formTitle: "أرسل لنا رسالة",
      formName: "الاسم الكامل",
      formEmail: "بريدك الإلكتروني",
      formSubject: "الموضوع",
      formMessage: "الرسالة",
      formSend: "إرسال الرسالة",
      formSuccess: "تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.",
      formSending: "جاري الإرسال...",
      backToHome: "العودة للرئيسية",
      formPlaceholderName: "أدخل اسمك الكامل",
      formPlaceholderEmail: "أدخل بريدك الإلكتروني",
      formPlaceholderSubject: "ما هو موضوع رسالتك؟",
      formPlaceholderMessage: "اكتب رسالتك هنا...",
      orSendDirect: "أو أرسل مباشرة",
      sendAnother: "إرسال رسالة أخرى",
    },
    en: {
      title: "Contact Us - SKNAI",
      metaDescription: "Contact SKNAI team - The smart real estate platform in Saudi Arabia",
      heroTitle: "Contact Us",
      heroSubtitle: "We are here to answer your questions",
      emailTitle: "Email",
      emailDesc: "Contact us via email for inquiries and technical support",
      phoneTitle: "Phone Number",
      phoneDesc: "Call us directly for urgent inquiries",
      locationTitle: "Location",
      locationDesc: "Visit our office in Riyadh during working hours",
      locationValue: "Riyadh, Saudi Arabia",
      formTitle: "Send Us a Message",
      formName: "Full Name",
      formEmail: "Your Email",
      formSubject: "Subject",
      formMessage: "Message",
      formSend: "Send Message",
      formSuccess: "Your message was sent successfully! We'll get back to you soon.",
      formSending: "Sending...",
      backToHome: "Back to Home",
      formPlaceholderName: "Enter your full name",
      formPlaceholderEmail: "Enter your email address",
      formPlaceholderSubject: "What is your message about?",
      formPlaceholderMessage: "Write your message here...",
      orSendDirect: "Or send directly",
      sendAnother: "Send Another Message",
    }
  };

  const content = t[language];
  const ArrowIcon = direction === "rtl" ? ArrowRight : ArrowLeft;

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Build mailto link with form data
    const mailtoLink = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(formState.subject || (language === "ar" ? "رسالة من SKNAI.xyz" : "Message from SKNAI.xyz"))}&body=${encodeURIComponent(
      (language === "ar"
        ? `الاسم: ${formState.name}\nالبريد الإلكتروني: ${formState.email}\n\nالرسالة:\n${formState.message}`
        : `Name: ${formState.name}\nEmail: ${formState.email}\n\nMessage:\n${formState.message}`)
    )}`;
    // Open mailto link
    window.location.href = mailtoLink;
    // Simulate brief delay for UX
    await new Promise(r => setTimeout(r, 800));
    setSending(false);
    setSubmitted(true);
  };

  const handleReset = () => {
    setFormState({ name: "", email: "", subject: "", message: "" });
    setSubmitted(false);
  };

  return (
    <>
      <Helmet>
        <title>{content.title}</title>
        <meta name="description" content={content.metaDescription} />
      </Helmet>

      <LandingNavigation />

      <div className={styles.container}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>{content.heroTitle}</h1>
            <p className={styles.subtitle}>{content.heroSubtitle}</p>
          </div>
        </section>

        <section className={styles.content}>
          <div className={styles.contentWrapper}>
            <div className={styles.infoGrid}>
              <div className={styles.infoCard}>
                <div className={styles.iconWrapper}>
                  <Mail size={24} />
                </div>
                <h3 className={styles.cardTitle}>{content.emailTitle}</h3>
                <p className={styles.cardDescription}>{content.emailDesc}</p>
                <p className={styles.cardValue}>{CONTACT_EMAIL}</p>
              </div>

              <div className={styles.infoCard}>
                <div className={styles.iconWrapper}>
                  <Phone size={24} />
                </div>
                <h3 className={styles.cardTitle}>{content.phoneTitle}</h3>
                <p className={styles.cardDescription}>{content.phoneDesc}</p>
                <p className={styles.cardValue} dir="ltr">+966 50 000 0000</p>
              </div>

              <div className={styles.infoCard}>
                <div className={styles.iconWrapper}>
                  <MapPin size={24} />
                </div>
                <h3 className={styles.cardTitle}>{content.locationTitle}</h3>
                <p className={styles.cardDescription}>{content.locationDesc}</p>
                <p className={styles.cardValue}>{content.locationValue}</p>
              </div>
            </div>

            {/* Contact Form */}
            <div className={styles.formSection}>
              <h2 className={styles.formTitle}>{content.formTitle}</h2>
              
              {submitted ? (
                <div className={styles.formSuccess}>
                  <CheckCircle size={48} className={styles.successIcon} />
                  <p className={styles.successText}>{content.formSuccess}</p>
                  <p className={styles.orSendDirect}>
                    {content.orSendDirect}{" "}
                    <a href={`mailto:${CONTACT_EMAIL}`} className={styles.directEmail}>{CONTACT_EMAIL}</a>
                  </p>
                  <Button variant="outline" onClick={handleReset} className={styles.sendAnotherBtn}>
                    {content.sendAnother}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className={styles.form}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>{content.formName}</label>
                      <Input
                        className={styles.formInput}
                        placeholder={content.formPlaceholderName}
                        value={formState.name}
                        onChange={handleChange("name")}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>{content.formEmail}</label>
                      <Input
                        className={styles.formInput}
                        type="email"
                        placeholder={content.formPlaceholderEmail}
                        value={formState.email}
                        onChange={handleChange("email")}
                        required
                      />
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{content.formSubject}</label>
                    <Input
                      className={styles.formInput}
                      placeholder={content.formPlaceholderSubject}
                      value={formState.subject}
                      onChange={handleChange("subject")}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{content.formMessage}</label>
                    <textarea
                      className={styles.formTextarea}
                      placeholder={content.formPlaceholderMessage}
                      value={formState.message}
                      onChange={handleChange("message")}
                      required
                      rows={6}
                    />
                  </div>
                  <Button type="submit" variant="accent" size="lg" className={styles.submitBtn} disabled={sending}>
                    {sending ? (
                      <><Loader2 size={18} className={styles.spinner} /> {content.formSending}</>
                    ) : (
                      <><Send size={18} /> {content.formSend}</>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </section>

        <section className={styles.cta}>
          <Button asChild variant="primary" size="lg">
            <Link to="/">
              {content.backToHome}
              <ArrowIcon size={18} />
            </Link>
          </Button>
        </section>
      </div>
    </>
  );
}