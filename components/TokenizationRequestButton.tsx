import React, { useState } from "react";
import { Coins, Loader2, CheckCircle, AlertCircle, Clock, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../helpers/useAuth";
import { useLanguage } from "../helpers/useLanguage";
import {
  usePropertyTokenizationRequest,
  useSubmitTokenizationRequest,
} from "../helpers/useTokenizationRequests";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Input } from "./Input";
import { Textarea } from "./Textarea";
import { TokenizationRequestStatus } from "../helpers/schema";
import styles from "./TokenizationRequestButton.module.css";

interface TokenizationRequestButtonProps {
  propertyId: number;
  propertyTitle: string;
  compact?: boolean;
  className?: string;
}

export const TokenizationRequestButton: React.FC<TokenizationRequestButtonProps> = ({
  propertyId,
  propertyTitle,
  compact = false,
  className,
}) => {
  const { language } = useLanguage();
  const { authState } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [estimatedValue, setEstimatedValue] = useState("");
  const [desiredTokenPrice, setDesiredTokenPrice] = useState("");
  const [notes, setNotes] = useState("");

  const { request, isLoading: isLoadingRequest } = usePropertyTokenizationRequest(propertyId);
  const { mutate: submitRequest, isPending: isSubmitting } = useSubmitTokenizationRequest();

  const translations = {
    requestTokenization: language === "ar" ? "طلب تحويل إلى استثمار" : "Request Tokenization",
    pending: language === "ar" ? "قيد الانتظار" : "Pending Review",
    underReview: language === "ar" ? "قيد المراجعة" : "Under Review",
    approved: language === "ar" ? "تمت الموافقة" : "Approved",
    rejected: language === "ar" ? "مرفوض" : "Rejected",
    offeringSoon: language === "ar" ? "سيتم إنشاء العرض قريباً" : "Offering will be created soon",
    estimatedValue: language === "ar" ? "القيمة التقديرية (ر.س)" : "Estimated Value (SAR)",
    desiredTokenPrice: language === "ar" ? "سعر السهم المرغوب (ر.س)" : "Desired Token Price (SAR)",
    notes: language === "ar" ? "ملاحظات إضافية" : "Additional Notes",
    submit: language === "ar" ? "إرسال الطلب" : "Submit Request",
    cancel: language === "ar" ? "إلغاء" : "Cancel",
    loginRequired: language === "ar" ? "يرجى تسجيل الدخول أولاً" : "Please login first",
    success: language === "ar" ? "تم إرسال الطلب بنجاح" : "Request submitted successfully",
    rejectionReason: language === "ar" ? "سبب الرفض" : "Rejection Reason",
    resubmit: language === "ar" ? "إعادة تقديم الطلب" : "Resubmit Request",
  };

  const handleExpand = () => {
    if (authState.type !== "authenticated") {
      toast.error(translations.loginRequired);
      return;
    }
    setIsExpanded(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    submitRequest(
      {
        propertyId,
        estimatedValue: estimatedValue ? Number(estimatedValue) : undefined,
        desiredTokenPrice: desiredTokenPrice ? Number(desiredTokenPrice) : undefined,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          toast.success(translations.success);
          setIsExpanded(false);
          setEstimatedValue("");
          setDesiredTokenPrice("");
          setNotes("");
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  };

  if (isLoadingRequest) {
    return (
      <Button variant="ghost" disabled className={className}>
        <Loader2 className="animate-spin" size={16} />
      </Button>
    );
  }

  // Status Badge Renderer
  const renderStatusBadge = (status: TokenizationRequestStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="warning" className={styles.badge}>
            <Clock size={14} className={styles.badgeIcon} />
            {translations.pending}
          </Badge>
        );
      case "under_review":
        return (
          <Badge variant="secondary" className={styles.badge}>
            <Loader2 size={14} className={styles.badgeIcon} />
            {translations.underReview}
          </Badge>
        );
      case "approved":
        return (
          <div className={styles.approvedContainer}>
            <Badge variant="success" className={styles.badge}>
              <CheckCircle size={14} className={styles.badgeIcon} />
              {translations.approved}
            </Badge>
            {!compact && (
              <span className={styles.approvedNote}>{translations.offeringSoon}</span>
            )}
          </div>
        );
      case "rejected":
        return (
          <div className={styles.rejectedContainer}>
            <Badge variant="destructive" className={styles.badge}>
              <AlertCircle size={14} className={styles.badgeIcon} />
              {translations.rejected}
            </Badge>
            {!compact && request?.rejectionReason && (
              <div className={styles.rejectionReason}>
                <strong>{translations.rejectionReason}:</strong> {request.rejectionReason}
              </div>
            )}
            {!compact && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExpand}
                className={styles.resubmitButton}
              >
                {translations.resubmit}
              </Button>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  // If request exists and we are not in "resubmit" mode (expanded), show status
  if (request && !isExpanded) {
    return (
      <div className={`${styles.statusWrapper} ${className || ""}`}>
        {renderStatusBadge(request.status)}
      </div>
    );
  }

  // Form View
  if (isExpanded) {
    return (
      <div className={`${styles.formContainer} ${className || ""}`}>
        <div className={styles.formHeader}>
          <h4>{translations.requestTokenization}</h4>
          <Button 
            variant="ghost" 
            size="icon-sm" 
            onClick={() => setIsExpanded(false)}
          >
            <X size={16} />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="estimatedValue">{translations.estimatedValue}</label>
            <Input
              id="estimatedValue"
              type="number"
              placeholder="e.g. 1000000"
              value={estimatedValue}
              onChange={(e) => setEstimatedValue(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="desiredTokenPrice">{translations.desiredTokenPrice}</label>
            <Input
              id="desiredTokenPrice"
              type="number"
              placeholder="e.g. 100"
              value={desiredTokenPrice}
              onChange={(e) => setDesiredTokenPrice(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="notes">{translations.notes}</label>
            <Textarea
              id="notes"
              placeholder="..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className={styles.formActions}>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setIsExpanded(false)}
              disabled={isSubmitting}
            >
              {translations.cancel}
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className={styles.submitButton}
            >
              {isSubmitting && <Loader2 className="animate-spin" size={16} />}
              {translations.submit}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // Default Button View
  return (
    <Button
      onClick={handleExpand}
      className={`${styles.requestButton} ${className || ""}`}
      size={compact ? "sm" : "md"}
    >
      <Coins size={compact ? 14 : 16} />
      {translations.requestTokenization}
    </Button>
  );
};