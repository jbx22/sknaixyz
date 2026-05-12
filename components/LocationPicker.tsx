import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { Icon } from "leaflet";
import { useCurrentLocation } from "../helpers/useCurrentLocation";
import { useLanguage } from "../helpers/useLanguage";
import { addPropertyTranslations } from "../helpers/addPropertyTranslations";
import { Button } from "./Button";
import { Input } from "./Input";
import { Crosshair, MapPin, Search } from "lucide-react";
import styles from "./LocationPicker.module.css";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon in Leaflet with React
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix icon issue
const DefaultIcon = new Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationPickerProps {
  latitude: number;
  longitude: number;
  locationName: string;
  onChange: (location: {
    latitude: number;
    longitude: number;
    locationName: string;
  }) => void;
  manualMode?: boolean;
  onManualModeChange?: (enabled: boolean) => void;
}

// Component to handle map clicks
const MapEvents = ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Component to update map view when location changes
const MapUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

export const LocationPicker: React.FC<LocationPickerProps> = ({
  latitude,
  longitude,
  locationName,
  onChange,
  manualMode = false,
  onManualModeChange,
}) => {
  const { language } = useLanguage();
  const t = addPropertyTranslations[language];
  const { location: currentLocation, requestLocation, isLoading: isLocating } = useCurrentLocation();

  // Handle current location request
  useEffect(() => {
    if (currentLocation) {
      const newLocationName = locationName || `${t.nearMe} (${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)})`;
      onChange({
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        locationName: newLocationName,
      });
    }
  }, [currentLocation]);

  const handleMapClick = (lat: number, lng: number) => {
    const newLocationName = locationName || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    onChange({
      latitude: lat,
      longitude: lng,
      locationName: newLocationName,
    });
  };

  const handleLocationNameChange = (newName: string) => {
    onChange({
      latitude,
      longitude,
      locationName: newName,
    });
  };

  const handleLatitudeChange = (newLat: number) => {
    onChange({
      latitude: newLat,
      longitude,
      locationName,
    });
  };

  const handleLongitudeChange = (newLng: number) => {
    onChange({
      latitude,
      longitude: newLng,
      locationName,
    });
  };

  const handleUseCurrentLocation = () => {
    requestLocation();
  };

  const handleToggleManualMode = () => {
    onManualModeChange?.(!manualMode);
  };

  const position: [number, number] = [latitude, longitude];

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <div className={styles.searchBar}>
          <div className={styles.inputWrapper}>
            <Search className={styles.searchIcon} size={18} />
            <Input 
              placeholder={t.searchPlaceholder}
              value={locationName}
              onChange={(e) => handleLocationNameChange(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <Button 
            variant="secondary" 
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className={styles.locationButton}
          >
            <Crosshair size={18} />
            <span className={styles.locationButtonText}>{isLocating ? t.locating : t.useCurrentLocation}</span>
          </Button>
        </div>

        {manualMode && (
          <div className={styles.manualInputs}>
            <div className={styles.coordInput}>
              <label>{t.latitude}</label>
              <Input 
                type="number" 
                value={latitude} 
                onChange={(e) => handleLatitudeChange(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className={styles.coordInput}>
              <label>{t.longitude}</label>
              <Input 
                type="number" 
                value={longitude} 
                onChange={(e) => handleLongitudeChange(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        )}
        
        <button 
          className={styles.toggleMode} 
          onClick={handleToggleManualMode}
        >
          {manualMode ? t.hideManual : t.enterManually}
        </button>
      </div>

      <div className={styles.mapWrapper}>
        <MapContainer
          center={position}
          zoom={13}
          scrollWheelZoom={true}
          className={styles.map}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} icon={DefaultIcon} />
          <MapEvents onLocationSelect={handleMapClick} />
          <MapUpdater center={position} />
        </MapContainer>
        
        <div className={styles.mapOverlay}>
          <div className={styles.coordinatesDisplay}>
            <MapPin size={14} />
            <span>{latitude.toFixed(5)}, {longitude.toFixed(5)}</span>
          </div>
        </div>
      </div>
      
      <div className={styles.helperText}>
        <p>{t.mapHelper}</p>
      </div>
    </div>
  );
};