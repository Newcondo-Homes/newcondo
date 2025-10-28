"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@newcondo/ui/components/card";
import { Button } from "@newcondo/ui/components/button";
import { Badge } from "@newcondo/ui/components/badge";
import { Textarea } from "@newcondo/ui/components/textarea";
import { Separator } from "@newcondo/ui/components/separator";
import { Alert, AlertDescription } from "@newcondo/ui/components/alert";
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  MapPin, 
  User, 
  Phone, 
  Mail,
  Building2,
  Calendar,
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import { GoogleMap, Polygon, useJsApiLoader } from "@react-google-maps/api";
import Image from "next/image";

interface DuplicateDetails {
  id: string;
  originalPropertyId: string;
  duplicatePropertyId: string;
  reportedBy: string | null;
  status: "PENDING" | "CONFIRMED_DUPLICATE" | "NOT_DUPLICATE" | "RESOLVED";
  resolution: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  originalProperty: {
    id: string;
    title: string;
    description: string;
    address: string;
    city: string;
    state: string;
    price: number;
    gpsCoordinates: string;
    boundaryCoordinates: any;
    boundaryImages: string[];
    owner: {
      id: string;
      name: string;
      email: string;
      phone: string;
    };
    images: Array<{
      url: string;
      isPrimary: boolean;
    }>;
  };
  duplicateProperty: {
    id: string;
    title: string;
    description: string;
    address: string;
    city: string;
    state: string;
    price: number;
    gpsCoordinates: string;
    boundaryCoordinates: any;
    boundaryImages: string[];
    owner: {
      id: string;
      name: string;
      email: string;
      phone: string;
    };
    images: Array<{
      url: string;
      isPrimary: boolean;
    }>;
  };
  reporter?: {
    name: string;
    email: string;
  };
}

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

