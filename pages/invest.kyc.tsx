import React from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { KYCForm } from "../components/KYCForm";
import { useLanguage } from "../helpers/useLanguage";
import { tokenizationTranslations } from "../helpers/tokenizationTranslations";
import styles from "./invest.kyc.module.css";

export default function KYCPage() {
  const { language } = useLanguage();
  const t = tokenizationTranslations[language].kyc;
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <Helmet>
        <title>{t.title} | SKNAI</title>
      </Helmet>

      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <ShieldCheck size={32} />
          </div>
          <h1 className={styles.title}>{t.title}</h1>
          <p className={styles.subtitle}>{t.subtitle}</p>
        </div>

        <KYCForm 
          className={styles.form} 
          onComplete={() => {
            // Optional: redirect after success
            // navigate("/invest/wallet");
          }}
        />
      </div>
    </div>
  );
}