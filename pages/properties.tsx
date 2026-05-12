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

export default function PropertiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filters from URL search params
  const [filters, setFilters] = useState<InputType>(() => {
    const initialFilters: InputType = { page: 1, pageSize: 20 };
    const search = searchParams.get("search");
    const propertyType = searchParams.get("propertyType");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const minBedrooms = searchParams.get("minBedrooms");

    if (search) initialFilters.search = search;
    if (propertyType) initialFilters.propertyType = propertyType as any;
    if (minPrice) initialFilters.minPrice = Number(minPrice);
    if (maxPrice) initialFilters.maxPrice = Number(maxPrice);
    if (minBedrooms) initialFilters.minBedrooms = Number(minBedrooms);

    return initialFilters;
  });

  const { data, isLoading, isFetching } = usePropertiesQuery(filters);

  // Update URL when filters change
  const handleFilterChange = (newFilters: InputType) => {
    setFilters(newFilters);
    
    const newSearchParams = new URLSearchParams();
    if (newFilters.search) newSearchParams.set("search", newFilters.search);
    if (newFilters.propertyType) newSearchParams.set("propertyType", newFilters.propertyType);
    if (newFilters.minPrice) newSearchParams.set("minPrice", newFilters.minPrice.toString());
    if (newFilters.maxPrice) newSearchParams.set("maxPrice", newFilters.maxPrice.toString());
    if (newFilters.minBedrooms) newSearchParams.set("minBedrooms", newFilters.minBedrooms.toString());
    
    setSearchParams(newSearchParams, { replace: true });
  };

  return (
    <div className={styles.page}>
      <Helmet>
        <title>Properties | SKNAI</title>
        <meta name="description" content="Browse available properties in Saudi Arabia" />
      </Helmet>

      <AppHeader showNavLinks={false} />

      <main className={styles.main}>
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