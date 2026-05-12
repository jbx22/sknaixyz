import { schema, OutputType } from "./manifest_GET.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  // Manifest is a static JSON file, so we don't strictly need to parse input, 
  // but following the framework pattern is good practice.
  // Since this is a GET request without body, we don't parse body.
  
  const manifest = {
    name: "SKNAI",
    short_name: "SKNAI",
    description: "The most modern, beautiful, and intuitive AI-powered real-estate platform in Saudi Arabia. | منصة عقارية ذكية وحديثة في المملكة العربية السعودية",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#007cff",
    orientation: "portrait-primary",
    scope: "/",
    lang: "ar",
    dir: "rtl",
    icons: [
      {
        src: "/_api/icon-192",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any maskable"
      },
      {
        src: "/_api/icon-512",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any maskable"
      }
    ],
    shortcuts: [
      {
        name: "Search Properties",
        short_name: "Search",
        description: "Browse available properties",
        url: "/properties",
        icons: [{ src: "/_api/icon-192", sizes: "192x192" }]
      },
      {
        name: "View Map",
        short_name: "Map",
        description: "Explore properties on map",
        url: "/map",
        icons: [{ src: "/_api/icon-192", sizes: "192x192" }]
      },
      {
        name: "Add Property",
        short_name: "Add",
        description: "List a new property",
        url: "/add-property",
        icons: [{ src: "/_api/icon-192", sizes: "192x192" }]
      },
      {
        name: "ابحث عن العقارات",
        short_name: "بحث",
        description: "تصفح العقارات المتاحة",
        url: "/properties",
        icons: [{ src: "/_api/icon-192", sizes: "192x192" }]
      },
      {
        name: "عرض الخريطة",
        short_name: "خريطة",
        description: "استكشف العقارات على الخريطة",
        url: "/map",
        icons: [{ src: "/_api/icon-192", sizes: "192x192" }]
      },
      {
        name: "إضافة عقار",
        short_name: "إضافة",
        description: "قائمة عقار جديد",
        url: "/add-property",
        icons: [{ src: "/_api/icon-192", sizes: "192x192" }]
      }
    ]
  };

  // We return a standard JSON response but with the specific content type for manifests
  return new Response(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
      // Cache for a short duration to allow updates
      "Cache-Control": "public, max-age=3600" 
    }
  });
}