import { PropertyWithDetails } from "../endpoints/properties/list_GET.schema";

interface SeedProperty {
  id: string;
  title: string;
  city: string;
  district: string;
  lat: number;
  lng: number;
  price: number;
  type: "apartment" | "villa" | "commercial" | "warehouse" | "hotel_apartment";
  status: "sale" | "rent";
  bedrooms: number;
  area: number;
  aiScore: number;
  descriptionEn: string;
  descriptionAr: string;
  listedBy: string;
  rerReference: string;
}

const seedProperties: SeedProperty[] = [
  // Riyadh Properties
  {
    id: "prop_riyadh_001",
    title: "Luxury Apartment in Riyadh Downtown",
    city: "Riyadh",
    district: "Al-Malaz",
    lat: 24.7136,
    lng: 46.6753,
    price: 850000,
    type: "apartment",
    status: "sale",
    bedrooms: 3,
    area: 180,
    aiScore: 92,
    descriptionEn: "Modern luxury apartment in the heart of Riyadh with premium finishes and panoramic city views. Located in the prestigious Al-Malaz district.",
    descriptionAr: "شقة فاخرة في قلب الرياض مع تشطيبات فاخرة وإطلالات بانورامية على المدينة. موقعها في حي المالاز المرموق.",
    listedBy: "Riyadh Estates Co.",
    rerReference: "RER-RH-2024-001"
  },
  {
    id: "prop_riyadh_002",
    title: "Family Villa in Diplomatic Quarter",
    city: "Riyadh",
    district: "Diplomatic Quarter",
    lat: 24.7445,
    lng: 46.7238,
    price: 4500000,
    type: "villa",
    status: "sale",
    bedrooms: 6,
    area: 650,
    aiScore: 95,
    descriptionEn: "Spacious family villa in the secure Diplomatic Quarter with private garden, swimming pool, and modern amenities.",
    descriptionAr: "فيلا عائلية واسعة في الحي الدبلوماني الآمن مع حديسة خاصة وبحيرة سباحة ومرفقات حديثة.",
    listedBy: "Saudi Homes Group",
    rerReference: "RER-RH-2024-002"
  },
  {
    id: "prop_riyadh_003",
    title: "Commercial Office in Olaya District",
    city: "Riyadh",
    district: "Olaya",
    lat: 24.7745,
    lng: 46.6794,
    price: 1200000,
    type: "commercial",
    status: "rent",
    bedrooms: 0,
    area: 320,
    aiScore: 88,
    descriptionEn: "Prime commercial office space in Olaya business district with high visibility and excellent accessibility.",
    descriptionAr: "مساحة تجارية مكتبية متميزة في حي العليا التجاري مع إطلالة عالية وسهولة وصول ممتازة.",
    listedBy: "Commercial Properties Ltd",
    rerReference: "RER-RH-2024-003"
  },
  {
    id: "prop_riyadh_004",
    title: "Modern Warehouse in Industrial City",
    city: "Riyadh",
    district: "Second Industrial City",
    lat: 24.8136,
    lng: 46.6353,
    price: 2500000,
    type: "warehouse",
    status: "sale",
    bedrooms: 0,
    area: 1200,
    aiScore: 85,
    descriptionEn: "Large industrial warehouse with strategic location in Second Industrial City, perfect for logistics and distribution.",
    descriptionAr: "مستودع صناعي كبير بموقع استراتيجي في المنطقة الصناعية الثانية، مثالي للخدمات اللوجستية والتوزيع.",
    listedBy: "Industrial Properties Saudi",
    rerReference: "RER-RH-2024-004"
  },
  {
    id: "prop_riyadh_005",
    title: "Hotel Apartment in Business District",
    city: "Riyadh",
    district: "King Abdullah Financial District",
    lat: 24.7334,
    lng: 46.6693,
    price: 600000,
    type: "hotel_apartment",
    status: "rent",
    bedrooms: 2,
    area: 120,
    aiScore: 90,
    descriptionEn: "Fully furnished hotel apartment in the prestigious KAFD with hotel services and excellent amenities.",
    descriptionAr: "شقة فندقية مُجهزة بالكامل في حي الملك عبدالله المالي المرموق مع خدمات فندقية ومرفقات ممتازة.",
    listedBy: "KAFD Hospitality",
    rerReference: "RER-RH-2024-005"
  },
  
  // Jeddah Properties
  {
    id: "prop_jeddah_001",
    title: "Beachfront Villa in North Obhur",
    city: "Jeddah",
    district: "North Obhur",
    lat: 21.7860,
    lng: 39.0967,
    price: 6800000,
    type: "villa",
    status: "sale",
    bedrooms: 8,
    area: 850,
    aiScore: 94,
    descriptionEn: "Stunning beachfront villa with direct access to private beach, infinity pool, and luxury finishes throughout.",
    descriptionAr: "فيلا ساحلية مذهلة مع وصول مباشر إلى شاطئ خاص وبحيرة سبحة لا نهائية وتشطيبات فاخرة في جميع أنحائها.",
    listedBy: "Red Sea Properties",
    rerReference: "RER-JH-2024-001"
  },
  {
    id: "prop_jeddah_002",
    title: "Modern Apartment in Tahliah Street",
    city: "Jeddah",
    district: "Al-Balad",
    lat: 21.4952,
    lng: 39.1728,
    price: 420000,
    type: "apartment",
    status: "sale",
    bedrooms: 2,
    area: 140,
    aiScore: 87,
    descriptionEn: "Renovated apartment in historic Jeddah district with modern amenities and close proximity to downtown attractions.",
    descriptionAr: "شقة منزلية مطورة في حي البلاد التاريخي لمدينة جدة مع مرافق حديثة وقرب من المعالم السياحية في وسط المدينة.",
    listedBy: "Jeddah Real Estate",
    rerReference: "RER-JH-2024-002"
  },
  {
    id: "prop_jeddah_003",
    title: "Office Space in Al-Khozam District",
    city: "Jeddah",
    district: "Al-Khozam",
    lat: 21.6315,
    lng: 39.1234,
    price: 950000,
    type: "commercial",
    status: "rent",
    bedrooms: 0,
    area: 280,
    aiScore: 86,
    descriptionEn: "Professional office space in Al-Khozam business area with high visibility and modern facilities.",
    descriptionAr: "مساحة مكتبية احترافية في منطقة الأعمال بالخزام مع إطلالة عالية ومرفقات حديثة.",
    listedBy: "Jeddah Commercial Brokers",
    rerReference: "RER-JH-2024-003"
  },
  {
    id: "prop_jeddah_004",
    title: "Hotel Apartment in Al-Hamra District",
    city: "Jeddah",
    district: "Al-Hamra",
    lat: 21.6452,
    lng: 39.1715,
    price: 380000,
    type: "hotel_apartment",
    status: "sale",
    bedrooms: 1,
    area: 85,
    aiScore: 89,
    descriptionEn: "Compact hotel apartment in central Jeddah with hotel management services and prime location.",
    descriptionAr: "شقة فندقية مدمجة في وسط جدة مع خدمات إدارة فندقية وموقع متميز.",
    listedBy: "Hamra Properties",
    rerReference: "RER-JH-2024-004"
  },
  
  // Dammam Properties
  {
    id: "prop_dammam_001",
    title: "Family Apartment in Al-Raka",
    city: "Dammam",
    district: "Al-Raka",
    lat: 26.4214,
    lng: 50.1009,
    price: 320000,
    type: "apartment",
    status: "sale",
    bedrooms: 3,
    area: 160,
    aiScore: 84,
    descriptionEn: "Comfortable family apartment in Al-Raka district with good connectivity to schools and shopping centers.",
    descriptionAr: "شقة عائلية مريحة في حي الرقة مع اتصال جيد بالمدراس والمولات التجارية.",
    listedBy: "Eastern Province Properties",
    rerReference: "RER-DM-2024-001"
  },
  {
    id: "prop_dammam_002",
    title: "Commercial Building in Al-Anqas District",
    city: "Dammam",
    district: "Al-Anqas",
    lat: 26.3786,
    lng: 50.2067,
    price: 1800000,
    type: "commercial",
    status: "sale",
    bedrooms: 0,
    area: 450,
    aiScore: 82,
    descriptionEn: "Commercial building in Al-Anqas area with high foot traffic and excellent visibility for retail business.",
    descriptionAr: "مبنى تجاري في حي الأنقاس مع حركة مرور سير عالية وإطلالة ممتازة للأعمال التجارية.",
    listedBy: "Dammam Commercial",
    rerReference: "RER-DM-2024-002"
  },
  {
    id: "prop_dammam_003",
    title: "Warehouse in Second Industrial City",
    city: "Dammam",
    district: "Second Industrial City",
    lat: 26.2156,
    lng: 50.2767,
    price: 2200000,
    type: "warehouse",
    status: "rent",
    bedrooms: 0,
    area: 950,
    aiScore: 83,
    descriptionEn: "Modern warehouse facility in Dammam's Second Industrial City with loading docks and high ceilings.",
    descriptionAr: "مرفق مستودع حديث في المنطقة الصناعية الثانية بدمام مع أرصفة تحميل وسقوف عالية.",
    listedBy: "Industrial Park Dammam",
    rerReference: "RER-DM-2024-003"
  },
  {
    id: "prop_dammam_004",
    title: "Luxury Hotel Apartment in Al-Khobar",
    city: "Dammam",
    district: "Al-Khobar",
    lat: 26.2697,
    lng: 50.2073,
    price: 750000,
    type: "hotel_apartment",
    status: "sale",
    bedrooms: 2,
    area: 150,
    aiScore: 91,
    descriptionEn: "Luxury hotel apartment in Al-Khobar with full hotel services and proximity to shopping malls and restaurants.",
    descriptionAr: "شقة فندقية فاخرة في الخبر مع خدمات فندقية كاملة وقرب من المولات والمطاعم.",
    listedBy: "Khobar Hospitality",
    rerReference: "RER-DM-2024-004"
  }
];

