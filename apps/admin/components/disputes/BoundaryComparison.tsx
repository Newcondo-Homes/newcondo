"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@newcondo/ui/components/card";
import { Button } from "@newcondo/ui/components/button";
import { Badge } from "@newcondo/ui/components/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@newcondo/ui/components/tabs";
import { MapPin, Layers, Maximize2 } from "lucide-react";

interface BoundaryData {
  coordinates: Array<{ lat: number; lng: number }>;
  area: number;
  perimeter: number;
  markedBy?: string;
  markedAt?: string;
}

interface BoundaryComparisonProps {
  originalProperty: {
    id: string;
    title: string;
    address: string;
    boundaryData: BoundaryData;
    images: string[];
  };
  duplicateProperty: {
    id: string;
    title: string;
    address: string;
    boundaryData: BoundaryData;
    images: string[];
  };
  overlapPercentage?: number;
}

export default function BoundaryComparison({
  originalProperty,
  duplicateProperty,
  overlapPercentage = 0,
}: BoundaryComparisonProps) {
  const [selectedView, setSelectedView] = useState<"split" | "overlay">("split");

  const calculateDistance = (coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (coord1.lat * Math.PI) / 180;
    const φ2 = (coord2.lat * Math.PI) / 180;
    const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
    const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const centerOriginal = {
    lat: originalProperty.boundaryData.coordinates.reduce((sum, c) => sum + c.lat, 0) / 
         originalProperty.boundaryData.coordinates.length,
    lng: originalProperty.boundaryData.coordinates.reduce((sum, c) => sum + c.lng, 0) / 
         originalProperty.boundaryData.coordinates.length,
  };

  const centerDuplicate = {
    lat: duplicateProperty.boundaryData.coordinates.reduce((sum, c) => sum + c.lat, 0) / 
         duplicateProperty.boundaryData.coordinates.length,
    lng: duplicateProperty.boundaryData.coordinates.reduce((sum, c) => sum + c.lng, 0) / 
         duplicateProperty.boundaryData.coordinates.length,
  };

  const distanceBetweenCenters = calculateDistance(centerOriginal, centerDuplicate);

  return (
    <div className="space-y-6">
      {/* Comparison Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Overlap Percentage</p>
              <p className="text-3xl font-bold text-red-600">{overlapPercentage.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Distance Between Centers</p>
              <p className="text-2xl font-bold">{distanceBetweenCenters.toFixed(1)}m</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Original Area</p>
              <p className="text-2xl font-bold">{originalProperty.boundaryData.area.toFixed(1)}m²</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Duplicate Area</p>
              <p className="text-2xl font-bold">{duplicateProperty.boundaryData.area.toFixed(1)}m²</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map View Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Boundary Visualization
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={selectedView === "split" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedView("split")}
              >
                Split View
              </Button>
              <Button
                variant={selectedView === "overlay" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedView("overlay")}
              >
                Overlay View
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedView === "split" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Original Property Map */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Original Property</h4>
                  <Badge className="bg-green-100 text-green-800">Original</Badge>
                </div>
                <div className="bg-gray-100 rounded-lg h-[400px] flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapPin className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-sm">Map visualization would appear here</p>
                    <p className="text-xs mt-1">
                      {originalProperty.boundaryData.coordinates.length} boundary points
                    </p>
                  </div>
                </div>
              </div>

              {/* Duplicate Property Map */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Disputed Property</h4>
                  <Badge className="bg-red-100 text-red-800">Disputed</Badge>
                </div>
                <div className="bg-gray-100 rounded-lg h-[400px] flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapPin className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-sm">Map visualization would appear here</p>
                    <p className="text-xs mt-1">
                      {duplicateProperty.boundaryData.coordinates.length} boundary points
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Overlay Comparison</h4>
                <div className="flex gap-2">
                  <Badge className="bg-green-100 text-green-800">Original (Green)</Badge>
                  <Badge className="bg-red-100 text-red-800">Disputed (Red)</Badge>
                </div>
              </div>
              <div className="bg-gray-100 rounded-lg h-[500px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Layers className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-sm">Overlaid map visualization would appear here</p>
                  <p className="text-xs mt-1">Showing both boundaries on the same map</p>
                  <p className="text-xs mt-1 font-semibold text-red-600">
                    {overlapPercentage.toFixed(1)}% overlap detected
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Boundary Details */}
      <Tabs defaultValue="original" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="original">Original Property Details</TabsTrigger>
          <TabsTrigger value="duplicate">Disputed Property Details</TabsTrigger>
        </TabsList>
        
        <TabsContent value="original" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <h4 className="font-medium mb-2">Boundary Coordinates</h4>
                <div className="bg-gray-50 p-3 rounded-lg max-h-[200px] overflow-y-auto">
                  <pre className="text-xs font-mono">
                    {JSON.stringify(originalProperty.boundaryData.coordinates, null, 2)}
                  </pre>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Area</p>
                  <p className="font-medium">{originalProperty.boundaryData.area.toFixed(2)} m²</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Perimeter</p>
                  <p className="font-medium">{originalProperty.boundaryData.perimeter.toFixed(2)} m</p>
                </div>
                {originalProperty.boundaryData.markedBy && (
                  <div>
                    <p className="text-sm text-gray-500">Marked By</p>
                    <p className="font-medium">{originalProperty.boundaryData.markedBy}</p>
                  </div>
                )}
                {originalProperty.boundaryData.markedAt && (
                  <div>
                    <p className="text-sm text-gray-500">Marked On</p>
                    <p className="font-medium">
                      {new Date(originalProperty.boundaryData.markedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="duplicate" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <h4 className="font-medium mb-2">Boundary Coordinates</h4>
                <div className="bg-gray-50 p-3 rounded-lg max-h-[200px] overflow-y-auto">
                  <pre className="text-xs font-mono">
                    {JSON.stringify(duplicateProperty.boundaryData.coordinates, null, 2)}
                  </pre>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Area</p>
                  <p className="font-medium">{duplicateProperty.boundaryData.area.toFixed(2)} m²</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Perimeter</p>
                  <p className="font-medium">{duplicateProperty.boundaryData.perimeter.toFixed(2)} m</p>
                </div>
                {duplicateProperty.boundaryData.markedBy && (
                  <div>
                    <p className="text-sm text-gray-500">Marked By</p>
                    <p className="font-medium">{duplicateProperty.boundaryData.markedBy}</p>
                  </div>
                )}
                {duplicateProperty.boundaryData.markedAt && (
                  <div>
                    <p className="text-sm text-gray-500">Marked On</p>
                    <p className="font-medium">
                      {new Date(duplicateProperty.boundaryData.markedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}