import React, { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "./Input";
import { Button } from "./Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import { InputType } from "../endpoints/properties/list_GET.schema";
import { PropertyTypeArrayValues } from "../helpers/schema";
import { useLanguage } from "../helpers/useLanguage";
import styles from "./PropertyFilters.module.css";

interface PropertyFiltersProps {
  filters: InputType;
  onFilterChange: (filters: InputType) => void;
  className?: string;
}

export const PropertyFilters: React.FC<PropertyFiltersProps> = ({
  filters,
  onFilterChange,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useLanguage();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleTypeChange = (value: string) => {
    onFilterChange({
      ...filters,
      propertyType: value === "_all" ? undefined : (value as any),
    });
  };

  const handleClear = () => {
    onFilterChange({ page: 1, pageSize: 20 });
    setIsOpen(false);
  };

  return (
    <div 
      className={`${styles.container} ${className || ""}`}
      role="search"
      aria-label={language === "ar" ? "تصفية العقارات" : "Property filters"}
    >
      <div className={styles.searchBar}>
        <div className={styles.inputWrapper}>
          <Search className={styles.searchIcon} size={18} aria-hidden="true" />
          <Input
            placeholder="Search location, zip code, compound..."
            value={filters.search || ""}
            onChange={handleSearchChange}
            className={styles.searchInput}
            aria-label={language === "ar" ? "البحث عن عقار" : "Search properties"}
          />
        </div>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant={isOpen ? "primary" : "outline"}
              size="icon-md"
              className={styles.filterButton}
              aria-label={isOpen 
                ? (language === "ar" ? "إخفاء المرشحات" : "Hide filters") 
                : (language === "ar" ? "إظهار المرشحات" : "Show filters")}
              aria-expanded={isOpen}
              aria-controls="filter-panel"
            >
              <SlidersHorizontal size={18} aria-hidden="true" />
            </Button>
          </CollapsibleTrigger>
        </Collapsible>
      </div>

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent id="filter-panel" className={styles.collapsibleContent}>
          <div className={styles.filtersGrid}>
            <div className={styles.filterGroup}>
              <label htmlFor="filter-type" className={styles.label}>
                {language === "ar" ? "نوع العقار" : "Property Type"}
              </label>
              <Select
                value={filters.propertyType || "_all"}
                onValueChange={handleTypeChange}
              >
              <SelectTrigger id="filter-type" aria-label={language === "ar" ? "نوع العقار" : "Property Type"}>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">{language === "ar" ? "كل الأنواع" : "All Types"}</SelectItem>
                  {PropertyTypeArrayValues.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="filter-min-price" className={styles.label}>
                {language === "ar" ? "أقل سعر (ريال)" : "Min Price (SAR)"}
              </label>
              <Input
                id="filter-min-price"
                type="number"
                placeholder="0"
                value={filters.minPrice || ""}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    minPrice: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="filter-max-price" className={styles.label}>
                {language === "ar" ? "أعلى سعر (ريال)" : "Max Price (SAR)"}
              </label>
              <Input
                id="filter-max-price"
                type="number"
                placeholder="Any"
                value={filters.maxPrice || ""}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    maxPrice: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="filter-bedrooms" className={styles.label}>
                {language === "ar" ? "أقل عدد غرف" : "Min Bedrooms"}
              </label>
              <Select
                value={filters.minBedrooms?.toString() || "_any"}
                onValueChange={(val) =>
                  onFilterChange({
                    ...filters,
                    minBedrooms: val === "_any" ? undefined : Number(val),
                  })
                }
              >
                <SelectTrigger id="filter-bedrooms" aria-label={language === "ar" ? "عدد الغرف" : "Bedrooms"}>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_any">Any</SelectItem>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="2">2+</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                  <SelectItem value="4">4+</SelectItem>
                  <SelectItem value="5">5+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className={styles.actions}>
            <Button
              variant="ghost"
              onClick={handleClear}
              className={styles.clearButton}
            >
              <X size={16} /> Clear Filters
            </Button>
            <Button onClick={() => setIsOpen(false)} className={styles.applyButton}>
              Apply Filters
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};