export default function DuplicateDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const duplicateId = params.id as string;
  
  const [duplicate, setDuplicate] = useState<DuplicateDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  useEffect(() => {
    fetchDuplicateDetails();
  }, [duplicateId]);

  const fetchDuplicateDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/duplicates/${duplicateId}`);
      if (!res.ok) throw new Error("Failed to fetch duplicate details");
      const data = await res.json();
      setDuplicate(data);
    } catch (err) {
      console.error("Error fetching duplicate details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (action: "CONFIRMED_DUPLICATE" | "NOT_DUPLICATE" | "RESOLVED") => {
    if (!resolutionNotes.trim() && action !== "NOT_DUPLICATE") {
      alert("Please provide resolution notes");
      return;
    }

    try {
      setProcessing(true);
      const res = await fetch(`/api/admin/duplicates/${duplicateId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          resolution: resolutionNotes,
        }),
      });

      if (!res.ok) throw new Error("Failed to resolve duplicate");
      
      alert("Duplicate report resolved successfully");
      router.push("/duplicates");
    } catch (err) {
      console.error("Error resolving duplicate:", err);
      alert("Failed to resolve duplicate report");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!duplicate) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Duplicate report not found</p>
      </div>
    );
  }

  const originalCoords = duplicate.originalProperty.gpsCoordinates 
    ? JSON.parse(duplicate.originalProperty.gpsCoordinates) 
    : null;
  const duplicateCoords = duplicate.duplicateProperty.gpsCoordinates 
    ? JSON.parse(duplicate.duplicateProperty.gpsCoordinates) 
    : null;

  const mapCenter = originalCoords || { lat: 6.5244, lng: 3.3792 };

  const originalBoundary = duplicate.originalProperty.boundaryCoordinates 
    ? JSON.parse(JSON.stringify(duplicate.originalProperty.boundaryCoordinates))
    : null;
  const duplicateBoundary = duplicate.duplicateProperty.boundaryCoordinates 
    ? JSON.parse(JSON.stringify(duplicate.duplicateProperty.boundaryCoordinates))
    : null;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Duplicate Report Details</h1>
            <p className="text-muted-foreground">
              Review and resolve duplicate property listing
            </p>
          </div>
        </div>
        <Badge variant={
          duplicate.status === "PENDING" ? "outline" :
          duplicate.status === "CONFIRMED_DUPLICATE" ? "destructive" :
          duplicate.status === "RESOLVED" ? "default" : "secondary"
        }>
          {duplicate.status.replace("_", " ")}
        </Badge>
      </div>

      {/* Alert for pending resolution */}
      {duplicate.status === "PENDING" && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This duplicate report requires your review. Compare both properties and determine if they are indeed duplicates.
          </AlertDescription>
        </Alert>
      )}

      {/* Map Comparison */}
      {isLoaded && (originalCoords || duplicateCoords) && (
        <Card>
          <CardHeader>
            <CardTitle>Location & Boundary Comparison</CardTitle>
            <CardDescription>
              Visual comparison of property boundaries and locations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={18}
              mapTypeId="satellite"
            >
              {originalBoundary && (
                <Polygon
                  paths={originalBoundary}
                  options={{
                    fillColor: "#3b82f6",
                    fillOpacity: 0.35,
                    strokeColor: "#3b82f6",
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                  }}
                />
              )}
              {duplicateBoundary && (
                <Polygon
                  paths={duplicateBoundary}
                  options={{
                    fillColor: "#ef4444",
                    fillOpacity: 0.35,
                    strokeColor: "#ef4444",
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                  }}
                />
              )}
            </GoogleMap>
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm">Original Property</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm">Reported Duplicate</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Properties Comparison */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Original Property */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              Original Property
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{duplicate.originalProperty.title}</h3>
              <p className="text-muted-foreground">{duplicate.originalProperty.description}</p>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm">{duplicate.originalProperty.address}</p>
                  <p className="text-sm text-muted-foreground">
                    {duplicate.originalProperty.city}, {duplicate.originalProperty.state}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{duplicate.originalProperty.owner.name}</p>
                  <p className="text-xs text-muted-foreground">{duplicate.originalProperty.owner.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">{duplicate.originalProperty.owner.phone}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium mb-2">Price</p>
              <p className="text-2xl font-bold">₦{duplicate.originalProperty.price.toLocaleString()}</p>
            </div>

            {duplicate.originalProperty.images.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Property Images</p>
                <div className="grid grid-cols-2 gap-2">
                  {duplicate.originalProperty.images.slice(0, 4).map((img, idx) => (
                    <div key={idx} className="relative aspect-video rounded-md overflow-hidden">
                      <Image
                        src={img.url}
                        alt="Property"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button variant="outline" className="w-full" asChild>
              <a href={`/properties/${duplicate.originalProperty.id}`} target="_blank">
                View Full Details
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Duplicate Property */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Reported Duplicate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{duplicate.duplicateProperty.title}</h3>
              <p className="text-muted-foreground">{duplicate.duplicateProperty.description}</p>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm">{duplicate.duplicateProperty.address}</p>
                  <p className="text-sm text-muted-foreground">
                    {duplicate.duplicateProperty.city}, {duplicate.duplicateProperty.state}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{duplicate.duplicateProperty.owner.name}</p>
                  <p className="text-xs text-muted-foreground">{duplicate.duplicateProperty.owner.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">{duplicate.duplicateProperty.owner.phone}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium mb-2">Price</p>
              <p className="text-2xl font-bold">₦{duplicate.duplicateProperty.price.toLocaleString()}</p>
            </div>

            {duplicate.duplicateProperty.images.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Property Images</p>
                <div className="grid grid-cols-2 gap-2">
                  {duplicate.duplicateProperty.images.slice(0, 4).map((img, idx) => (
                    <div key={idx} className="relative aspect-video rounded-md overflow-hidden">
                      <Image
                        src={img.url}
                        alt="Property"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button variant="outline" className="w-full" asChild>
              <a href={`/properties/${duplicate.duplicateProperty.id}`} target="_blank">
                View Full Details
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Report Information */}
      <Card>
        <CardHeader>
          <CardTitle>Report Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Reported On</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <p className="font-medium">
                  {new Date(duplicate.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            {duplicate.reporter && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Reported By</p>
                <div>
                  <p className="font-medium">{duplicate.reporter.name}</p>
                  <p className="text-sm text-muted-foreground">{duplicate.reporter.email}</p>
                </div>
              </div>
            )}
          </div>

          {duplicate.resolution && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Resolution Notes</p>
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm">{duplicate.resolution}</p>
              </div>
            </div>
          )}

          {duplicate.resolvedBy && duplicate.resolvedAt && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Resolved By</p>
                <p className="font-medium">{duplicate.resolvedBy}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Resolved On</p>
                <p className="font-medium">
                  {new Date(duplicate.resolvedAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolution Actions */}
      {duplicate.status === "PENDING" && (
        <Card>
          <CardHeader>
            <CardTitle>Resolve Duplicate Report</CardTitle>
            <CardDescription>
              Take action on this duplicate report. Provide detailed notes for your decision.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Resolution Notes <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Provide detailed notes about your decision..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={4}
                className="w-full"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="destructive"
                onClick={() => handleResolve("CONFIRMED_DUPLICATE")}
                disabled={processing}
                className="flex-1"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Confirm Duplicate
              </Button>
              <Button
                variant="outline"
                onClick={() => handleResolve("NOT_DUPLICATE")}
                disabled={processing}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Not a Duplicate
              </Button>
              <Button
                variant="default"
                onClick={() => handleResolve("RESOLVED")}
                disabled={processing}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Resolved
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
