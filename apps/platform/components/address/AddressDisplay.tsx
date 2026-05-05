"use client";

import { MapPin } from "lucide-react";
import { Card, CardContent } from "@newcondo/ui";
import { Badge } from "@newcondo/ui";

interface HierarchicalAddress {
  state: string;
  lga: string;
  location: string;
  streetAddress?: string;
}

interface AddressDisplayProps {
  address: HierarchicalAddress | string;
  showIcon?: boolean;
  variant?: "default" | "compact" | "detailed";
  className?: string;
}

export function AddressDisplay({
  address,
  showIcon = true,
  variant = "default",
  className = "",
}: AddressDisplayProps) {
  // Handle string address (legacy format)
  if (typeof address === "string") {
    return (
      <div className={`flex items-start gap-2 ${className}`}>
        {showIcon && <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />}
        <span className="text-sm text-muted-foreground">{address}</span>
      </div>
    );
  }

  // Format hierarchical address
  const formatFullAddress = (addr: HierarchicalAddress): string => {
    const parts = [
      addr.streetAddress,
      addr.location,
      addr.lga,
      addr.state,
    ].filter(Boolean);
    return parts.join(", ");
  };

  const formatCompactAddress = (addr: HierarchicalAddress): string => {
    return `${addr.location}, ${addr.lga}, ${addr.state}`;
  };

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showIcon && <MapPin className="h-4 w-4 text-muted-foreground" />}
        <span className="text-sm text-muted-foreground">
          {formatCompactAddress(address)}
        </span>
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-2">Property Location</h4>
                
                <div className="space-y-2">
                  {address.streetAddress && (
                    <div>
                      <span className="text-xs text-muted-foreground">Street Address</span>
                      <p className="text-sm font-medium">{address.streetAddress}</p>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {address.location}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {address.lga}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {address.state}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Full Address: {formatFullAddress(address)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <div className={`flex items-start gap-2 ${className}`}>
      {showIcon && <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />}
      <div className="flex-1">
        <p className="text-sm font-medium">{formatFullAddress(address)}</p>
        <div className="flex flex-wrap gap-1 mt-1">
          <Badge variant="secondary" className="text-xs">
            {address.state}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {address.lga}
          </Badge>
        </div>
      </div>
    </div>
  );
}

// Utility function to parse address from different formats
export function parseAddress(address: unknown): HierarchicalAddress | string {
  if (typeof address === "string") {
    return address;
  }

  if (
    address &&
    typeof address === "object" &&
    "state" in address &&
    "lga" in address &&
    "location" in address
  ) {
    return address as HierarchicalAddress;
  }

  // Fallback to string representation
  return JSON.stringify(address);
}

// Export the type for use in other components
export type { HierarchicalAddress };