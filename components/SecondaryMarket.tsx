import React, { useState } from "react";
import {
  ShoppingBag,
  Tag,
  TrendingUp,
  DollarSign,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  useSecondaryListings,
  useBuySecondaryListing,
  useCreateSecondaryListing,
  usePortfolio,
} from "../helpers/useTokenization";
import { tokenizationTranslations } from "../helpers/tokenizationTranslations";
import { useLanguage } from "../helpers/useLanguage";
import { Button } from "./Button";
import { Input } from "./Input";
import { Badge } from "./Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./Tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./Dialog";
import { Skeleton } from "./Skeleton";
import styles from "./SecondaryMarket.module.css";

interface SecondaryMarketProps {
  assetId?: number;
  className?: string;
}

export const SecondaryMarket: React.FC<SecondaryMarketProps> = ({
  assetId,
  className,
}) => {
  const { language } = useLanguage();
  const t = tokenizationTranslations[language].secondary;
  const commonT = tokenizationTranslations[language].common;

  const [activeTab, setActiveTab] = useState("buy");
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [buyQuantity, setBuyQuantity] = useState<number>(1);
  const [sellQuantity, setSellQuantity] = useState<number>(1);
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [selectedAssetToSell, setSelectedAssetToSell] = useState<number | null>(
    assetId || null
  );

  // Queries
  const { data: listingsData, isLoading: isLoadingListings } =
    useSecondaryListings(assetId);
  const { data: portfolioData } = usePortfolio();

  // Mutations
  const { mutate: buyListing, isPending: isBuying } = useBuySecondaryListing();
  const { mutate: createListing, isPending: isCreating } =
    useCreateSecondaryListing();

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat(language === "ar" ? "ar-SA" : "en-US", {
      style: "currency",
      currency: "SAR",
    }).format(Number(val));
  };

  const handleBuy = () => {
    if (!selectedListing) return;

    buyListing(
      {
        listingId: selectedListing.id,
        quantity: buyQuantity,
      },
      {
        onSuccess: () => {
          toast.success(commonT.success);
          setSelectedListing(null);
          setBuyQuantity(1);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleSell = () => {
    if (!selectedAssetToSell || sellPrice <= 0 || sellQuantity <= 0) return;

    createListing(
      {
        assetId: selectedAssetToSell,
        quantity: sellQuantity,
        pricePerToken: sellPrice,
      },
      {
        onSuccess: () => {
          toast.success(commonT.success);
          setSellQuantity(1);
          setSellPrice(0);
          // Optionally switch tab or show success message
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  // Filter holdings to find what can be sold
  const sellableHoldings =
    portfolioData?.holdings.filter((h) => h.quantity > 0) || [];

  // If assetId is provided, filter holdings to that asset
  const currentAssetHolding = assetId
    ? sellableHoldings.find((h) => h.assetId === assetId)
    : null;

  return (
    <div className={`${styles.container} ${className || ""}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>{t.title}</h3>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className={styles.tabs}>
        <TabsList>
          <TabsTrigger value="buy">{t.buy}</TabsTrigger>
          <TabsTrigger value="sell">{t.sell}</TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className={styles.tabContent}>
          {isLoadingListings ? (
            <div className={styles.grid}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className={styles.skeletonCard} />
              ))}
            </div>
          ) : listingsData?.listings.length === 0 ? (
            <div className={styles.emptyState}>
              <ShoppingBag size={48} />
              <p>{language === "ar" ? "لا توجد عروض حالياً" : "No active listings found"}</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {listingsData?.listings.map((listing) => (
                <div key={listing.id} className={styles.listingCard}>
                  <div className={styles.listingHeader}>
                    <span className={styles.listingTitle}>
                      {listing.propertyTitle}
                    </span>
                    <Badge variant="outline" className={styles.listingStatus}>
                      {listing.status}
                    </Badge>
                  </div>
                  
                  <div className={styles.listingDetails}>
                    <div className={styles.detailRow}>
                      <span className={styles.label}>{t.pricePerToken}</span>
                      <span className={styles.value}>
                        {formatCurrency(listing.pricePerToken)}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.label}>{t.quantity}</span>
                      <span className={styles.value}>
                        {listing.remainingQuantity} / {listing.quantity}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.label}>{t.seller}</span>
                      <span className={styles.value}>{listing.sellerName}</span>
                    </div>
                  </div>

                  <Button
                    className={styles.buyButton}
                    onClick={() => {
                      setSelectedListing(listing);
                      setBuyQuantity(1);
                    }}
                  >
                    {t.buy}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sell" className={styles.tabContent}>
          {sellableHoldings.length === 0 ? (
            <div className={styles.emptyState}>
              <AlertCircle size={48} />
              <p>
                {language === "ar"
                  ? "لا تملك أي توكنات للبيع"
                  : "You don't have any tokens to sell"}
              </p>
            </div>
          ) : (
            <div className={styles.sellForm}>
              {!assetId && (
                <div className={styles.formGroup}>
                  <label>{language === "ar" ? "اختر الأصل" : "Select Asset"}</label>
                  <select
                    className={styles.select}
                    value={selectedAssetToSell || ""}
                    onChange={(e) =>
                      setSelectedAssetToSell(Number(e.target.value))
                    }
                  >
                    <option value="">
                      {language === "ar" ? "اختر..." : "Select..."}
                    </option>
                    {sellableHoldings.map((h) => (
                      <option key={h.assetId} value={h.assetId}>
                        {h.propertyTitle} ({h.quantity} tokens)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedAssetToSell && (
                <>
                  <div className={styles.formGroup}>
                    <label>{t.quantity}</label>
                    <Input
                      type="number"
                      min={1}
                      max={
                        assetId
                          ? currentAssetHolding?.quantity
                          : sellableHoldings.find(
                              (h) => h.assetId === selectedAssetToSell
                            )?.quantity
                      }
                      value={sellQuantity}
                      onChange={(e) => setSellQuantity(Number(e.target.value))}
                    />
                    <span className={styles.helperText}>
                      {language === "ar" ? "متاح: " : "Available: "}
                      {assetId
                        ? currentAssetHolding?.quantity
                        : sellableHoldings.find(
                            (h) => h.assetId === selectedAssetToSell
                          )?.quantity}
                    </span>
                  </div>

                  <div className={styles.formGroup}>
                    <label>{t.pricePerToken}</label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={sellPrice}
                      onChange={(e) => setSellPrice(Number(e.target.value))}
                    />
                  </div>

                  <div className={styles.summary}>
                    <div className={styles.summaryRow}>
                      <span>{t.totalPrice}</span>
                      <strong>{formatCurrency(sellQuantity * sellPrice)}</strong>
                    </div>
                  </div>

                  <Button
                    onClick={handleSell}
                    disabled={isCreating || sellPrice <= 0 || sellQuantity <= 0}
                    className={styles.submitSellButton}
                  >
                    {isCreating ? (
                      <Loader2 className={styles.spinner} />
                    ) : (
                      t.actions.sellConfirm
                    )}
                  </Button>
                </>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Buy Dialog */}
      <Dialog
        open={!!selectedListing}
        onOpenChange={(open) => !open && setSelectedListing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.actions.buyConfirm}</DialogTitle>
            <DialogDescription>
              {selectedListing?.propertyTitle}
            </DialogDescription>
          </DialogHeader>

          <div className={styles.dialogBody}>
            <div className={styles.infoRow}>
              <span>{t.pricePerToken}</span>
              <strong>{formatCurrency(selectedListing?.pricePerToken || 0)}</strong>
            </div>
            
            <div className={styles.formGroup}>
              <label>{t.quantity}</label>
              <Input
                type="number"
                min={1}
                max={selectedListing?.remainingQuantity}
                value={buyQuantity}
                onChange={(e) => setBuyQuantity(Number(e.target.value))}
              />
              <span className={styles.helperText}>
                Max: {selectedListing?.remainingQuantity}
              </span>
            </div>

            <div className={styles.totalRow}>
              <span>{t.totalPrice}</span>
              <strong>
                {formatCurrency(
                  buyQuantity * (Number(selectedListing?.pricePerToken) || 0)
                )}
              </strong>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedListing(null)}
              disabled={isBuying}
            >
              {commonT.cancel}
            </Button>
            <Button onClick={handleBuy} disabled={isBuying}>
              {isBuying ? <Loader2 className={styles.spinner} /> : commonT.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};