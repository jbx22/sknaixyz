import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PropertyCard } from "./PropertyCard";
import { Button } from "./Button";
import { PropertyWithDetails } from "../endpoints/properties/list_GET.schema";
import { useLanguage } from "../helpers/useLanguage";
import styles from "./FeaturedProperties.module.css";

// Sample data for demonstration
const SAMPLE_PROPERTIES: PropertyWithDetails[] = [
  {
    id: 1,
    title: "فيلا مودرن فاخرة مع مسبح",
    price: "3500000",
    locationName: "الرياض، حي الملقا",
    bedrooms: 5,
    bathrooms: "6",
    areaSqm: "450",
    propertyType: "villa",
    listingType: "sale",
    status: "available",
    images: ["https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800"],
    latitude: "24.7136",
    longitude: "46.6753",
    zipCode: "12345",
    description: "فيلا رائعة...",
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ownerName: "شركة الراجحي العقارية",
    ownerAvatarUrl: null,
    isFavorited: false,
    isFeatured: true,
    amenities: ["حمام سباحة", "مطبخ حديث", "مصعد"],
    contactPhone: "+966501234567",
    furnished: true,
    yearBuilt: 2020,
    floorNumber: null,
    aiReportStatus: null,
    aiReportGeneratedAt: null,
    aiReportData: null,
    aiReportError: null,
  },
  {
    id: 2,
    title: "شقة واسعة بإطلالة مميزة",
    price: "850000",
    locationName: "جدة، حي الشاطئ",
    bedrooms: 3,
    bathrooms: "2",
    areaSqm: "180",
    propertyType: "apartment",
    listingType: "sale",
    status: "available",
    images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"],
    latitude: "21.5433",
    longitude: "39.1728",
    zipCode: "21442",
    description: "شقة مميزة...",
    userId: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    ownerName: "مكتب الأفق",
    ownerAvatarUrl: null,
    isFavorited: true,
    isFeatured: true,
    amenities: ["مكيف الهواء", "تلفزيون ذكي"],
    contactPhone: "+966509876543",
    furnished: false,
    yearBuilt: 2018,
    floorNumber: 3,
    aiReportStatus: null,
    aiReportGeneratedAt: null,
    aiReportData: null,
    aiReportError: null,
  },
  {
    id: 3,
    title: "تاون هاوس في مجمع سكني راقي",
    price: "1200000",
    locationName: "الخبر، حي الحزام الذهبي",
    bedrooms: 4,
    bathrooms: "3",
    areaSqm: "280",
    propertyType: "townhouse",
    listingType: "rent",
    status: "available",
    images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800"],
    latitude: "26.2172",
    longitude: "50.1971",
    zipCode: "34441",
    description: "تاون هاوس...",
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ownerName: "شركة الراجحي العقارية",
    ownerAvatarUrl: null,
    isFavorited: false,
    isFeatured: false,
    amenities: ["مطبخ مفتوح", "فناء خاص"],
    contactPhone: null,
    furnished: true,
    yearBuilt: 2019,
    floorNumber: null,
    aiReportStatus: null,
    aiReportGeneratedAt: null,
    aiReportData: null,
    aiReportError: null,
  },
  {
    id: 4,
    title: "أرض استثمارية في موقع متميز",
    price: "2500000",
    locationName: "الدمام، حي الملك فهد",
    bedrooms: null,
    bathrooms: null,
    areaSqm: "1200",
    propertyType: "land",
    listingType: "sale",
    status: "available",
    images: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800"],
    latitude: "26.4124",
    longitude: "50.0989",
    zipCode: "34424",
    description: "أرض استثمارية مميزة...",
    userId: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    ownerName: "شركة الخليج للعقارات",
    ownerAvatarUrl: null,
    isFavorited: false,
    isFeatured: true,
    amenities: [],
    contactPhone: "+966505555555",
    furnished: false,
    yearBuilt: null,
    floorNumber: null,
    aiReportStatus: null,
    aiReportGeneratedAt: null,
    aiReportData: null,
    aiReportError: null,
  },
];

export const FeaturedProperties = () => {
  const { language, direction } = useLanguage();

  const t = {
    ar: {
      title: "عقارات مميزة",
      subtitle: "أحدث العقارات المضافة التي قد تناسب ذوقك",
      viewAll: "عرض الكل"
    },
    en: {
      title: "Featured Properties",
      subtitle: "Latest added properties that might suit your taste",
      viewAll: "View All"
    }
  };

  const content = t[language];
  const ArrowIcon = direction === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{content.title}</h2>
            <p className={styles.subtitle}>{content.subtitle}</p>
          </div>
          <Button asChild variant="link" className={styles.viewAllBtn}>
            <Link to="/properties">
              {content.viewAll}
              <ArrowIcon size={16} />
            </Link>
          </Button>
        </div>

        <div className={styles.grid}>
          {SAMPLE_PROPERTIES.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </section>
  );
};