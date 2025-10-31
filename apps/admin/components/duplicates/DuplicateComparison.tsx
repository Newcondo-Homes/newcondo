"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Home, DollarSign, Calendar, User } from "lucide-react";

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  address: string;
  city: string;
  state: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  area: string;
  owner: {
    name: string;
    email: string;
    phone: string;
  };
  createdAt: Date;
  images: string[];
  gpsCoordinates?: {
    lat: number;
    lng: number;
  };
}

interface DuplicateComparisonProps {
  originalProperty: Property;
  duplicateProperty: Property;
  matchScore: number;
}

export default function DuplicateComparison({
  originalProperty,
  duplicateProperty,
  matchScore,
}: DuplicateComparisonProps) {
  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const getMatchIndicator = (val1: any, val2: any) => {
    const isMatch = JSON.stringify(val1) === JSON.stringify(val2);
    return isMatch ? (
      <Badge className="bg-red-500 text-xs">Exact Match</Badge>
    ) : (
      <Badge variant="outline" className="text-xs">Different</Badge>
    );
  };

  const ComparisonRow = ({
    label,
    original,
    duplicate,
    showMatch = true,
  }: {
    label: string;
    original: any;
    duplicate: any;
    showMatch?: boolean;
  }) => (
    <div className="grid grid-cols-3 gap-4 py-3 border-b last:border-b-0">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="text-sm">{original}</div>
      <div className="flex items-center justify-between">
        <span className="text-sm">{duplicate}</span>
        {showMatch && getMatchIndicator(original, duplicate)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Match Score Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Duplicate Match Analysis</span>
            <Badge
              className={
                matchScore >= 90
                  ? "bg-red-500"
                  : matchScore >= 75
                  ? "bg-orange-500"
                  : "bg-yellow-500"
              }
            >
              {matchScore}% Match
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            These properties have been flagged as potential duplicates. Review the comparison
            below to determine if they represent the same property.
          </p>
        </CardContent>
      </Card>

      {/* Side-by-side Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original Property Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="h-5 w-5" />
              Original Property
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {originalProperty.images[0] && (
                <img
                  src={originalProperty.images[0]}
                  alt={originalProperty.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              <div>
                <h3 className="font-semibold">{originalProperty.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {originalProperty.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Duplicate Property Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="h-5 w-5 text-orange-500" />
              Potential Duplicate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {duplicateProperty.images[0] && (
                <img
                  src={duplicateProperty.images[0]}
                  alt={duplicateProperty.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              <div>
                <h3 className="font-semibold">{duplicateProperty.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {duplicateProperty.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            <div className="grid grid-cols-3 gap-4 pb-3 border-b font-semibold text-sm">
              <div>Field</div>
              <div>Original</div>
              <div>Duplicate</div>
            </div>

            <ComparisonRow
              label="Price"
              original={formatCurrency(originalProperty.price)}
              duplicate={formatCurrency(duplicateProperty.price)}
            />

            <ComparisonRow
              label="Address"
              original={originalProperty.address}
              duplicate={duplicateProperty.address}
            />

            <ComparisonRow
              label="City"
              original={originalProperty.city}
              duplicate={duplicateProperty.city}
            />

            <ComparisonRow
              label="State"
              original={originalProperty.state}
              duplicate={duplicateProperty.state}
            />

            <ComparisonRow
              label="Property Type"
              original={originalProperty.propertyType}
              duplicate={duplicateProperty.propertyType}
            />

            <ComparisonRow
              label="Bedrooms"
              original={originalProperty.bedrooms}
              duplicate={duplicateProperty.bedrooms}
            />

            <ComparisonRow
              label="Bathrooms"
              original={originalProperty.bathrooms}
              duplicate={duplicateProperty.bathrooms}
            />

            <ComparisonRow
              label="Area"
              original={originalProperty.area}
              duplicate={duplicateProperty.area}
            />

            <ComparisonRow
              label="Owner Name"
              original={originalProperty.owner.name}
              duplicate={duplicateProperty.owner.name}
            />

            <ComparisonRow
              label="Owner Email"
              original={originalProperty.owner.email}
              duplicate={duplicateProperty.owner.email}
              showMatch={false}
            />

            <ComparisonRow
              label="Owner Phone"
              original={originalProperty.owner.phone}
              duplicate={duplicateProperty.owner.phone}
              showMatch={false}
            />

            {originalProperty.gpsCoordinates && duplicateProperty.gpsCoordinates && (
              <ComparisonRow
                label="GPS Coordinates"
                original={`${originalProperty.gpsCoordinates.lat}, ${originalProperty.gpsCoordinates.lng}`}
                duplicate={`${duplicateProperty.gpsCoordinates.lat}, ${duplicateProperty.gpsCoordinates.lng}`}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* GPS Distance Alert */}
      {originalProperty.gpsCoordinates && duplicateProperty.gpsCoordinates && (
        <Card className="border-red-500">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-500">GPS Proximity Alert</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  These properties are within{" "}
                  <span className="font-semibold">50 meters</span> of each other,
                  strongly suggesting they are the same property.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}