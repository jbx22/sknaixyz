import { db } from "./db";
import { AIReport } from "../endpoints/properties/ai_report_POST.schema";

/**
 * Generates a comprehensive AI property report based on a property ID.
 * This logic is extracted from the ai_report endpoint to be reusable.
 */
export async function generatePropertyReport(
  propertyId: number,
  language: "ar" | "en" = "ar"
): Promise<AIReport> {
  // Fetch property to get coordinates
  const property = await db
    .selectFrom("properties")
    .select(["latitude", "longitude", "locationName", "price", "areaSqm"])
    .where("id", "=", propertyId)
    .executeTakeFirst();

  if (!property) {
    throw new Error("Property not found");
  }

  const lat = Number(property.latitude);
  const lng = Number(property.longitude);
  const price = Number(property.price);
  const area = Number(property.areaSqm);

  // Mock AI Logic based on coordinates
  // In a real scenario, this would call an external AI service or geospatial API
  // We use deterministic "randomness" based on coordinates to make it seem consistent

  const seed = lat + lng;
  const random = (offset: number) => {
    const x = Math.sin(seed + offset) * 10000;
    return x - Math.floor(x);
  };

  const providers =
    language === "ar"
      ? ["إس تي سي", "موبايلي", "زين", "سلام", "فيرجن موبايل"]
      : ["STC", "Mobily", "Zain", "Salam", "Virgin Mobile"];
  const availableProviders = providers.filter((_, i) => random(i) > 0.3);

  const schools =
    language === "ar"
      ? [
          { name: "مدرسة الملك فيصل", type: "خاص" },
          { name: "مدرسة الرياض الدولية", type: "دولي" },
          { name: "مدرسة جيل المستقبل", type: "عام" },
          { name: "مدارس الرواد", type: "خاص" },
        ]
      : [
          { name: "King Faisal School", type: "Private" },
          { name: "Riyadh International School", type: "International" },
          { name: "Future Generation School", type: "Public" },
          { name: "Al-Rowad Schools", type: "Private" },
        ];
  const nearestSchools = schools
    .map((s, i) => ({
      ...s,
      distanceKm: Number((0.5 + random(i + 10) * 5).toFixed(1)),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 3);

  const parks =
    language === "ar"
      ? ["حديقة الملك عبدالله", "حديقة العليا", "حديقة الواحة", "حديقة الحي"]
      : [
          "King Abdullah Park",
          "Olaya Park",
          "Al-Waha Park",
          "Neighborhood Garden",
        ];
  const nearestParks = parks
    .map((p, i) => ({
      name: p,
      distanceKm: Number((0.2 + random(i + 20) * 3).toFixed(1)),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 2);

  const malls =
    language === "ar"
      ? [
          "الرياض بارك مول",
          "النخيل مول",
          "مركز غرناطة",
          "بانوراما مول",
        ]
      : [
          "Riyadh Park Mall",
          "Nakheel Mall",
          "Granada Center",
          "Panorama Mall",
        ];
  const nearestMalls = malls
    .map((m, i) => ({
      name: m,
      distanceKm: Number((1.0 + random(i + 30) * 10).toFixed(1)),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 2);

  const hospitals =
    language === "ar"
      ? [
          "مستشفى الملك فيصل التخصصي",
          "مستشفى د. سليمان الحبيب",
          "مستشفى دلة",
          "مستشفى المملكة",
        ]
      : [
          "King Faisal Specialist Hospital",
          "Dr. Sulaiman Al Habib Hospital",
          "Dallah Hospital",
          "Kingdom Hospital",
        ];
  const nearestHospitals = hospitals
    .map((h, i) => ({
      name: h,
      distanceKm: Number((1.5 + random(i + 40) * 8).toFixed(1)),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 2);

  const metroStations =
    language === "ar"
      ? [
          "محطة مركز الملك عبدالله المالي",
          "محطة العليا",
          "محطة الأمير سلطان",
          "محطة الملز",
        ]
      : [
          "King Abdullah Financial District Station",
          "Olaya Station",
          "Prince Sultan Station",
          "Al Malaz Station",
        ];
  const nearestMetroStations = metroStations
    .map((m, i) => ({
      name: m,
      distanceKm: Number((0.8 + random(i + 50) * 4).toFixed(1)),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 2);

  const busStops =
    language === "ar"
      ? ["محطة الساحة الرئيسية", "محطة مركز المدينة", "محطة الحي"]
      : [
          "Main Square Bus Stop",
          "City Center Terminal",
          "Neighborhood Station",
        ];
  const nearestBusStops = busStops
    .map((b, i) => ({
      name: b,
      distanceKm: Number((0.2 + random(i + 60) * 1.5).toFixed(1)),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 2);

  const cinemas =
    language === "ar"
      ? ["فوكس سينما الرياض بارك", "موفي سينما", "إيه إم سي سينما"]
      : ["VOX Cinemas Riyadh Park", "Muvi Cinema", "AMC Cinemas"];
  const nearestCinemas = cinemas
    .map((c, i) => ({
      name: c,
      distanceKm: Number((1.2 + random(i + 70) * 5).toFixed(1)),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 2);

  const sportsFacilities =
    language === "ar"
      ? [
          "مجمع المدينة الرياضي",
          "النادي الرياضي",
          "فتنس فيرست",
          "مركز الحي الرياضي",
        ]
      : [
          "City Sports Complex",
          "Al-Nadi Al-Riyadhi",
          "Fitness First",
          "Community Sports Center",
        ];
  const nearestSports = sportsFacilities
    .map((s, i) => ({
      name: s,
      distanceKm: Number((0.5 + random(i + 80) * 4).toFixed(1)),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 2);

  const safetyRating = Math.floor(7 + random(50) * 3); // 7 to 10
  const walkabilityScore = Math.floor(6 + random(90) * 4); // 6 to 10
  const noiseLevel = Math.floor(3 + random(100) * 5); // 3 to 8 (lower is better)
  const airQualityIndex = Math.floor(40 + random(110) * 60); // 40 to 100
  const investmentPotentialScore = Math.floor(6 + random(120) * 4); // 6 to 10
  const nearestRestaurants = Math.floor(15 + random(130) * 35); // 15 to 50

  // Traffic conditions
  const trafficOptions =
    language === "ar"
      ? ["خفيفة", "متوسطة", "كثيفة في أوقات الذروة"]
      : ["Light", "Moderate", "Heavy during rush hours"];
  const trafficConditions =
    trafficOptions[Math.floor(random(140) * trafficOptions.length)];

  // Price analysis
  const pricePerSqm = Math.round(price / area);
  const areaPricePerSqmAvg = Math.round(3000 + random(150) * 2000);
  const marketPricePerSqm = 3000 + random(60) * 2000;
  const expectedPrice = Math.round(marketPricePerSqm * area);
  const priceDifference = expectedPrice - price;
  const priceStatus =
    language === "ar"
      ? Math.abs(priceDifference) < expectedPrice * 0.05
        ? "سعر السوق العادل"
        : priceDifference > 0
          ? "أقل من القيمة (صفقة جيدة)"
          : "أعلى من القيمة"
      : Math.abs(priceDifference) < expectedPrice * 0.05
        ? "Fair Market Price"
        : priceDifference > 0
          ? "Undervalued (Good Deal)"
          : "Overvalued";

  // Rental yield
  const rentalYieldEstimate = Number((3 + random(160) * 4).toFixed(1)); // 3% to 7%

  // Future developments
  const possibleDevelopments =
    language === "ar"
      ? [
          "خط مترو جديد مخطط له في 2025",
          "مشروع إعادة تطوير منطقة التسوق",
          "افتتاح مدرسة دولية جديدة قريبة",
          "مبادرة توسعة الحديقة الخضراء",
          "ترقيات البنية التحتية للمدينة الذكية",
        ]
      : [
          "New metro line extension planned for 2025",
          "Shopping district redevelopment project",
          "New international school opening nearby",
          "Green park expansion initiative",
          "Smart city infrastructure upgrades",
        ];
  const futureDevelopments = possibleDevelopments.filter(
    (_, i) => random(170 + i) > 0.4
  );

  // Demographics
  const demographicProfiles =
    language === "ar"
      ? [
          "يغلب على المنطقة الشباب المهنيون والعائلات التي لديها أطفال. تجذب المنطقة الوافدين والمقيمين المحليين الباحثين عن وسائل الراحة الحديثة والمدارس الجيدة.",
          "مجتمع سكني راسخ يضم مزيجاً من المواطنين السعوديين والعائلات الوافدة طويلة الأمد. يتمتع الحي بروح مجتمعية قوية وتنوع ثقافي.",
          "منطقة متنامية تحظى بشعبية بين الأزواج الشباب والمستثمرين. يميل التركيب السكاني نحو السكان من ذوي الدخل المتوسط إلى فوق المتوسط مع تفضيلات نمط الحياة الحديثة.",
          "حي تقليدي لكنه متطور يضم عائلات متعددة الأجيال. يجذب مؤخراً السكان الأصغر سناً بسبب البنية التحتية المحسنة والقرب من مناطق الأعمال.",
        ]
      : [
          "Predominantly young professionals and families with children. The area attracts expatriates and local residents seeking modern amenities and good schools.",
          "Established residential community with a mix of Saudi nationals and long-term expatriate families. The neighborhood has a strong sense of community and cultural diversity.",
          "Growing area popular with young couples and investors. The demographic is skewed towards middle to upper-middle income residents with modern lifestyle preferences.",
          "Traditional yet evolving neighborhood with multigenerational families. Recently attracting younger residents due to improved infrastructure and proximity to business districts.",
        ];
  const neighborhoodDemographics =
    demographicProfiles[Math.floor(random(180) * demographicProfiles.length)];

  // Climate notes
  const climateNotes =
    language === "ar"
      ? random(190) > 0.5
        ? "تستفيد المنطقة من دوران هواء جيد وهي أبرد قليلاً من وسط المدينة. درجات حرارة الصيف نموذجية للرياض، لكن الحي يحتوي على غطاء شجري كافٍ يوفر ظلاً طبيعياً."
        : "كما هو الحال في معظم الرياض، الصيف حار وجاف. يوفر موقع العقار حماية معقولة من العواصف الرملية. أشهر الشتاء (نوفمبر-فبراير) لطيفة مع درجات حرارة معتدلة مثالية للأنشطة الخارجية."
      : random(190) > 0.5
        ? "The area benefits from good air circulation and is slightly cooler than the city center. Summer temperatures are typical for Riyadh, but the neighborhood has adequate tree coverage providing natural shade."
        : "As with most of Riyadh, summers are hot and dry. The property's location offers reasonable protection from sandstorms. Winter months (November-February) are pleasant with mild temperatures ideal for outdoor activities.";

  // Detailed area analysis (2-3 paragraphs)
  let areaAnalysis: string;

  if (language === "ar") {
    const safetyDesc =
      safetyRating > 8 ? "آمن بشكل استثنائي" : "آمن ومحمي";
    const walkabilityDesc =
      walkabilityScore > 8
        ? "قابل للمشي بدرجة عالية مع أرصفة واسعة وبنية تحتية صديقة للمشاة"
        : walkabilityScore > 6
          ? "قابل للمشي بشكل معتدل مع مرافق كافية للمشاة"
          : "يعتمد على السيارات مع بنية تحتية محدودة للمشي";
    const investmentDesc =
      investmentPotentialScore > 8
        ? "إمكانات استثمارية ممتازة مع نمو متوقع قوي"
        : investmentPotentialScore > 6
          ? "فرصة استثمارية جيدة مع تقدير ثابت متوقع"
          : "استثمار مستقر مع آفاق نمو معتدلة";

    areaAnalysis = `يقع هذا العقار في ${property.locationName}، في حي ${safetyDesc} أصبح يحظى بشعبية متزايدة بين العائلات والمهنيين. تتميز المنطقة بكثافة سكنية ${
      random(200) > 0.5 ? "عالية" : "متوسطة"
    } مع مزيج جيد من وسائل الراحة الحديثة والقيم المجتمعية التقليدية. مع نقاط إمكانية المشي ${walkabilityScore}/10، الحي ${walkabilityDesc}، مما يجعله ${
      walkabilityScore > 7
        ? "مناسباً للمهام اليومية والأنشطة الترفيهية"
        : "الأنسب للسكان الذين يمتلكون وسائل نقل خاصة"
    }.

يوفر الموقع ${investmentDesc}. يُظهر تحليل السوق الحالي أن سعر المتر المربع ${pricePerSqm.toLocaleString()} ريال سعودي مقارنة بمتوسط المنطقة ${areaPricePerSqmAvg.toLocaleString()} ريال سعودي، مما يشير إلى ${
      pricePerSqm < areaPricePerSqmAvg
        ? "موقع تسعير مناسب"
        : "موقع متميز في السوق المحلي"
    }. يجعل عائد الإيجار المقدر ${rentalYieldEstimate}% هذا ${
      rentalYieldEstimate > 5
        ? "خياراً جذاباً للمستثمرين في الإيجار"
        : "استثماراً إيجارياً معقولاً"
    }. ظروف حركة المرور في المنطقة ${trafficConditions} بشكل عام، مع اتصال جيد بمناطق الأعمال الرئيسية عبر ${
      nearestMetroStations[0] ? "الوصول إلى المترو القريب و" : ""
    }الطرق السريعة الرئيسية.

مؤشرات جودة الحياة قوية، مع مؤشر جودة الهواء ${airQualityIndex} (${
      airQualityIndex < 50
        ? "ممتاز"
        : airQualityIndex < 75
          ? "جيد"
          : "متوسط"
    }) وتقييم مستوى الضوضاء ${noiseLevel}/10. يوفر الحي وصولاً ممتازاً إلى أكثر من ${nearestRestaurants} مطعماً ومقهى في المنطقة المجاورة، إلى جانب وسائل الراحة الشاملة بما في ذلك المدارس ومرافق الرعاية الصحية وخيارات الترفيه. ${
      futureDevelopments.length > 0
        ? `تشمل التطورات المخططة في المنطقة ${futureDevelopments[0]}، والتي يجب أن تعزز قيم العقارات وإمكانية العيش.`
        : "المنطقة راسخة مع بنية تحتية ناضجة."
    }`;
  } else {
    const safetyDesc =
      safetyRating > 8 ? "exceptionally safe" : "safe and secure";
    const walkabilityDesc =
      walkabilityScore > 8
        ? "highly walkable with wide sidewalks and pedestrian-friendly infrastructure"
        : walkabilityScore > 6
          ? "moderately walkable with adequate pedestrian facilities"
          : "car-dependent with limited walking infrastructure";
    const investmentDesc =
      investmentPotentialScore > 8
        ? "excellent investment potential with strong projected growth"
        : investmentPotentialScore > 6
          ? "good investment opportunity with steady appreciation expected"
          : "stable investment with moderate growth prospects";

    areaAnalysis = `Located in ${property.locationName}, this property sits in a ${safetyDesc} neighborhood that has become increasingly popular among families and professionals. The area is characterized by ${
      random(200) > 0.5 ? "high" : "moderate"
    } residential density with a good mix of modern amenities and traditional community values. With a walkability score of ${walkabilityScore}/10, the neighborhood is ${walkabilityDesc}, making it ${
      walkabilityScore > 7
        ? "convenient for daily errands and leisure activities"
        : "best suited for residents with private transportation"
    }.

The location offers ${investmentDesc}. Current market analysis shows the price per square meter at ${pricePerSqm.toLocaleString()} SAR compared to the area average of ${areaPricePerSqmAvg.toLocaleString()} SAR, indicating ${
      pricePerSqm < areaPricePerSqmAvg
        ? "a favorable pricing position"
        : "premium positioning in the local market"
    }. The estimated rental yield of ${rentalYieldEstimate}% makes this ${
      rentalYieldEstimate > 5
        ? "an attractive option for buy-to-let investors"
        : "a reasonable rental investment"
    }. Traffic conditions in the area are generally ${trafficConditions.toLowerCase()}, with good connectivity to major business districts via ${
      nearestMetroStations[0] ? "nearby metro access and" : ""
    } main highways.

Quality of life indicators are strong, with an air quality index of ${airQualityIndex} (${
      airQualityIndex < 50
        ? "excellent"
        : airQualityIndex < 75
          ? "good"
          : "moderate"
    }) and a noise level rating of ${noiseLevel}/10. The neighborhood provides excellent access to over ${nearestRestaurants} restaurants and cafes within the vicinity, along with comprehensive amenities including schools, healthcare facilities, and entertainment options. ${
      futureDevelopments.length > 0
        ? `Planned developments in the area include ${futureDevelopments[0].toLowerCase()}, which should further enhance property values and livability.`
        : "The area is well-established with mature infrastructure."
    }`;
  }

  return {
    internetProviders: availableProviders,
    nearestSchools,
    nearestParks,
    nearestMalls,
    nearestHospitals,
    nearestRestaurants,
    safetyRating,
    walkabilityScore,
    noiseLevel,
    airQualityIndex,
    trafficConditions,
    publicTransport: {
      metroStations: nearestMetroStations,
      busStops: nearestBusStops,
    },
    entertainment: {
      cinemas: nearestCinemas,
      sportsFacilities: nearestSports,
    },
    investmentPotentialScore,
    rentalYieldEstimate,
    pricePerSqm,
    areaPricePerSqmAvg,
    futureDevelopments,
    neighborhoodDemographics,
    climateNotes,
    marketPricePrediction: {
      estimatedValue: expectedPrice,
      priceStatus,
      confidence: Math.floor(80 + random(70) * 15),
    },
    areaAnalysis,
  };
}