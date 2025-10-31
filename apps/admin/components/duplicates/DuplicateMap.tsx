"use client";

import { useEffect, useRef, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker, Circle, InfoWindow } from "@react-google-maps/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface PropertyLocation {
  id: string;
  title: string;
  lat: number;
  lng: number;
  isOriginal: boolean;
}

interface DuplicateMapProps {
  originalProperty: PropertyLocation;
  duplicateProperty: PropertyLocation;
}

const mapContainerStyle = {
  width: "100%",
  height: "500px",
};

export default function DuplicateMap({
  originalProperty,
  duplicateProperty,
}: DuplicateMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  // Calculate center point between the two properties
  const center = {
    lat: (originalProperty.lat + duplicateProperty.lat) / 2,
    lng: (originalProperty.lng + duplicateProperty.lng) / 2,
  };

  // Calculate distance between properties (in meters)
  const calculateDistance = () => {
    if (!isLoaded) return 0;
    
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (originalProperty.lat * Math.PI) / 180;
    const φ2 = (duplicateProperty.lat * Math.PI) / 180;
    const Δφ = ((duplicateProperty.lat - originalProperty.lat) * Math.PI) / 180;
    const Δλ = ((duplicateProperty.lng - originalProperty.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const distance = calculateDistance();

  const onLoad = (map: google.maps.Map) => {
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend({ lat: originalProperty.lat, lng: originalProperty.lng });
    bounds.extend({ lat: duplicateProperty.lat, lng: duplicateProperty.lng });
    map.fitBounds(bounds);
    setMap(map);
  };

  const onUnmount = () => {
    setMap(null);
  };

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="h-[500px] flex items-center justify-center">
          <p className="text-muted-foreground">Loading map...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Distance Alert */}
      <Card className={distance < 100 ? "border-red-500" : "border-yellow-500"}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle
              className={`h-5 w-5 mt-0.5 ${
                distance < 100 ? "text-red-500" : "text-yellow-500"
              }`}
            />
            <div>
              <h4
                className={`font-semibold ${
                  distance < 100 ? "text-red-500" : "text-yellow-500"
                }`}
              >
                {distance < 100 ? "High Duplicate Probability" : "Potential Duplicate"}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Properties are{" "}
                <span className="font-semibold">
                  {distance < 1000
                    ? `${distance.toFixed(0)} meters`
                    : `${(distance / 1000).toFixed(2)} km`}
                </span>{" "}
                apart
                {distance < 50 &&
                  " - This proximity strongly suggests they are the same property."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardContent className="p-0">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={15}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
              mapTypeId: "satellite",
              streetViewControl: true,
              fullscreenControl: true,
            }}
          >
            {/* Original Property Marker */}
            <Marker
              position={{ lat: originalProperty.lat, lng: originalProperty.lng }}
              icon={{
                url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                scaledSize: new window.google.maps.Size(40, 40),
              }}
              onClick={() => setSelectedMarker(originalProperty.id)}
            />

            {/* Duplicate Property Marker */}
            <Marker
              position={{ lat: duplicateProperty.lat, lng: duplicateProperty.lng }}
              icon={{
                url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                scaledSize: new window.google.maps.Size(40, 40),
              }}
              onClick={() => setSelectedMarker(duplicateProperty.id)}
            />

            {/* Radius circle around original property */}
            <Circle
              center={{ lat: originalProperty.lat, lng: originalProperty.lng }}
              radius={100}
              options={{
                fillColor: "#3b82f6",
                fillOpacity: 0.1,
                strokeColor: "#3b82f6",
                strokeOpacity: 0.5,
                strokeWeight: 2,
              }}
            />

            {/* Info Windows */}
            {selectedMarker === originalProperty.id && (
              <InfoWindow
                position={{ lat: originalProperty.lat, lng: originalProperty.lng }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-2">
                  <Badge className="bg-blue-500 mb-2">Original Property</Badge>
                  <h4 className="font-semibold text-sm">{originalProperty.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {originalProperty.lat.toFixed(6)}, {originalProperty.lng.toFixed(6)}
                  </p>
                </div>
              </InfoWindow>
            )}

            {selectedMarker === duplicateProperty.id && (
              <InfoWindow
                position={{ lat: duplicateProperty.lat, lng: duplicateProperty.lng }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-2">
                  <Badge className="bg-red-500 mb-2">Potential Duplicate</Badge>
                  <h4 className="font-semibold text-sm">{duplicateProperty.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {duplicateProperty.lat.toFixed(6)}, {duplicateProperty.lng.toFixed(6)}
                  </p>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span className="text-sm">Original Property</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-sm">Potential Duplicate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-blue-500 bg-transparent"></div>
              <span className="text-sm">100m Detection Radius</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}