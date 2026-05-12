import React, { useState } from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  History,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  useWallet,
  useWalletDeposit,
  useWalletWithdraw,
  useKYCStatus,
} from "../helpers/useTokenization";
import { tokenizationTranslations } from "../helpers/tokenizationTranslations";
import { useLanguage } from "../helpers/useLanguage";
import { Button } from "./Button";
import { Input } from "./Input";
import { Skeleton } from "./Skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./Dialog"; // Assuming Dialog exists or using Popover/Modal pattern. 
// Since Dialog is not in the requested list but available in dependencies (@radix-ui/react-dialog), 
// I will implement a simple inline expansion or use the provided Popover if Dialog is not available.
// However, the prompt says "Deposit/Withdraw forms shown inline". So I will use inline expansion.

import styles from "./InvestorWallet.module.css";

interface InvestorWalletProps {
  compact?: boolean;
  className?: string;
}

export const InvestorWallet: React.FC<InvestorWalletProps> = ({
  compact = false,
  className,
}) => {
  const { language } = useLanguage();
  const t = tokenizationTranslations[language].wallet;
  const portfolioT = tokenizationTranslations[language].portfolio.stats;
  const commonT = tokenizationTranslations[language].common;

  const { data: walletData, isLoading: isWalletLoading } = useWallet();
  const { data: kycData, isLoading: isKycLoading } = useKYCStatus();

  const { mutate: deposit, isPending: isDepositing } = useWalletDeposit();
  const { mutate: withdraw, isPending: isWithdrawing } = useWalletWithdraw();

  const [actionType, setActionType] = useState<"deposit" | "withdraw" | null>(
    null
  );
  const [amount, setAmount] = useState("");

  const wallet = walletData?.wallet;
  const isKycApproved = kycData?.kyc?.status === "approved";

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat(language === "ar" ? "ar-SA" : "en-US", {
      style: "currency",
      currency: "SAR",
    }).format(Number(val));
  };

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;

    if (actionType === "deposit") {
      deposit(
        { amount: val },
        {
          onSuccess: () => {
            toast.success(commonT.success);
            setActionType(null);
            setAmount("");
          },
          onError: (err) => toast.error(err.message),
        }
      );
    } else if (actionType === "withdraw") {
      withdraw(
        { amount: val },
        {
          onSuccess: () => {
            toast.success(commonT.success);
            setActionType(null);
            setAmount("");
          },
          onError: (err) => toast.error(err.message),
        }
      );
    }
  };

  if (isWalletLoading || isKycLoading) {
    return <Skeleton className={`${styles.skeleton} ${className || ""}`} />;
  }

  if (!wallet) return null;

  return (
    <div className={`${styles.card} ${className || ""}`}>
      {/* Header / Balance Section */}
      <div className={styles.balanceSection}>
        <div className={styles.balanceHeader}>
          <div className={styles.balanceLabel}>
            <Wallet size={20} />
            <span>{t.balance}</span>
          </div>
          {!isKycApproved && (
            <div className={styles.kycWarning}>
              <AlertTriangle size={16} />
              <Link to="/invest/kyc" className={styles.kycLink}>
                {language === "ar"
                  ? "أكمل التحقق للإيداع"
                  : "Complete KYC to deposit"}
              </Link>
            </div>
          )}
        </div>
        <div className={styles.balanceAmount}>
          {formatCurrency(wallet.balanceSar)}
        </div>
        
        {!compact && (
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t.frozen}</span>
              <span className={styles.statValue}>
                {formatCurrency(wallet.frozenSar)}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{portfolioT.totalInvested}</span>
              <span className={styles.statValue}>
                {formatCurrency(wallet.totalInvested)}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{portfolioT.totalIncome}</span>
              <span className={`${styles.statValue} ${styles.success}`}>
                +{formatCurrency(wallet.totalIncomeReceived)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <Button
          variant={actionType === "deposit" ? "primary" : "outline"}
          className={styles.actionButton}
          onClick={() => setActionType(actionType === "deposit" ? null : "deposit")}
          disabled={!isKycApproved}
        >
          <ArrowDownLeft size={18} />
          {t.deposit}
        </Button>
        <Button
          variant={actionType === "withdraw" ? "primary" : "outline"}
          className={styles.actionButton}
          onClick={() => setActionType(actionType === "withdraw" ? null : "withdraw")}
          disabled={!isKycApproved}
        >
          <ArrowUpRight size={18} />
          {t.withdraw}
        </Button>
      </div>

      {/* Inline Form */}
      {actionType && (
        <form onSubmit={handleAction} className={styles.inlineForm}>
          <div className={styles.formHeader}>
            <h4>
              {actionType === "deposit"
                ? t.actions.depositTitle
                : t.actions.withdrawTitle}
            </h4>
          </div>
          <div className={styles.formRow}>
            <Input
              type="number"
              placeholder={t.actions.amountPlaceholder}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={100}
              step={10}
              className={styles.amountInput}
              autoFocus
            />
            <Button
              type="submit"
              disabled={isDepositing || isWithdrawing || !amount}
            >
              {(isDepositing || isWithdrawing) ? (
                <Loader2 className={styles.spinner} size={16} />
              ) : (
                commonT.confirm
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};