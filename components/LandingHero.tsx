import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./Button";
import { Input } from "./Input";
import { Search } from "lucide-react";
import { useLanguage } from "../helpers/useLanguage";
import styles from "./LandingHero.module.css";

export const LandingHero = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const { language } = useLanguage();

  const t = {
    ar: {
      titlePrefix: "اكتشف منزل أحلامك بمساعدة ",
      titleHighlight: "الذكاء الاصطناعي",
      titleSuffix: "",
      subtitle: "منصة عقارية ذكية مصممة للسوق العربي، تساعدك في العثور على العقار المناسب بكل سهولة",
      placeholder: "ابحث عن مدينة، حي، أو مشروع...",
      searchButton: "ابحث الآن",
      filters: {
        villa: "فيلا",
        apartment: "شقة",
        townhouse: "تاون هاوس",
        commercial: "تجاري"
      }
    },
    en: {
      titlePrefix: "Discover your dream home with ",
      titleHighlight: "Artificial Intelligence",
      titleSuffix: "",
      subtitle: "A smart real estate platform designed for the Arab market, helping you find the right property with ease",
      placeholder: "Search for city, district, or project...",
      searchButton: "Search Now",
      filters: {
        villa: "Villa",
        apartment: "Apartment",
        townhouse: "Townhouse",
        commercial: "Commercial"
      }
    }
  };

  const content = t[language];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    navigate(`/properties?${params.toString()}`);
  };

  const handleQuickFilter = (value: string) => {
    const params = new URLSearchParams();
    params.set("propertyType", value);
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <section className={styles.hero}>
      <div className={styles.content}>
        <h1 className={styles.title}>
          {content.titlePrefix}<span className={styles.highlight}>{content.titleHighlight}</span>{content.titleSuffix}
        </h1>
        <p className={styles.subtitle}>
          {content.subtitle}
        </p>

        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.inputWrapper}>
            <Search className={styles.searchIcon} />
            <Input
              className={styles.searchInput}
              placeholder={content.placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button type="submit" variant="accent" className={styles.searchButton}>
            {content.searchButton}
          </Button>
        </form>

        <div className={styles.filters}>
          <Button 
            variant="outline" 
            className={styles.filterBtn}
            onClick={() => handleQuickFilter("villa")}
          >
            {content.filters.villa}
          </Button>
          <Button 
            variant="outline" 
            className={styles.filterBtn}
            onClick={() => handleQuickFilter("apartment")}
          >
            {content.filters.apartment}
          </Button>
          <Button 
            variant="outline" 
            className={styles.filterBtn}
            onClick={() => handleQuickFilter("townhouse")}
          >
            {content.filters.townhouse}
          </Button>
          <Button 
            variant="outline" 
            className={styles.filterBtn}
            onClick={() => handleQuickFilter("commercial")}
          >
            {content.filters.commercial}
          </Button>
        </div>
      </div>
      
      {/* Abstract background elements */}
      <div className={styles.bgGradientLeft} />
      <div className={styles.bgGradientRight} />
    </section>
  );
};