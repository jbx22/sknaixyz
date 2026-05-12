import React, { useState } from "react";
import { Heart, Bed, Bath, Ruler, Sparkles, MessageSquare, Loader2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PropertyWithDetails } from "../endpoints/properties/list_GET.schema";
import { useToggleFavoriteMutation } from "../helpers/useToggleFavoriteMutation";
import { useLanguage } from "../helpers/useLanguage";
import { useAuth } from "../helpers/useAuth";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { PropertyAIReportDialog } from "./PropertyAIReportDialog";
import { PropertyChat } from "./PropertyChat";
import { TokenizationRequestButton } from "./TokenizationRequestButton";
import styles from "./PropertyCard.module.css";

interface PropertyCardProps {
  property: PropertyWithDetails;
  className?: string;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  className,
}) => {
  const [showAIReport, setShowAIReport] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const { authState } = useAuth();
  const navigate = useNavigate();
  
  const { mutate: toggleFavorite, isLoading: isToggling } =
    useToggleFavoriteMutation();
  const { language } = useLanguage();

  const isGeneratingAI = property.aiReportStatus === "pending";
  const isAICompleted = property.aiReportStatus === "completed";

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (authState.type === "loading") {
      return;
    }

    if (authState.type === "unauthenticated") {
      toast.error(language === "ar" ? "يرجى تسجيل الدخول للمفضلة" : "Please login to favorite properties");
      return;
    }

    toggleFavorite({ propertyId: property.id });
  };

  const handleAIReportClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (authState.type === "loading" || isGeneratingAI) {
      return;
    }

    // We allow opening the dialog even if unauthenticated, as the dialog handles
    // unauthenticated state by disabling features.
    // However, if we want to strict gate it:
    // if (authState.type === "unauthenticated") { ... }

    // For now, let's open it as the dialog seems to have a graceful degradation/upsell UI
    setShowAIReport(true);
  };

  const handleChatClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (authState.type === "loading") {
      return;
    }

    // Chat component handles unauthenticated state by showing "Login to participate"
    setShowChat((prev) => !prev);
  };

  const handleCardClick = () => {
    // Placeholder for navigation to details page
    // Using simple alert as per original code logic, but localized would be better if real nav
    alert(`Navigating to property: ${property.title}`);
  };

  const formatPrice = (price: number | string) => {
    return new Intl.NumberFormat(language === "ar" ? "ar-SA" : "en-SA", {
      style: "currency",
      currency: "SAR",
      maximumFractionDigits: 0,
    }).format(Number(price));
  };

  const formattedPrice = formatPrice(property.price);

  const imageUrl =
    property.images && property.images.length > 0
      ? property.images[0]
      : "https://placehold.co/600x400?text=No+Image";

  const translations = {
    beds: language === "ar" ? "سرير" : "Beds",
    baths: language === "ar" ? "دورة مياه" : "Baths",
    aiReport:
      language === "ar"
        ? isGeneratingAI
          ? "جاري التوليد..."
          : isAICompleted
          ? "عرض التقرير"
          : "إنشاء تقرير"
        : isGeneratingAI
        ? "Generating..."
        : isAICompleted
        ? "View Report"
        : "Generate Report",
    chat: language === "ar" ? "الدردشة" : "Chat",
  };

  const isLoadingAuth = authState.type === "loading";

  const isOwner =
    authState.type === "authenticated" && authState.user.id === property.userId;

  return (
    <article
      className={`${styles.card} ${className || ""}`}
      onClick={handleCardClick}
      role="article"
      aria-label={`${property.title}, ${formattedPrice}, ${property.locationName}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      <div className={styles.imageContainer}>
        <img
          src={imageUrl}
          alt={language === "ar" ? `صورة ${property.title}` : `Image of ${property.title}`}
          className={styles.image}
          loading="lazy"
        />
        <div className={styles.badges} aria-label="Property tags">
          <Badge variant="secondary" className={styles.typeBadge}>
            {property.propertyType}
          </Badge>
          <Badge
            variant={property.status === "available" ? "success" : "secondary"}
            className={styles.statusBadge}
          >
            {property.status}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className={`${styles.favoriteButton} ${property.isFavorited ? styles.favorited : ""}`}
          onClick={handleFavoriteClick}
          disabled={isToggling || isLoadingAuth}
          aria-label={property.isFavorited 
            ? (language === "ar" ? "إزالة من المفضلة" : "Remove from favorites") 
            : (language === "ar" ? "إضافة للمفضلة" : "Add to favorites")}
          aria-pressed={property.isFavorited}
        >
          <Heart
            size={18}
            fill={property.isFavorited ? "currentColor" : "none"}
            aria-hidden="true"
          />
        </Button>
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.price}>{formattedPrice}</h3>
          <h4 className={styles.title}>{property.title}</h4>
          <p className={styles.location}>{property.locationName}</p>
        </div>

        <div className={styles.features} aria-label="Property features">
          {property.bedrooms !== null && (
            <div className={styles.feature} title={`${property.bedrooms} ${translations.beds}`}>
              <Bed size={16} aria-hidden="true" />
              <span>
                {property.bedrooms} {translations.beds}
              </span>
            </div>
          )}
          {property.bathrooms !== null && (
            <div className={styles.feature} title={`${property.bathrooms} ${translations.baths}`}>
              <Bath size={16} aria-hidden="true" />
              <span>
                {property.bathrooms} {translations.baths}
              </span>
            </div>
          )}
          <div className={styles.feature} title={`${property.areaSqm} square meters`}>
            <Ruler size={16} aria-hidden="true" />
            <span>{property.areaSqm} m²</span>
          </div>
        </div>

        <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            className={`${styles.aiButton} ${
              isAICompleted ? styles.aiButtonCompleted : ""
            } ${isGeneratingAI ? styles.aiButtonGenerating : ""}`}
            onClick={handleAIReportClick}
            disabled={isLoadingAuth || isGeneratingAI}
            aria-label={translations.aiReport}
          >
            {isGeneratingAI ? (
              <Loader2
                size={14}
                className={`${styles.aiIcon} ${styles.spin}`}
                aria-hidden="true"
              />
            ) : (
              <Sparkles
                size={14}
                className={styles.aiIcon}
                aria-hidden="true"
              />
            )}
            {translations.aiReport}
          </Button>
          <Button
            variant={showChat ? "secondary" : "outline"}
            size="sm"
            className={styles.chatButton}
            onClick={handleChatClick}
            disabled={isLoadingAuth}
            aria-label={translations.chat}
            aria-expanded={showChat}
            aria-controls={`chat-section-${property.id}`}
          >
            <MessageSquare size={14} aria-hidden="true" />
            {translations.chat}
          </Button>

          {isOwner && (
            <div
              className={styles.ownerActions}
              onClick={(e) => e.stopPropagation()}
            >
              <TokenizationRequestButton
                propertyId={property.id}
                propertyTitle={property.title}
                compact
                className={styles.tokenizationButton}
              />
            </div>
          )}
        </div>

        {showChat && (
          <div
            id={`chat-section-${property.id}`}
            className={styles.chatSection}
            onClick={(e) => e.stopPropagation()}
            role="region"
            aria-label={translations.chat}
          >
            <PropertyChat
              propertyId={property.id}
              className={styles.embeddedChat}
            />
            <Button
              variant="ghost"
              size="icon-sm"
              className={styles.closeChatButton}
              onClick={() => setShowChat(false)}
              aria-label={language === "ar" ? "إغلاق الدردشة" : "Close chat"}
            >
              <X size={16} />
            </Button>
          </div>
        )}
      </div>

            {showAIReport && (
        <PropertyAIReportDialog
          open={showAIReport}
          onOpenChange={setShowAIReport}
          propertyId={property.id}
          propertyTitle={property.title}
          aiReportStatus={property.aiReportStatus}
        />
      )}
    </article>
  );
};