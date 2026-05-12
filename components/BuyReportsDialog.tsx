import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CreditCard, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./Dialog";
import { Button } from "./Button";
import { postBuyReports } from "../endpoints/subscription/buy_reports_POST.schema";
import { SUBSCRIPTION_QUERY_KEY } from "../helpers/useSubscription";
import { useLanguage } from "../helpers/useLanguage";
import { SUBSCRIPTION_STRINGS } from "../helpers/subscriptionTranslations";
import { useAuth } from "../helpers/useAuth";
import { SubscriptionTier } from "../helpers/schema";
import styles from "./BuyReportsDialog.module.css";

interface BuyReportsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QUANTITY_OPTIONS = [
  { value: 1, label: "1" },
  { value: 5, label: "5" },
  { value: 10, label: "10" },
];

export const BuyReportsDialog = ({ open, onOpenChange }: BuyReportsDialogProps) => {
  const { language } = useLanguage();
  const { authState } = useAuth();
  const t = SUBSCRIPTION_STRINGS[language];
  const queryClient = useQueryClient();
  const [selectedQuantity, setSelectedQuantity] = useState(5);

  const tier: SubscriptionTier =
    authState.type === "authenticated" ? authState.user.subscriptionTier : "free";

  const costPerReport = tier === "premium" ? 5 : 10;

  const buyReportsMutation = useMutation({
    mutationFn: (quantity: number) => postBuyReports({ quantity }),
    onSuccess: (data) => {
      toast.success(
        t.extraReports.purchaseSuccess.replace("{count}", data.reportsPurchased.toString())
      );
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to purchase reports");
    },
  });

  const totalCost = selectedQuantity * costPerReport;

  const handlePurchase = () => {
    buyReportsMutation.mutate(selectedQuantity);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.content}>
        <DialogHeader>
          <DialogTitle>{t.aiReports.buyMoreReports}</DialogTitle>
          <DialogDescription>
            {language === "ar"
              ? "اختر عدد التقارير التي ترغب في شرائها"
              : "Select the number of reports you want to purchase"}
          </DialogDescription>
        </DialogHeader>

        <div className={styles.body}>
          <div className={styles.quantitySection}>
            <label className={styles.label}>
              {language === "ar" ? "العدد" : "Quantity"}
            </label>
            <div className={styles.quantityOptions}>
              {QUANTITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.quantityOption} ${
                    selectedQuantity === option.value ? styles.selected : ""
                  }`}
                  onClick={() => setSelectedQuantity(option.value)}
                >
                  <span className={styles.quantityLabel}>{option.label}</span>
                  <span className={styles.quantitySubtext}>
                    {language === "ar" ? "تقارير" : "reports"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.priceSection}>
            <div className={styles.priceRow}>
              <span>
                {language === "ar" ? "السعر لكل تقرير" : "Price per report"}
              </span>
              <span className={styles.priceValue}>
                {tier === "premium"
                  ? t.extraReports.extraReportPricePremium
                  : t.extraReports.extraReportPrice}
              </span>
            </div>
            <div className={styles.priceRow}>
              <span className={styles.totalLabel}>
                {language === "ar" ? "المجموع" : "Total"}
              </span>
              <span className={styles.totalValue}>
                {totalCost} {language === "ar" ? "ريال" : "SAR"}
              </span>
            </div>
          </div>

          <div className={styles.infoBox}>
            <CreditCard size={18} />
            <p>
              {language === "ar"
                ? "سيتم إضافة التقارير إلى حسابك فوراً بعد الدفع"
                : "Reports will be added to your account immediately after payment"}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={buyReportsMutation.isPending}>
            {language === "ar" ? "إلغاء" : "Cancel"}
          </Button>
          <Button onClick={handlePurchase} disabled={buyReportsMutation.isPending}>
            {buyReportsMutation.isPending
              ? language === "ar"
                ? "جاري المعالجة..."
                : "Processing..."
              : language === "ar"
              ? `شراء مقابل ${totalCost} ريال`
              : `Buy for ${totalCost} SAR`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};