// apps/platform/components/property/property-details.tsx
"use client";

import { useState } from "react";
import { Property, PropertyImage, PropertyUnit, User } from "@newcondo/db";
import { Card, CardContent, CardHeader, CardTitle } from "@newcondo/ui/";
import { Badge } from "@newcondo/ui/";
import { Button } from "@newcondo/ui/";
import { Avatar, AvatarFallback, AvatarImage } from "@newcondo/ui/";
import { Separator } from "@newcondo/ui/";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@newcondo/ui/";
import { 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  User as UserIcon, 
  Phone, 
  Mail,
  Calendar,
  Heart,
  Share2,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Building,
  Home,
  Car,
  Zap,
  Shield,
  Wifi,
  Tv,
  AirVent,
  Waves,
  TreePine,
  Dumbbell,
  ShoppingCart,
  School,
  Hospital,
  Bus,
  Star,
  MapIcon,
  Eye,
  Users
} from "lucide-react";
import { GoogleMap, useJsApiLoader, Polygon, Marker } from "@react-google-maps/api";
import { formatCurrency } from "@/lib/utils/format";
import { PropertyStatus, PropertyType, PropertyStructure } from "@newcondo/db";

interface PropertyDetailsProps {
  property: Property & {
    images: PropertyImage[];
    owner: User;
    agent?: User;
    units?: PropertyUnit[];
    _count?: {
      rentals: number;
      duplicateReports: number;
    };
  };
  onRentClick?: () => void;
  onContactClick?: () => void;
  onReportDuplicate?: () => void;
  onMarkBoundary?: () => void;
  userRole?: string;
}

const libraries: ("places" | "geometry" | "drawing")[] = ["places", "geometry"];

const mapContainerStyle = {
  width: "100%",
  height: "400px",
  borderRadius: "8px"
};