// Convert seed properties to the format expected by the application
export function getSeedProperties(): PropertyWithDetails[] {
  return seedProperties.map(prop => ({
    id: prop.id,
    title: prop.title,
    city: prop.city,
    district: prop.district,
    lat: prop.lat,
    lng: prop.lng,
    latitude: prop.lat,
    longitude: prop.lng,
    price: prop.price,
    type: prop.type,
    listingType: prop.status,
    status: "available" as const,
    bedrooms: prop.bedrooms,
    area: prop.area,
    aiScore: prop.aiScore,
    description: prop.descriptionEn,
    descriptionAr: prop.descriptionAr,
    listedBy: prop.listedBy,
    rerReference: prop.rerReference,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Additional fields that might be required
    images: [],
    features: [],
    amenities: [],
    location: {
      address: `${prop.district}, ${prop.city}`,
      city: prop.city,
      district: prop.district,
      country: "Saudi Arabia",
      coordinates: {
        lat: prop.lat,
        lng: prop.lng,
      },
    },
    pricing: {
      price: prop.price,
      currency: "SAR",
      pricePerSqm: prop.price / prop.area,
      status: prop.status === "sale" ? "available" : "available",
      negotiable: true,
    },
    aiReportStatus: "completed",
    aiReport: {
      investmentScore: prop.aiScore,
      rentalYield: prop.status === "rent" ? Math.random() * 0.05 + 0.03 : 0,
      appreciationPotential: Math.random() * 0.15 + 0.05,
      liquidityScore: Math.random() * 0.3 + 0.6,
      riskAssessment: "Low to Moderate",
      recommendation: "Good investment opportunity",
      analysis: "Property shows strong potential based on location, amenities, and market trends.",
      lastUpdated: new Date().toISOString(),
    },
    seller: {
      id: "seller_" + prop.id,
      name: prop.listedBy,
      type: "company",
      rating: 4.5,
      contact: {
        email: "info@" + prop.listedBy.toLowerCase().replace(/\s+/g, "") + ".com",
        phone: "+966 " + Math.floor(Math.random() * 1000000000),
      },
    },
  }));
}

