import React, { useEffect, useState } from "react";
import { AppHeader } from "../components/AppHeader";
import { BottomNav } from "../components/BottomNav";
import { usePropertiesQuery } from "../helpers/usePropertiesQuery";
import { useCurrentLocation } from "../helpers/useCurrentLocation";
import { useLanguage } from "../helpers/useLanguage";
import { Button } from "../components/Button";
import { Navigation, Plus, X } from "lucide-react";
import { PropertiesMap } from "../components/PropertiesMap";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "../components/Sheet";
import { PropertyCreationForm } from "../components/PropertyCreationForm";
import styles from "./map.module.css";

export default function MapPage() {
  // Default to Riyadh
  const defaultCenter = { lat: 24.7136, lng: 46.6753 };
  const { language } = useLanguage();
  const { location, requestLocation, isLoading: isLocating } = useCurrentLocation();
  const [center, setCenter] = useState(defaultCenter);
  const [isAddMode, setIsAddMode] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [zoom, setZoom] = useState(13);
  
  // Fetch all properties for the map
  const { data, refetch } = usePropertiesQuery({ page: 1, pageSize: 100 });

  // Update map center and zoom when user location is obtained
  useEffect(() => {
    if (location) {
      console.log("[MapPage] User location obtained, centering map:", location);
      setCenter(location);
      setZoom(14); // Zoom in to show user's neighborhood
    }
  }, [location]);

  const handleMapClick = (lat: number, lng: number) => {
    if (isAddMode) {
      console.log("Map clicked in add mode:", { lat, lng });
      setSelectedLocation({ lat, lng });
      setIsFormOpen(true);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setIsAddMode(false);
    setSelectedLocation(null);
    refetch();
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setSelectedLocation(null);
  };

  const toggleAddMode = () => {
    setIsAddMode(!isAddMode);
    if (isAddMode) {
      setSelectedLocation(null);
    }
  };

  const t = {
    clickToAdd: language === "ar" ? "انقر على الخريطة لإضافة عقار" : "Click on the map to add a property",
    centerMap: language === "ar" ? "توسط الخريطة على موقعي" : "Center map on my location",
    addProperty: language === "ar" ? "إضافة عقار" : "Add property",
    cancelAdd: language === "ar" ? "إلغاء الإضافة" : "Cancel adding property",
    addNewTitle: language === "ar" ? "إضافة عقار جديد" : "Add New Property",
    addNewDesc: language === "ar" ? "املأ التفاصيل لإنشاء قائمة عقارية جديدة" : "Fill in the details to create a new property listing",
  };

  return (
    <div className={styles.container}>
      <AppHeader showNavLinks={false} />

      {isAddMode && (
        <div className={styles.addModeOverlay}>
          <div className={styles.addModeInstruction}>
            {t.clickToAdd}
          </div>
        </div>
      )}

      <div className={styles.mapContainer}>
        <PropertiesMap 
          properties={data?.properties || []} 
          center={center}
          zoom={zoom}
          onMapClick={handleMapClick}
          isAddMode={isAddMode}
        />
      </div>

      <Button
        className={styles.locationButton}
        size="icon-lg"
        variant="secondary"
        onClick={requestLocation}
        disabled={isLocating}
        aria-label={t.centerMap}
      >
        <Navigation size={24} className={isLocating ? styles.spinning : ""} />
      </Button>

      <Button
        className={styles.addButton}
        size="icon-lg"
        onClick={toggleAddMode}
        aria-label={isAddMode ? t.cancelAdd : t.addProperty}
      >
        {isAddMode ? <X size={24} /> : <Plus size={24} />}
      </Button>

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>{t.addNewTitle}</SheetTitle>
            <SheetDescription>
              {t.addNewDesc}
            </SheetDescription>
          </SheetHeader>
          {selectedLocation && (
            <PropertyCreationForm
              latitude={selectedLocation.lat}
              longitude={selectedLocation.lng}
              locationName=""
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          )}
        </SheetContent>
      </Sheet>

      <BottomNav />
    </div>
  );
}