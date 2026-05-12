import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PropertyWithDetails } from "../endpoints/properties/list_GET.schema";
import { PropertyCard } from "./PropertyCard";
import styles from "./PropertiesMap.module.css";

// Fix for default marker icon in React
// See: https://github.com/PaulLeCam/react-leaflet/issues/453
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Helper component to handle map center updates
const MapUpdater = ({ center }: { center: { lat: number; lng: number } }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom());
  }, [center, map]);
  return null;
};

// Custom div icon for price markers
const createPriceIcon = (price: number) => {
  const formattedPrice = new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(price);

  return L.divIcon({
    className: styles.priceMarkerContainer,
    html: `<div class="${styles.priceMarker}">${formattedPrice}</div>`,
    iconSize: [60, 30],
    iconAnchor: [30, 15],
  });
};

// Component to handle map click events
const MapClickHandler = ({ 
  onClick, 
  isAddMode 
}: { 
  onClick: (lat: number, lng: number) => void;
  isAddMode: boolean;
}) => {
  useMapEvents({
    click: (e) => {
      if (isAddMode) {
        onClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

interface PropertiesMapProps {
  properties: PropertyWithDetails[];
  center: { lat: number; lng: number };
  zoom?: number;
  onMapClick?: (lat: number, lng: number) => void;
  isAddMode?: boolean;
}

export const PropertiesMap: React.FC<PropertiesMapProps> = ({
  properties,
  center,
  zoom = 13,
  onMapClick,
  isAddMode = false,
}) => {
  // Add cursor style based on add mode
  const mapClassName = useMemo(() => {
    return `${styles.mapContainer} ${isAddMode ? styles.addModeCursor : ""}`;
  }, [isAddMode]);

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      className={mapClassName}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapUpdater center={center} />
      
      {onMapClick && (
        <MapClickHandler onClick={onMapClick} isAddMode={isAddMode} />
      )}

      {properties.map((property) => {
        // Only render if we have valid coordinates
        if (property.latitude === null || property.longitude === null) return null;

        // Use price marker if price exists, otherwise fallback to default
        const markerIcon = property.price 
          ? createPriceIcon(Number(property.price)) 
          : undefined;

        return (
          <Marker
            key={property.id}
            position={[Number(property.latitude), Number(property.longitude)]}
            icon={markerIcon}
          >
            <Popup className={styles.popup} maxWidth={300} minWidth={280}>
              <div className={styles.popupContent}>
                <PropertyCard property={property} className={styles.popupCard} />
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};