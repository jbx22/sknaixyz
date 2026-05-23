import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { AppHeader } from "../components/AppHeader";
import { PropertyCard } from "../components/PropertyCard";
import { PropertyFilters } from "../components/PropertyFilters";
import { BottomNav } from "../components/BottomNav";
import { Skeleton } from "../components/Skeleton";
import { usePropertiesQuery } from "../helpers/usePropertiesQuery";
import { InputType } from "../endpoints/properties/list_GET.schema";
import styles from "./properties.module.css";

type ListingTab = "all" | "sale" | "rent";

export default function PropertiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filters from URL search params
  const [filters, setFilters] = useState<InputType>(() => {
    const initialFilters: InputType = { page: 1, pageSize: 20 };
    const search = searchParams.get("search");
    const propertyType = searchParams.get("propertyType");
    const listingType = searchParams.get("listingType");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const minBedrooms = searchParams.get("minBedrooms");

    if (search) initialFilters.search = search;
    if (propertyType) initialFilters.propertyType = propertyType as any;
    if (listingType) initialFilters.listingType = listingType as "sale" | "rent";
    if (minPrice) initialFilters.minPrice = Number(minPrice);
    if (maxPrice) initialFilters.maxPrice = Number(maxPrice);
    if (minBedrooms) initialFilters.minBedrooms = Number(minBedrooms);

    return initialFilters;
  });

  const activeListingTab: ListingTab = filters.listingType || "all";

  const { data, isLoading, isFetching } = usePropertiesQuery(filters);

  // Update URL when filters change
  const handleFilterChange = (newFilters: InputType) => {
    setFilters(newFilters);
    
    const newSearchParams = new URLSearchParams();
    if (newFilters.search) newSearchParams.set("search", newFilters.search);
    if (newFilters.propertyType) newSearchParams.set("propertyType", newFilters.propertyType);
    if (newFilters.listingType) newSearchParams.set("listingType", newFilters.listingType);
    if (newFilters.minPrice) newSearchParams.set("minPrice", newFilters.minPrice.toString());
    if (newFilters.maxPrice) newSearchParams.set("maxPrice", newFilters.maxPrice.toString());
    if (newFilters.minBedrooms) newSearchParams.set("minBedrooms", newFilters.minBedrooms.toString());
    
    setSearchParams(newSearchParams, { replace: true });
  };

  const handleListingTabChange = (tab: ListingTab) => {
    const newFilters = { ...filters, page: 1 };
    if (tab === "all") {
      delete newFilters.listingType;
    } else {
      newFilters.listingType = tab;
    }
    handleFilterChange(newFilters);
  };

  const listingTabs: { key: ListingTab; label: string; labelAr: string }[] = [
    { key: "all", label: "All", labelAr: "الكل" },
    { key: "sale", label: "For Sale", labelAr: "للبيع" },
    { key: "rent", label: "For Rent", labelAr: "للايجار" },
  ];

  const listType = filters.listingType;
  const pageTitle = listType === "rent" ? "Rentals | SKNAI" : listType === "sale" ? "Properties for Sale | SKNAI" : "Properties | SKNAI";
  const pageDesc = listType === "rent"
    ? "Browse available rental properties in Saudi Arabia"
    : listType === "sale"
    ? "Browse properties for sale in Saudi Arabia"
    : "Browse properties in Saudi Arabia";

  return (
    <div className={styles.page}>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
      </Helmet>

      <AppHeader showNavLinks={false} />

      <main className={styles.main}>
        {/* Listing Type Toggle */}
        <div className={styles.listingToggle}>
          {listingTabs.map((tab) => (
            <button
              key={tab.key}
              className={`${styles.toggleBtn} ${activeListingTab === tab.key ? styles.toggleBtnActive : ""}`}
              onClick={() => handleListingTabChange(tab.key)}
              aria-pressed={activeListingTab === tab.key}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {listType === "rent" && (
          <div className={styles.rentalBanner}>
            <h1 className={styles.rentalTitle}>Rental Properties</h1>
            <p className={styles.rentalSubtitle}>Browse available rental properties — login to view AI reports, chat with owners, or rent.</p>
          </div>
        )}

        <PropertyFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          className={styles.filters}
        />

        <div className={styles.content}>
          {isLoading ? (
            <div className={styles.grid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.skeletonCard}>
                  <Skeleton className={styles.skeletonImage} />
                  <div className={styles.skeletonContent}>
                    <Skeleton className={styles.skeletonTitle} />
                    <Skeleton className={styles.skeletonText} />
                    <Skeleton className={styles.skeletonText} />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.properties.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>No properties found</h3>
              <p>Try adjusting your filters to see more results.</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {data?.properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  className={styles.card}
                />
              ))}
            </div>
          )}
          
          {/* Show a subtle loading indicator when fetching new data in background */}
          {isFetching && !isLoading && (
            <div className={styles.fetchingIndicator}>Updating results...</div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
