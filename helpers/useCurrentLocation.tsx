import { useState, useCallback, useEffect } from "react";

interface Location {
  lat: number;
  lng: number;
}

interface UseCurrentLocationResult {
  location: Location | null;
  error: string | null;
  isLoading: boolean;
  requestLocation: () => void;
}

export const useCurrentLocation = (autoRequest: boolean = true): UseCurrentLocationResult => {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      const errorMsg = "Geolocation is not supported by your browser";
      console.error("[useCurrentLocation]", errorMsg);
      setError(errorMsg);
      return;
    }

    console.log("[useCurrentLocation] Requesting geolocation...");
    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("[useCurrentLocation] Location obtained:", {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLoading(false);
      },
      (err) => {
        const errorMsg = err.message || "Unable to retrieve your location";
        console.error("[useCurrentLocation] Geolocation error:", errorMsg);
        setError(errorMsg);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  }, []);

  useEffect(() => {
    if (autoRequest) {
      console.log("[useCurrentLocation] Auto-requesting location on mount");
      requestLocation();
    }
  }, [autoRequest, requestLocation]);

  return { location, error, isLoading, requestLocation };
};