const PropertyDetails: React.FC<PropertyDetailsProps> = ({
  property,
  onRentClick,
  onContactClick,
  onReportDuplicate,
  onMarkBoundary,
  userRole
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedUnit, setSelectedUnit] = useState<PropertyUnit | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
  });

  // Parse GPS coordinates
  const getCoordinates = () => {
    if (!property.gpsCoordinates) return null;
    try {
      const coords = JSON.parse(property.gpsCoordinates);
      return { lat: coords.lat, lng: coords.lng };
    } catch {
      return null;
    }
  };

  // Parse boundary coordinates
  const getBoundaryCoordinates = () => {
    if (!property.boundaryCoordinates) return null;
    try {
      const boundary = property.boundaryCoordinates as any;
      return boundary.coordinates?.[0]?.map((coord: number[]) => ({
        lat: coord[1],
        lng: coord[0]
      }));
    } catch {
      return null;
    }
  };

  const coordinates = getCoordinates();
  const boundaryCoords = getBoundaryCoordinates();

  const mapCenter = coordinates || { lat: 6.5244, lng: 3.3792 }; // Default to Lagos

  const getPropertyTypeIcon = (type: PropertyType) => {
    switch (type) {
      case PropertyType.APARTMENT:
        return <Building className="w-4 h-4" />;
      case PropertyType.HOUSE:
        return <Home className="w-4 h-4" />;
      case PropertyType.DUPLEX:
        return <Building className="w-4 h-4" />;
      case PropertyType.ROOM:
        return <Home className="w-4 h-4" />;
      case PropertyType.OFFICE:
        return <Building className="w-4 h-4" />;
      case PropertyType.SHOP:
        return <ShoppingCart className="w-4 h-4" />;
      case PropertyType.WAREHOUSE:
        return <Building className="w-4 h-4" />;
      default:
        return <Home className="w-4 h-4" />;
    }
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature.toLowerCase()) {
      case "parking":
        return <Car className="w-4 h-4" />;
      case "generator":
        return <Zap className="w-4 h-4" />;
      case "security":
        return <Shield className="w-4 h-4" />;
      case "wifi":
        return <Wifi className="w-4 h-4" />;
      case "cable tv":
        return <Tv className="w-4 h-4" />;
      case "air conditioning":
        return <AirVent className="w-4 h-4" />;
      case "swimming pool":
        return <Waves className="w-4 h-4" />;
      case "garden":
        return <TreePine className="w-4 h-4" />;
      case "gym":
        return <Dumbbell className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: PropertyStatus) => {
    switch (status) {
      case PropertyStatus.PUBLISHED:
        return <Badge variant="default" className="bg-green-100 text-green-800">Available</Badge>;
      case PropertyStatus.RENTED:
        return <Badge variant="destructive">Rented</Badge>;
      case PropertyStatus.DRAFT:
        return <Badge variant="outline">Draft</Badge>;
      case PropertyStatus.PENDING:
        return <Badge variant="secondary">Pending Approval</Badge>;
      case PropertyStatus.UNAVAILABLE:
        return <Badge variant="outline" className="bg-gray-100">Unavailable</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const primaryImage = property.images.find(img => img.isPrimary) || property.images[0];
  const availableUnits = property.units?.filter(unit => unit.isAvailable) || [];
  const currentPrice = selectedUnit ? selectedUnit.price : property.price;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Image Gallery */}
        <div className="lg:w-2/3">
          <div className="relative">
            <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
              {primaryImage ? (
                <img
                  src={property.images[currentImageIndex]?.url || primaryImage.url}
                  alt={property.images[currentImageIndex]?.altText || property.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <Home className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>
            
            {/* Image Navigation */}
            {property.images.length > 1 && (
              <div className="flex mt-4 space-x-2 overflow-x-auto pb-2">
                {property.images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 ${
                      index === currentImageIndex ? 'border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.altText || `Property image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Property Summary */}
        <div className="lg:w-1/3">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{property.title}</CardTitle>
                  <div className="flex items-center mt-2 text-gray-600">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="text-sm">{property.address}, {property.city}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsFavorited(!isFavorited)}
                  >
                    <Heart className={`w-4 h-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Price */}
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(currentPrice || 0, property.currency)}
                <span className="text-sm font-normal text-gray-500">/month</span>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                {getStatusBadge(property.status)}
                {property.boundaryVerified && (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Boundary Verified
                  </Badge>
                )}
              </div>

              {/* Property Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  {getPropertyTypeIcon(property.propertyType)}
                  <span className="text-sm">{property.propertyType}</span>
                </div>
                {property.bedrooms && (
                  <div className="flex items-center space-x-2">
                    <Bed className="w-4 h-4" />
                    <span className="text-sm">{property.bedrooms} bed</span>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="flex items-center space-x-2">
                    <Bath className="w-4 h-4" />
                    <span className="text-sm">{property.bathrooms} bath</span>
                  </div>
                )}
                {property.area && (
                  <div className="flex items-center space-x-2">
                    <Square className="w-4 h-4" />
                    <span className="text-sm">{property.area}</span>
                  </div>
                )}
              </div>

              {/* Multi-family Building Info */}
              {property.structure === PropertyStructure.MULTI_FAMILY && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4" />
                    <span className="text-sm">
                      {property.totalUnits} units total, {property.availableUnits} available
                    </span>
                  </div>
                  {availableUnits.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Available Units:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {availableUnits.slice(0, 3).map((unit) => (
                          <Badge
                            key={unit.id}
                            variant="outline"
                            className="cursor-pointer hover:bg-blue-50"
                            onClick={() => setSelectedUnit(unit)}
                          >
                            {unit.unitNumber}
                          </Badge>
                        ))}
                        {availableUnits.length > 3 && (
                          <Badge variant="outline">
                            +{availableUnits.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                {property.status === PropertyStatus.PUBLISHED && (
                  <Button
                    onClick={onRentClick}
                    className="w-full"
                    disabled={!property.isAvailable}
                  >
                    {property.isAvailable ? 'Rent Now' : 'Not Available'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={onContactClick}
                  className="w-full"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact {property.isOwnerListing ? 'Owner' : 'Agent'}
                </Button>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={property.owner.image || undefined} />
                    <AvatarFallback>
                      {property.owner.name?.[0] || property.owner.email[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{property.owner.name || 'Property Owner'}</p>
                    <p className="text-sm text-gray-600">
                      {property.isOwnerListing ? 'Owner' : 'Listed by Agent'}
                    </p>
                  </div>
                </div>
                
                {property.agent && (
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={property.agent.image || undefined} />
                      <AvatarFallback>
                        {property.agent.name?.[0] || property.agent.email[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{property.agent.name || 'Agent'}</p>
                      <p className="text-sm text-gray-600">Real Estate Agent</p>
                      {property.agent.agentReliabilityScore && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span className="text-sm">{property.agent.agentReliabilityScore}/5</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="units">Units</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Property Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  {showFullDescription
                    ? property.description
                    : `${property.description.substring(0, 300)}${property.description.length > 300 ? '...' : ''}`
                  }
                </p>
                {property.description.length > 300 && (
                  <Button
                    variant="link"
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="p-0 h-auto text-blue-600"
                  >
                    {showFullDescription ? 'Show less' : 'Show more'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Property Type</p>
                  <p className="font-medium">{property.propertyType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Structure</p>
                  <p className="font-medium">
                    {property.structure === PropertyStructure.SINGLE_UNIT ? 'Single Unit' : 'Multi-Family'}
                  </p>
                </div>
                {property.bedrooms && (
                  <div>
                    <p className="text-sm text-gray-600">Bedrooms</p>
                    <p className="font-medium">{property.bedrooms}</p>
                  </div>
                )}
                {property.bathrooms && (
                  <div>
                    <p className="text-sm text-gray-600">Bathrooms</p>
                    <p className="font-medium">{property.bathrooms}</p>
                  </div>
                )}
                {property.area && (
                  <div>
                    <p className="text-sm text-gray-600">Area</p>
                    <p className="font-medium">{property.area}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Available From</p>
                  <p className="font-medium">
                    {property.availableFrom 
                      ? new Date(property.availableFrom).toLocaleDateString()
                      : 'Immediately'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="location" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapIcon className="w-5 h-5 mr-2" />
                Property Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium">{property.address}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">City</p>
                    <p className="font-medium">{property.city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">State</p>
                    <p className="font-medium">{property.state}</p>
                  </div>
                </div>
                
                {isLoaded && coordinates && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">Map View</p>
                      {property.boundaryVerified && (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Boundary Verified
                        </Badge>
                      )}
                    </div>
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={mapCenter}
                      zoom={18}
                      options={{
                        mapTypeId: 'satellite',
                        disableDefaultUI: false,
                        zoomControl: true,
                        streetViewControl: true,
                        fullscreenControl: true,
                      }}
                    >
                      <Marker position={coordinates} />
                      
                      {/* Property Boundary */}
                      {boundaryCoords && (
                        <Polygon
                          paths={boundaryCoords}
                          options={{
                            fillColor: '#22c55e',
                            fillOpacity: 0.3,
                            strokeColor: '#16a34a',
                            strokeOpacity: 1,
                            strokeWeight: 2,
                          }}
                        />
                      )}
                    </GoogleMap>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Property Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {property.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    {getFeatureIcon(feature)}
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Building Features for Multi-family */}
          {property.structure === PropertyStructure.MULTI_FAMILY && property.buildingFeatures.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Building Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {property.buildingFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      {getFeatureIcon(feature)}
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="units" className="space-y-6">
          {property.structure === PropertyStructure.MULTI_FAMILY && property.units ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building className="w-5 h-5 mr-2" />
                    Available Units ({availableUnits.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {availableUnits.map((unit) => (
                      <Card key={unit.id} className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-medium">Unit {unit.unitNumber}</h4>
                              <p className="text-sm text-gray-600">
                                {unit.floor ? `Floor ${unit.floor}` : 'Ground Floor'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600">
                                {formatCurrency(unit.price, unit.currency)}
                              </p>
                              <p className="text-sm text-gray-500">/month</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            {unit.bedrooms && (
                              <div className="flex items-center space-x-1">
                                <Bed className="w-4 h-4" />
                                <span>{unit.bedrooms} bed</span>
                              </div>
                            )}
                            {unit.bathrooms && (
                              <div className="flex items-center space-x-1">
                                <Bath className="w-4 h-4" />
                                <span>{unit.bathrooms} bath</span>
                              </div>
                            )}
                            {unit.area && (
                              <div className="flex items-center space-x-1">
                                <Square className="w-4 h-4" />
                                <span>{unit.area}</span>
                              </div>
                            )}
                          </div>
                          
                          {unit.features.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm text-gray-600 mb-1">Features:</p>
                              <div className="flex flex-wrap gap-1">
                                {unit.features.map((feature, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-3 flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => setSelectedUnit(unit)}
                              className="flex-1"
                            >
                              Select Unit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUnit(unit);
                                onRentClick?.();
                              }}
                            >
                              Rent Now
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Building className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">
                  This is a single-unit property. All details are shown in the overview section.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Admin/Agent Actions */}
      {(userRole === 'ADMIN' || userRole === 'AGENT') && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-700">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Admin/Agent Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onReportDuplicate}
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                Report Duplicate
              </Button>
              {!property.boundaryVerified && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onMarkBoundary}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  Mark Boundary
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-gray-600 border-gray-200 hover:bg-gray-50"
              >
                <Eye className="w-4 h-4 mr-1" />
                View History
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Property Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Property Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{property.viewCount}</div>
              <div className="text-sm text-gray-600">Views</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{property.favoriteCount}</div>
              <div className="text-sm text-gray-600">Favorites</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {property._count?.rentals || 0}
              </div>
              <div className="text-sm text-gray-600">Rentals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.ceil((Date.now() - new Date(property.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
              </div>
              <div className="text-sm text-gray-600">Days Listed</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyDetails;