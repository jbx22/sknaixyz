import { useCallback } from "react";

interface WhatsAppShareOptions {
  propertyTitle: string;
  safetyRating: number;
  walkabilityScore: number;
  investmentScore: number;
  estimatedValue: number;
  propertyUrl?: string;
}

export const useWhatsAppShare = () => {
  const shareReport = useCallback((options: WhatsAppShareOptions) => {
    const {
      propertyTitle,
      safetyRating,
      walkabilityScore,
      investmentScore,
      estimatedValue,
      propertyUrl,
    } = options;

    const formatPrice = (price: number) => {
      return new Intl.NumberFormat("en-SA", {
        style: "currency",
        currency: "SAR",
        maximumFractionDigits: 0,
      }).format(price);
    };

    const getRatingEmoji = (rating: number) => {
      if (rating >= 8) return "🌟";
      if (rating >= 6) return "✅";
      if (rating >= 4) return "⚠️";
      return "❌";
    };

    const message = `🏠 *Property AI Report from SKNAI.xyz*

📍 ${propertyTitle}

🤖 *AI Analysis Summary:*

${getRatingEmoji(safetyRating)} Safety Rating: ${safetyRating}/10
${getRatingEmoji(walkabilityScore)} Walkability: ${walkabilityScore}/10
${getRatingEmoji(investmentScore)} Investment Potential: ${investmentScore}/10

💰 Estimated Market Value: ${formatPrice(estimatedValue)}

${propertyUrl ? `🔗 View full report: ${propertyUrl}` : ""}

---
Powered by SKNAI.xyz - Saudi Real Estate Intelligence
Get detailed AI-powered property insights 🚀`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

    window.open(whatsappUrl, "_blank");
  }, []);

  return { shareReport };
};