// Filter and search functions for seed properties
export function filterSeedProperties(properties: PropertyWithDetails[], filters: {
  search?: string;
  city?: string;
  propertyType?: string;
  listingType?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
}): PropertyWithDetails[] {
  return properties.filter(property => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const searchInTitle = property.title.toLowerCase().includes(searchLower);
      const searchInDescription = property.description.toLowerCase().includes(searchLower);
      const searchInCity = property.city.toLowerCase().includes(searchLower);
      if (!searchInTitle && !searchInDescription && !searchInCity) {
        return false;
      }
    }

    // City filter
    if (filters.city && property.city !== filters.city) {
      return false;
    }

    // Property type filter
    if (filters.propertyType && property.type !== filters.propertyType) {
      return false;
    }

    // Price range filter
    if (filters.minPrice && property.price < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice && property.price > filters.maxPrice) {
      return false;
    }

    // Listing type filter
    if (filters.listingType && property.listingType !== filters.listingType) {
      return false;
    }

    // Status filter
    if (filters.status && property.status !== filters.status) {
      return false;
    }

    return true;
  });
}

// Get unique cities from seed properties
export function getUniqueCities(): string[] {
  const cities = [...new Set(seedProperties.map(prop => prop.city))];
  return cities.sort();
}

// Get unique property types from seed properties
export function getUniquePropertyTypes(): string[] {
  const types = [...new Set(seedProperties.map(prop => prop.type))];
  return types.sort();
}

// Generate mock data for testing
export function initializeSeedDataInLocalStorage(): void {
  try {
    // Check if seed data already exists
    const existingData = localStorage.getItem("sknai.seedProperties");
    if (existingData) {
      console.log("Seed properties data already exists in localStorage");
      return;
    }

    // Save seed properties to localStorage
    const seedProps = getSeedProperties();
    localStorage.setItem("sknai.seedProperties", JSON.stringify(seedProps));
    console.log("Initialized seed properties data in localStorage");
    
    // Also initialize mock user data for stats
    localStorage.setItem("sknai.favorites", JSON.stringify([]));
    localStorage.setItem("sknai.propertyViews", JSON.stringify([]));
    localStorage.setItem("sknai.properties", JSON.stringify(seedProps.map(p => ({
      id: p.id,
      title: p.title,
      status: "active"
    }))));
    localStorage.setItem("sknai.inquiries", JSON.stringify([]));
    localStorage.setItem("sknai.transactions", JSON.stringify([]));
    
    console.log("Initialized mock user data for stats");
  } catch (error) {
    console.error("Failed to initialize seed properties data:", error);
  }
}

// Auto-initialize when imported
if (typeof window !== "undefined") {
  initializeSeedDataInLocalStorage();
}