import React from "react";
import { Heart } from "lucide-react";
import { useUserFavorites } from "../helpers/useUserFavorites";
import { useLanguage } from "../helpers/useLanguage";
import { dashboardTranslations } from "../helpers/dashboardTranslations";
import { PropertyCard } from "./PropertyCard";
import { Skeleton } from "./Skeleton";
import { Button } from "./Button";
import { Link } from "react-router-dom";
import styles from "./UserFavorites.module.css";

interface UserFavoritesProps {
  limit?: number;
  className?: string;
}

export const UserFavorites: React.FC<UserFavoritesProps> = ({ 
  limit,
  className 
}) => {
  const { favorites, isLoading } = useUserFavorites();
  const { language } = useLanguage();
  const t = dashboardTranslations[language];

  if (isLoading) {
    return (
      <div className={`${styles.grid} ${className || ""}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className={styles.skeletonCard}>
            <Skeleton className={styles.skeletonImage} />
            <Skeleton className={styles.skeletonText} />
            <Skeleton className={styles.skeletonTextShort} />
          </div>
        ))}
      </div>
    );
  }

  if (!favorites || favorites.length === 0) {
    return (
      <div className={`${styles.emptyState} ${className || ""}`}>
        <Heart size={48} className={styles.emptyIcon} />
        <p>{t.noFavorites}</p>
        <Link to="/properties">
          <Button variant="outline" size="sm">
            {t.browseProperties}
          </Button>
        </Link>
      </div>
    );
  }

  const displayFavorites = limit ? favorites.slice(0, limit) : favorites;

  return (
    <div className={`${styles.grid} ${className || ""}`}>
      {displayFavorites.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
};