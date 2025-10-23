// apps/platform/components/shared/ProximityBadge.tsx
"use client";

import { MapPin, Navigation, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProximityBadgeProps {
  distance: number; // Distance in kilometers
  showIcon?: boolean;
  showUnit?: boolean;
  variant?: "default" | "compact" | "detailed";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ProximityBadge({
  distance,
  showIcon = true,
  showUnit = true,
  variant = "default",
  size = "md",
  className,
}: ProximityBadgeProps) {
  const formatDistance = (): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    if (distance < 10) {
      return `${distance.toFixed(1)}km`;
    }
    return `${Math.round(distance)}km`;
  };

  const getProximityLevel = (): {
    level: "near" | "moderate" | "far";
    label: string;
    color: string;
  } => {
    if (distance < 5) {
      return {
        level: "near",
        label: "Very Close",
        color: "text-green-700 bg-green-50 border-green-200",
      };
    }
    if (distance < 15) {
      return {
        level: "moderate",
        label: "Nearby",
        color: "text-blue-700 bg-blue-50 border-blue-200",
      };
    }
    return {
      level: "far",
      label: "Far",
      color: "text-orange-700 bg-orange-50 border-orange-200",
    };
  };

  const proximity = getProximityLevel();

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  if (variant === "compact") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 font-medium",
          proximity.level === "near" && "text-green-600",
          proximity.level === "moderate" && "text-blue-600",
          proximity.level === "far" && "text-orange-600",
          className
        )}
      >
        {showIcon && <MapPin className="h-3 w-3" />}
        {formatDistance()}
      </span>
    );
  }

  if (variant === "detailed") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border",
          proximity.color,
          sizeClasses[size],
          className
        )}
      >
        {showIcon && <Navigation className="h-4 w-4" />}
        <div className="flex flex-col">
          <span className="font-semibold">{formatDistance()}</span>
          <span className="text-xs opacity-75">{proximity.label}</span>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border font-medium",
        proximity.color,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <MapPin className="h-4 w-4" />}
      <span>{formatDistance()}</span>
      {showUnit && distance >= 1 && (
        <span className="text-xs opacity-75">away</span>
      )}
    </div>
  );
}

// Distance with direction indicator
export function DirectionalProximity({
  distance,
  bearing,
  className,
}: {
  distance: number;
  bearing?: number; // 0-360 degrees
  className?: string;
}) {
  const getDirection = (deg: number): string => {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  };

  const formatDistance = (): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg",
        "bg-blue-50 text-blue-700 border border-blue-200",
        className
      )}
    >
      <Navigation
        className="h-4 w-4"
        style={
          bearing !== undefined
            ? { transform: `rotate(${bearing}deg)` }
            : undefined
        }
      />
      <span className="font-medium">{formatDistance()}</span>
      {bearing !== undefined && (
        <span className="text-xs opacity-75">{getDirection(bearing)}</span>
      )}
    </div>
  );
}

// Proximity alert for jobs that are too far
export function ProximityAlert({
  distance,
  maxDistance = 20,
  className,
}: {
  distance: number;
  maxDistance?: number;
  className?: string;
}) {
  if (distance <= maxDistance) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-start gap-2 p-3 rounded-lg",
        "bg-yellow-50 border border-yellow-200",
        className
      )}
    >
      <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-yellow-800">
          Property is far from your location
        </p>
        <p className="text-xs text-yellow-700 mt-1">
          This property is {distance.toFixed(1)}km away. Consider the travel
          time before accepting.
        </p>
      </div>
    </div>
  );
}

// Service area indicator
export function ServiceAreaBadge({
  isInServiceArea,
  distance,
  size = "md",
  className,
}: {
  isInServiceArea: boolean;
  distance?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  if (isInServiceArea) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border font-medium",
          "bg-green-50 text-green-700 border-green-200",
          sizeClasses[size],
          className
        )}
      >
        <MapPin className="h-4 w-4" />
        <span>In Your Service Area</span>
        {distance !== undefined && (
          <span className="text-xs opacity-75">
            ({distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`})
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border font-medium",
        "bg-gray-50 text-gray-600 border-gray-200",
        sizeClasses[size],
        className
      )}
    >
      <MapPin className="h-4 w-4" />
      <span>Outside Service Area</span>
      {distance !== undefined && (
        <span className="text-xs opacity-75">
          ({distance.toFixed(1)}km away)
        </span>
      )}
    </div>
  );
}

// Proximity list item for multiple locations
export function ProximityListItem({
  location,
  distance,
  address,
  onClick,
  className,
}: {
  location: string;
  distance: number;
  address?: string;
  onClick?: () => void;
  className?: string;
}) {
  const proximity = distance < 5 ? "near" : distance < 15 ? "moderate" : "far";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between p-3 rounded-lg",
        "border border-gray-200 hover:border-gray-300",
        "bg-white hover:bg-gray-50 transition-colors",
        "text-left",
        className
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{location}</p>
        {address && (
          <p className="text-sm text-gray-500 truncate mt-0.5">{address}</p>
        )}
      </div>
      <ProximityBadge
        distance={distance}
        variant="compact"
        size="sm"
        className="ml-3 flex-shrink-0"
      />
    </button>
  );
}