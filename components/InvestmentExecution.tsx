import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, AlertCircle, Wallet, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { OfferingDetails } from "../endpoints/tokenization/offerings/details_GET.schema";
import {
  useInvestInOffering,
  useWallet,
  useKYCStatus,
} from "../helpers/useTokenization";
import { tokenizationTranslations } from "../helpers/tokenizationTranslations";
import { useLanguage } from "../helpers/useLanguage";
import { Button } from "./Button";
import { Input } from "./Input";
import { Checkbox } from "./Checkbox";
import { TokenEconomics } from "./TokenEconomics";
import { Separator } from "./Separator";
import styles from "./InvestmentExecution.module.css";

interface InvestmentExecutionProps {
  offering: OfferingDetails;
  onComplete?: () => void;
  className?: string;
}

export const InvestmentExecution: React.FC<InvestmentExecutionProps> = ({
  offering,
  onComplete,
  className,
}) => {
  const { language } = useLanguage();
  const t = tokenizationTranslations[language].investment;
  const offeringsT = tokenizationTranslations[language].offerings.details;
  const commonT = tokenizationTranslations[language].common;
  const walletT = tokenizationTranslations[language].wallet;

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [quantity, setQuantity] = useState<number>(1);
  const [risksAccepted, setRisksAccepted] = useState({
    risk1: false,
    risk2: false,
    risk3: false,
  });

  const { data: walletData } = useWallet();
  const { data: kycData } = useKYCStatus();
  const { mutate: invest, isPending: isInvesting } = useInvestInOffering();

  const wallet = walletData?.wallet;
  const isKycApproved = kycData?.kyc?.status === "approved";
  const tokenPrice = parseFloat(offering.tokenPrice);
  const totalCost = quantity * tokenPrice;
  const hasBalance = wallet ? parseFloat(wallet.balanceSar) >= totalCost : false;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(language === "ar" ? "ar-SA" : "en-US", {
      style: "currency",
      currency: "SAR",
    }).format(val);
  };

  const handleNext = () => {
    if (step === 2 && !hasBalance) {
      toast.error("Insufficient balance");
      return;
    }
    setStep((prev) => (prev < 4 ? (prev + 1) as any : prev));
  };

  const handleBack = () => {
    setStep((prev) => (prev > 1 ? (prev - 1) as any : prev));
  };

  const handleExecute = () => {
    invest(
      { assetId: offering.id, quantity },
      {
        onSuccess: () => {
          setStep(4); // Success step
          if (onComplete) onComplete();
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  // Step 1: Review Economics
  if (step === 1) {
    return (
      <div className={`${styles.container} ${className || ""}`}>
        <div className={styles.header}>
          <h3>Step 1: Review Economics</h3>
          <div className={styles.stepIndicator}>1/3</div>
        </div>
        <TokenEconomics offering={offering} showFull={false} />
        <div className={styles.footer}>
          <Button onClick={handleNext} className={styles.nextButton}>
            {commonT.next} <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    );
  }

  // Step 2: Select Quantity
  if (step === 2) {
    return (
      <div className={`${styles.container} ${className || ""}`}>
        <div className={styles.header}>
          <h3>Step 2: Investment Amount</h3>
          <div className={styles.stepIndicator}>2/3</div>
        </div>

        <div className={styles.content}>
          <div className={styles.balanceCard}>
            <div className={styles.balanceRow}>
              <div className={styles.balanceLabel}>
                <Wallet size={16} />
                <span>{walletT.balance}</span>
              </div>
              <span className={styles.balanceValue}>
                {wallet ? formatCurrency(parseFloat(wallet.balanceSar)) : "..."}
              </span>
            </div>
            {!isKycApproved && (
              <div className={styles.kycAlert}>
                <AlertCircle size={16} />
                <Link to="/invest/kyc">Complete KYC to invest</Link>
              </div>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label>{t.quantity}</label>
            <Input
              type="number"
              min={1}
              max={offering.availableTokens}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              disabled={!isKycApproved}
            />
            <div className={styles.helperText}>
              {offering.availableTokens} tokens available
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.summaryRow}>
              <span>{offeringsT.tokenPrice}</span>
              <span>{formatCurrency(tokenPrice)}</span>
            </div>
            <Separator className={styles.separator} />
            <div className={styles.summaryRowTotal}>
              <span>{t.totalCost}</span>
              <span>{formatCurrency(totalCost)}</span>
            </div>
          </div>

          {!hasBalance && isKycApproved && (
            <div className={styles.errorAlert}>
              Insufficient balance. <Link to="/invest/wallet">Deposit funds</Link>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <Button variant="outline" onClick={handleBack}>
            {commonT.back}
          </Button>
          <Button
            onClick={handleNext}
            disabled={!isKycApproved || !hasBalance || quantity < 1}
          >
            {commonT.next} <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    );
  }

  // Step 3: Risk & Confirm
  if (step === 3) {
    const allAccepted = Object.values(risksAccepted).every(Boolean);

    return (
      <div className={`${styles.container} ${className || ""}`}>
        <div className={styles.header}>
          <h3>Step 3: Risk Acknowledgement</h3>
          <div className={styles.stepIndicator}>3/3</div>
        </div>

        <div className={styles.content}>
          <div className={styles.riskGroup}>
            <div className={styles.checkboxRow}>
              <Checkbox
                id="risk1"
                checked={risksAccepted.risk1}
                onChange={(e) =>
                  setRisksAccepted((p) => ({ ...p, risk1: e.target.checked }))
                }
              />
              <label htmlFor="risk1">{t.acknowledge}</label>
            </div>
            <div className={styles.checkboxRow}>
              <Checkbox
                id="risk2"
                checked={risksAccepted.risk2}
                onChange={(e) =>
                  setRisksAccepted((p) => ({ ...p, risk2: e.target.checked }))
                }
              />
              <label htmlFor="risk2">{t.noGuarantee}</label>
            </div>
            <div className={styles.checkboxRow}>
              <Checkbox
                id="risk3"
                checked={risksAccepted.risk3}
                onChange={(e) =>
                  setRisksAccepted((p) => ({ ...p, risk3: e.target.checked }))
                }
              />
              <label htmlFor="risk3">{t.assetBacked}</label>
            </div>
          </div>

          <div className={styles.finalSummary}>
            <span>Investing</span>
            <strong>{formatCurrency(totalCost)}</strong>
          </div>
        </div>

        <div className={styles.footer}>
          <Button variant="outline" onClick={handleBack} disabled={isInvesting}>
            {commonT.back}
          </Button>
          <Button
            onClick={handleExecute}
            disabled={!allAccepted || isInvesting}
            className={styles.executeButton}
          >
            {isInvesting ? (
              <Loader2 className={styles.spinner} size={16} />
            ) : (
              t.execute
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Step 4: Success
  return (
    <div className={`${styles.container} ${styles.successContainer} ${className || ""}`}>
      <div className={styles.confetti}>🎉</div>
      <div className={styles.successIcon}>
        <Check size={48} />
      </div>
      <h3>Investment Successful!</h3>
      <p>
        You have successfully invested {formatCurrency(totalCost)} in{" "}
        {offering.propertyTitle}.
      </p>
      <div className={styles.successActions}>
        <Button asChild variant="outline">
          <Link to="/invest/portfolio">View Portfolio</Link>
        </Button>
        <Button asChild>
          <Link to="/invest">Browse More</Link>
        </Button>
      </div>
    </div>
  );
};