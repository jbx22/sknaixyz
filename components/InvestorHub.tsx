import React from "react";
import { Link } from "react-router-dom";
import { Wallet, ShieldCheck, Coins, TrendingUp, ChevronRight } from "lucide-react";
import { useWallet, useKYCStatus } from "../helpers/useTokenization";
import { useLanguage } from "../helpers/useLanguage";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Skeleton } from "./Skeleton";
import styles from "./InvestorHub.module.css";

export const InvestorHub: React.FC = () => {
  const { language } = useLanguage();
  const { data: walletData, isLoading: isWalletLoading } = useWallet();
  const { data: kycData, isLoading: isKycLoading } = useKYCStatus();

  const t = {
    title: language === "ar" ? "مركز المستثمر" : "Investor Hub",
    wallet: {
      title: language === "ar" ? "المحفظة" : "Wallet Balance",
      view: language === "ar" ? "عرض المحفظة" : "View Wallet",
      loading: language === "ar" ? "جار التحميل..." : "Loading...",
    },
    kyc: {
      title: language === "ar" ? "حالة التحقق" : "KYC Status",
      verify: language === "ar" ? "تحقق الآن" : "Complete KYC",
      verified: language === "ar" ? "تم التحقق" : "Verified",
      pending: language === "ar" ? "قيد المراجعة" : "Pending",
      rejected: language === "ar" ? "مرفوض" : "Rejected",
      notStarted: language === "ar" ? "غير مفعل" : "Not Started",
    },
    offerings: {
      title: language === "ar" ? "تصفح الفرص" : "Browse Offerings",
      subtitle: language === "ar" ? "استثمر في عقارات مميزة" : "Invest in premium properties",
      cta: language === "ar" ? "تصفح" : "Browse",
    },
    secondary: {
      title: language === "ar" ? "السوق الثانوي" : "Secondary Market",
      subtitle: language === "ar" ? "تداول حصص العقارات" : "Trade property tokens",
      cta: language === "ar" ? "الذهاب للسوق" : "Go to Market",
    },
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(language === "ar" ? "ar-SA" : "en-US", {
      style: "currency",
      currency: "SAR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getKycBadge = () => {
    if (isKycLoading) return <Skeleton className={styles.badgeSkeleton} />;
    
    const status = kycData?.kyc?.status;

    if (!status) {
      return (
        <Badge variant="outline" className={styles.statusBadge}>
          {t.kyc.notStarted}
        </Badge>
      );
    }

    switch (status) {
      case "approved":
        return <Badge variant="success">{t.kyc.verified}</Badge>;
      case "pending":
        return <Badge variant="warning">{t.kyc.pending}</Badge>;
      case "rejected":
        return <Badge variant="destructive">{t.kyc.rejected}</Badge>;
      case "expired":
        return <Badge variant="destructive">{t.kyc.rejected}</Badge>; // Treat expired as rejected/red for simplicity or add specific
      default:
        return <Badge variant="outline">{t.kyc.notStarted}</Badge>;
    }
  };

  const isKycVerified = kycData?.kyc?.status === "approved";

  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>{t.title}</h2>
      
      <div className={styles.grid}>
        {/* Wallet Card */}
        <div className={`${styles.card} ${styles.walletCard}`}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapperWhite}>
              <Wallet size={20} className={styles.iconPrimary} />
            </div>
            <h3 className={styles.cardTitleWhite}>{t.wallet.title}</h3>
          </div>
          <div className={styles.cardBody}>
            {isWalletLoading ? (
              <Skeleton className={styles.balanceSkeleton} />
            ) : (
              <div className={styles.balance}>
                {formatCurrency(Number(walletData?.wallet?.balanceSar || 0))}
              </div>
            )}
          </div>
          <Link to="/invest/wallet" className={styles.cardLinkWhite}>
            {t.wallet.view} <ChevronRight size={16} />
          </Link>
        </div>

        {/* KYC Status Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={`${styles.iconWrapper} ${styles.iconBlue}`}>
              <ShieldCheck size={20} />
            </div>
            <h3 className={styles.cardTitle}>{t.kyc.title}</h3>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.kycStatus}>
              {getKycBadge()}
            </div>
          </div>
          {isKycVerified ? (
             <div className={styles.verifiedText}>
               {language === "ar" ? "حسابك جاهز للاستثمار" : "Account ready to invest"}
             </div>
          ) : (
            <Link to="/invest/kyc" className={styles.cardLink}>
              {t.kyc.verify} <ChevronRight size={16} />
            </Link>
          )}
        </div>

        {/* Browse Offerings Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={`${styles.iconWrapper} ${styles.iconGreen}`}>
              <Coins size={20} />
            </div>
            <h3 className={styles.cardTitle}>{t.offerings.title}</h3>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.cardSubtitle}>{t.offerings.subtitle}</p>
          </div>
          <Link to="/invest" className={styles.cardLink}>
            {t.offerings.cta} <ChevronRight size={16} />
          </Link>
        </div>

        {/* Secondary Market Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={`${styles.iconWrapper} ${styles.iconPurple}`}>
              <TrendingUp size={20} />
            </div>
            <h3 className={styles.cardTitle}>{t.secondary.title}</h3>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.cardSubtitle}>{t.secondary.subtitle}</p>
          </div>
          <Link to="/invest/portfolio" className={styles.cardLink}>
            {t.secondary.cta} <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};