import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { Search, Filter } from "lucide-react";
import { useTokenOfferings } from "../helpers/useTokenization";
import { tokenizationTranslations } from "../helpers/tokenizationTranslations";
import { useLanguage } from "../helpers/useLanguage";
import { TokenOfferingCard } from "../components/TokenOfferingCard";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Skeleton } from "../components/Skeleton";
import styles from "./invest.module.css";

export default function InvestPage() {
  const { language } = useLanguage();
  const t = tokenizationTranslations[language].offerings;
  
  const [statusFilter, setStatusFilter] = useState<"open" | "closed" | "all">("open");
  const [searchQuery, setSearchQuery] = useState("");

  // We pass 'open' to the hook if filter is open, otherwise we might need to adjust the hook 
  // to accept 'all' or handle client-side filtering if the API doesn't support 'all'.
  // Assuming the API supports status filtering.
  const { data, isLoading } = useTokenOfferings({
    status: statusFilter === "all" ? undefined : statusFilter,
    page: 1,
    pageSize: 100, // Fetch more for client-side search if needed, or implement server search
  });

  const filteredOfferings = data?.offerings.filter(offering => {
    if (!searchQuery) return true;
    return offering.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
           offering.propertyLocation.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  return (
    <div className={styles.page}>
      <Helmet>
        <title>{t.title} | SKNAI</title>
      </Helmet>

      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{t.title}</h1>
          <p className={styles.subtitle}>{t.browse}</p>
        </div>
      </div>

      <div className={styles.container}>
        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <Search className={styles.searchIcon} size={18} />
            <Input 
              placeholder={language === "ar" ? "بحث..." : "Search properties..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          
          <div className={styles.statusFilters}>
            <Button 
              variant={statusFilter === "open" ? "primary" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("open")}
            >
              {t.status.open}
            </Button>
            <Button 
              variant={statusFilter === "closed" ? "primary" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("closed")}
            >
              {t.status.closed}
            </Button>
            <Button 
              variant={statusFilter === "all" ? "primary" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              {language === "ar" ? "الكل" : "All"}
            </Button>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className={styles.grid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={styles.skeletonCard}>
                <Skeleton className={styles.skeletonImage} />
                <div className={styles.skeletonContent}>
                  <Skeleton className={styles.skeletonText} />
                  <Skeleton className={styles.skeletonText} />
                  <Skeleton className={styles.skeletonTextShort} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredOfferings.length === 0 ? (
          <div className={styles.emptyState}>
            <Filter size={48} />
            <h3>{language === "ar" ? "لا توجد نتائج" : "No offerings found"}</h3>
            <p>{language === "ar" ? "جرب تغيير معايير البحث" : "Try adjusting your filters"}</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredOfferings.map((offering) => (
              <TokenOfferingCard 
                key={offering.id} 
                offering={offering} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}