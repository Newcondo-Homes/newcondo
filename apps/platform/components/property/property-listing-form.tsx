// apps/platform/src/components/property/property-listing-form.tsx

"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@newcondo/ui/";
import { Input } from "@newcondo/ui/";
import { Label } from "@newcondo/ui/";
import { Textarea } from "@newcondo/ui/";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@newcondo/ui/";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@newcondo/ui/";
import { Checkbox } from "@newcondo/ui/";
import { Badge } from "@newcondo/ui/";
import { Alert, AlertDescription } from "@newcondo/ui/";
import { Separator } from "@newcondo/ui/";
import {
  MapPin,
  Home,
  DollarSign,
  Camera,
  AlertCircle,
  CheckCircle,
  Building2,
  Users,
  Car,
  Zap,
  Shield,
  Wifi,
  Droplets,
  Sun,
  Trees,
  Dumbbell,
  ShoppingCart,
  GraduationCap,
  Heart,
  Loader2,
  Save,
  Eye,
  X
} from "lucide-react";
import { usePropertyListingStore } from "@/store/propertyListingStore";
import { BoundaryMarkingMap } from "./boundary-marking-map";
import { ImageUploader } from "./image-uploader";
import { toast } from "sonner";
import Image from 'next/image';


const propertyListingSchema = z.object({
  // Basic Information
  title: z.string().min(10, "Title must be at least 10 characters").max(100, "Title too long"),
  description: z.string().min(50, "Description must be at least 50 characters").max(1000, "Description too long"),

  // Property Type & Structure
  propertyType: z.enum(["APARTMENT", "HOUSE", "DUPLEX", "ROOM", "SHARED_APARTMENT", "OFFICE", "SHOP", "WAREHOUSE"]),
  structure: z.enum(["SINGLE_UNIT", "MULTI_FAMILY"]),

  // Location
  address: z.string().min(10, "Address must be at least 10 characters"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  country: z.string().default("Nigeria"),

  // Property Details (for single units)
  bedrooms: z.number().min(0).max(20).optional(),
  bathrooms: z.number().min(0).max(20).optional(),
  area: z.string().optional(),

  // Pricing (for single units)
  price: z.number().min(1000, "Price must be at least ₦1,000").optional(),
  currency: z.string().default("NGN"),

  // Multi-family building details
  totalUnits: z.number().min(1).max(1000).optional(),

  // Ownership & Agency
  isOwnerListing: z.boolean().default(true),

  // Features & Amenities
  features: z.array(z.string()).default([]),
  buildingFeatures: z.array(z.string()).default([]),

  // Availability
  availableFrom: z.string().optional(),

  // Boundary & Location Data
  gpsCoordinates: z.string().optional(),
  boundaryCoordinates: z.array(
    z.object({ lat: z.number(), lng: z.number() })
  ).optional(),
  boundaryVerified: z.boolean().default(false),
});

type PropertyListingFormData = z.infer<typeof propertyListingSchema>;

// Property features options
const PROPERTY_FEATURES = [
  { id: "parking", label: "Parking Space", icon: Car },
  { id: "generator", label: "Generator", icon: Zap },
  { id: "security", label: "Security", icon: Shield },
  { id: "wifi", label: "WiFi", icon: Wifi },
  { id: "water", label: "Water Supply", icon: Droplets },
  { id: "solar", label: "Solar Power", icon: Sun },
  { id: "garden", label: "Garden", icon: Trees },
  { id: "gym", label: "Gym", icon: Dumbbell },
  { id: "shopping", label: "Shopping Center", icon: ShoppingCart },
  { id: "school", label: "School Nearby", icon: GraduationCap },
  { id: "hospital", label: "Hospital Nearby", icon: Heart },
];

const BUILDING_FEATURES = [
  { id: "elevator", label: "Elevator", icon: Building2 },
  { id: "concierge", label: "Concierge", icon: Users },
  { id: "cctv", label: "CCTV", icon: Shield },
  { id: "backup_power", label: "Backup Power", icon: Zap },
  { id: "water_treatment", label: "Water Treatment", icon: Droplets },
  { id: "parking_garage", label: "Parking Garage", icon: Car },
  { id: "swimming_pool", label: "Swimming Pool", icon: Droplets },
  { id: "gym_facility", label: "Gym Facility", icon: Dumbbell },
];

const PROPERTY_TYPES = [
  { value: "APARTMENT", label: "Apartment" },
  { value: "HOUSE", label: "House" },
  { value: "DUPLEX", label: "Duplex" },
  { value: "ROOM", label: "Room" },
  { value: "SHARED_APARTMENT", label: "Shared Apartment" },
  { value: "OFFICE", label: "Office" },
  { value: "SHOP", label: "Shop" },
  { value: "WAREHOUSE", label: "Warehouse" },
];

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa",
  "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
  "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
];

interface BoundaryCoord { lat: number; lng: number; }
interface BoundaryDataShape {
  coordinates: BoundaryCoord[];
  center: BoundaryCoord;
}

interface PropertyListingFormProps {
  initialData?: Partial<PropertyListingFormData>;
  isEditing?: boolean;
  propertyId?: string;
}

type Step = "basic" | "location" | "features" | "images" | "preview";
const steps: Step[] = ["basic", "location", "features", "images", "preview"];


export function PropertyListingForm({
  initialData,
  isEditing = false,
  // propertyId
}: PropertyListingFormProps) {
  // const router = useRouter();
  // const { user } = useAuth();
  const {
    isSubmitting: isLoading,
    submitListing,
    updateFormData,
  } = usePropertyListingStore();

  const [currentStep, setCurrentStep] = useState<"basic" | "location" | "features" | "images" | "preview">("basic");
  const [showBoundaryMap, setShowBoundaryMap] = useState(false);
  const [showMarkingService, setShowMarkingService] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [boundaryData, setBoundaryData] = useState<BoundaryDataShape | null>(null);
  const [isDraft, setIsDraft] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<PropertyListingFormData>({
    resolver: zodResolver(propertyListingSchema),
    defaultValues: {
      country: "Nigeria",
      currency: "NGN",
      isOwnerListing: true,
      structure: "SINGLE_UNIT",
      features: [],
      buildingFeatures: [],
      boundaryVerified: false,
      ...initialData
    }
  });

  const watchedStructure = watch("structure");
  // const watchedPropertyType = watch("propertyType");
  const watchedIsOwnerListing = watch("isOwnerListing");
  const watchedFeatures = watch("features");
  const watchedBuildingFeatures = watch("buildingFeatures");

  // Load initial data if editing
  useEffect(() => {
    if (isEditing && initialData) {
      reset(initialData);
      setUploadedImages([]);
      setBoundaryData(
        initialData.boundaryCoordinates
          ? { coordinates: initialData.boundaryCoordinates, center: initialData.boundaryCoordinates[0] }
          : null
      );
    }
  }, [isEditing, initialData, reset]);
  // Handle feature selection
  const handleFeatureToggle = (featureId: string, type: "features" | "buildingFeatures") => {
    const currentFeatures = type === "features" ? watchedFeatures : watchedBuildingFeatures;
    const newFeatures = currentFeatures.includes(featureId)
      ? currentFeatures.filter(f => f !== featureId)
      : [...currentFeatures, featureId];

    setValue(type, newFeatures);
  };

  // Handle boundary data from map
  const handleBoundaryComplete = (data: {
    coordinates: google.maps.LatLngLiteral[];
    center: google.maps.LatLngLiteral
  }) => {
    setBoundaryData(data);
    setValue("boundaryCoordinates", data.coordinates);
    setValue("gpsCoordinates", JSON.stringify(data.center));
    setValue("boundaryVerified", true);
    setShowBoundaryMap(false);
    toast.success("Property boundary marked successfully!");
  };

  // Handle image upload
  // const handleImageUpload = (urls: string[]) => {
  //   setUploadedImages(prev => [...prev, ...urls]);
  // };

  // Handle image removal
  const handleImageRemove = (url: string) => {
    setUploadedImages(prev => prev.filter(img => img !== url));
  };

  // Handle form submission
  const onSubmit = async (data: PropertyListingFormData) => {
    try {
      // Validate boundary marking for published listings
      if (!isDraft && !data.boundaryVerified) {
        toast.error("Please mark your property boundary before publishing");
        setCurrentStep("location");
        return;
      }

      // Validate images
      if (!isDraft && uploadedImages.length === 0) {
        toast.error("Please upload at least one property image");
        setCurrentStep("images");
        return;
      }


      updateFormData({
        ...data,
        availableFrom: data.availableFrom ? new Date(data.availableFrom) : undefined,
        boundaryCoordinates: boundaryData?.coordinates,
      });
      await submitListing();


      toast.success(
        isDraft
          ? "Property saved as draft"
          : isEditing
            ? "Property updated successfully"
            : "Property listing created successfully"
      );
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("An error occurred while saving the property");
    }
  };

  // Handle save as draft
  const handleSaveDraft = () => {
    setIsDraft(true);
    handleSubmit(onSubmit)();
  };

  // Handle publish
  const handlePublish = () => {
    setIsDraft(false);
    handleSubmit(onSubmit)();
  };

  // Step navigation
  const nextStep = () => {
    const steps: Step[] = ["basic", "location", "features", "images", "preview"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: Step[] = ["basic", "location", "features", "images", "preview"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1] as any);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isEditing ? "Edit Property Listing" : "Create New Property Listing"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isEditing ? "Update your property details" : "Add a new property to your portfolio"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={isLoading}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between bg-muted p-4 rounded-lg">
        {[
          { key: "basic", label: "Basic Info", icon: Home },
          { key: "location", label: "Location", icon: MapPin },
          { key: "features", label: "Features", icon: CheckCircle },
          { key: "images", label: "Images", icon: Camera },
          { key: "preview", label: "Preview", icon: Eye }
        ].map((step) => (
          <div
            key={step.key}
            className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${currentStep === step.key
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
              }`}
            onClick={() => setCurrentStep(step.key as any)}
          >
            <step.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{step.label}</span>
          </div>
        ))}
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information Step */}
        {currentStep === "basic" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Provide essential details about your property
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Property Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Property Title*</Label>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="title"
                      placeholder="e.g., Modern 3-Bedroom Apartment in Victoria Island"
                      className={errors.title ? "border-red-500" : ""}
                    />
                  )}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>

              {/* Property Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description*</Label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      id="description"
                      placeholder="Describe your property, its features, and what makes it special..."
                      rows={4}
                      className={errors.description ? "border-red-500" : ""}
                    />
                  )}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description.message}</p>
                )}
              </div>

              {/* Property Type & Structure */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="propertyType">Property Type*</Label>
                  <Controller
                    name="propertyType"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className={errors.propertyType ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROPERTY_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.propertyType && (
                    <p className="text-sm text-red-500">{errors.propertyType.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="structure">Property Structure*</Label>
                  <Controller
                    name="structure"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className={errors.structure ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select structure type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SINGLE_UNIT">Single Unit</SelectItem>
                          <SelectItem value="MULTI_FAMILY">Multi-Family Building</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.structure && (
                    <p className="text-sm text-red-500">{errors.structure.message}</p>
                  )}
                </div>
              </div>

              {/* Property Details (Single Unit) */}
              {watchedStructure === "SINGLE_UNIT" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bedrooms">Bedrooms</Label>
                      <Controller
                        name="bedrooms"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            id="bedrooms"
                            type="number"
                            min="0"
                            max="20"
                            placeholder="0"
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bathrooms">Bathrooms</Label>
                      <Controller
                        name="bathrooms"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            id="bathrooms"
                            type="number"
                            min="0"
                            max="20"
                            placeholder="0"
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="area">Area (sq ft/m)</Label>
                      <Controller
                        name="area"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            id="area"
                            placeholder="e.g., 1200 sqft"
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-2">
                    <Label htmlFor="price">Monthly Rent (₦)*</Label>
                    <Controller
                      name="price"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="price"
                          type="number"
                          min="1000"
                          placeholder="e.g., 500000"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className={errors.price ? "border-red-500" : ""}
                        />
                      )}
                    />
                    {errors.price && (
                      <p className="text-sm text-red-500">{errors.price.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Multi-Family Building Details */}
              {watchedStructure === "MULTI_FAMILY" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalUnits">Total Units in Building*</Label>
                    <Controller
                      name="totalUnits"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="totalUnits"
                          type="number"
                          min="1"
                          max="1000"
                          placeholder="e.g., 20"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className={errors.totalUnits ? "border-red-500" : ""}
                        />
                      )}
                    />
                    {errors.totalUnits && (
                      <p className="text-sm text-red-500">{errors.totalUnits.message}</p>
                    )}
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      For multi-family buildings, you&apos;ll set individual unit details and pricing in the next steps.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Owner/Agent Selection */}
              <div className="space-y-4">
                <Label>Listing Type*</Label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="isOwnerListing"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="isOwnerListing">I am the property owner</Label>
                  </div>
                </div>
                {!watchedIsOwnerListing && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      As an agent, you&apos;ll need to provide additional verification documents including a consent letter from the property owner.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Availability */}
              <div className="space-y-2">
                <Label htmlFor="availableFrom">Available From</Label>
                <Controller
                  name="availableFrom"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="availableFrom"
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  )}
                />
              </div>

              {/* Navigation */}
              <div className="flex justify-end">
                <Button type="button" onClick={nextStep}>
                  Next: Location
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Location Step */}
        {currentStep === "location" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location & Boundary Marking
              </CardTitle>
              <CardDescription>
                Provide your property&apos;s location and mark its boundaries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">Full Address*</Label>
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="address"
                      placeholder="e.g., 123 Ahmadu Bello Way, Victoria Island"
                      className={errors.address ? "border-red-500" : ""}
                    />
                  )}
                />
                {errors.address && (
                  <p className="text-sm text-red-500">{errors.address.message}</p>
                )}
              </div>

              {/* City, State, Country */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City*</Label>
                  <Controller
                    name="city"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="city"
                        placeholder="e.g., Lagos"
                        className={errors.city ? "border-red-500" : ""}
                      />
                    )}
                  />
                  {errors.city && (
                    <p className="text-sm text-red-500">{errors.city.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State*</Label>
                  <Controller
                    name="state"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className={errors.state ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {NIGERIAN_STATES.map(state => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.state && (
                    <p className="text-sm text-red-500">{errors.state.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country*</Label>
                  <Controller
                    name="country"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="country"
                        disabled
                        className="bg-muted"
                      />
                    )}
                  />
                </div>
              </div>

              {/* Boundary Marking Section */}
              <div className="space-y-4">
                <Separator />
                <div className="space-y-2">
                  <Label className="text-lg font-semibold">Property Boundary Marking</Label>
                  <p className="text-sm text-muted-foreground">
                    Mark your property boundaries on the map to prevent duplicates and verify location
                  </p>
                </div>

                {boundaryData ? (
                  <div className="space-y-4">
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Property boundary has been marked successfully. Your property is verified and protected from duplicates.
                      </AlertDescription>
                    </Alert>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowBoundaryMap(true)}
                      >
                        View/Edit Boundary
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        You need to mark your property boundary before publishing. This helps prevent duplicate listings and verifies your property location.
                      </AlertDescription>
                    </Alert>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => setShowBoundaryMap(true)}
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Mark Property Boundary
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowMarkingService(true)}
                      >
                        Request Marking Service
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={prevStep}>
                  Previous
                </Button>
                <Button type="button" onClick={nextStep}>
                  Next: Features
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features Step */}
        {currentStep === "features" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Features & Amenities
              </CardTitle>
              <CardDescription>
                Select the features and amenities available with your property
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Property Features */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">Property Features</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {PROPERTY_FEATURES.map(feature => {
                    const Icon = feature.icon;
                    const isSelected = watchedFeatures.includes(feature.id);
                    return (
                      <div
                        key={feature.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                          }`}
                        onClick={() => handleFeatureToggle(feature.id, "features")}
                      >
                        <div className="flex flex-col items-center gap-2 text-center">
                          <Icon className="w-6 h-6" />
                          <span className="text-sm font-medium">{feature.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Building Features (for multi-family) */}
              {watchedStructure === "MULTI_FAMILY" && (
                <div className="space-y-4">
                  <Separator />
                  <Label className="text-lg font-semibold">Building Features</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {BUILDING_FEATURES.map(feature => {
                      const Icon = feature.icon;
                      const isSelected = watchedBuildingFeatures.includes(feature.id);
                      return (
                        <div
                          key={feature.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                            }`}
                          onClick={() => handleFeatureToggle(feature.id, "buildingFeatures")}
                        >
                          <div className="flex flex-col items-center gap-2 text-center">
                            <Icon className="w-6 h-6" />
                            <span className="text-sm font-medium">{feature.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Selected Features Summary */}
              {(watchedFeatures.length > 0 || watchedBuildingFeatures.length > 0) && (
                <div className="space-y-4">
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold">Selected Features</Label>
                    <div className="flex flex-wrap gap-2">
                      {watchedFeatures.map(featureId => {
                        const feature = PROPERTY_FEATURES.find(f => f.id === featureId);
                        return feature ? (
                          <Badge key={featureId} variant="secondary" className="flex items-center gap-1">
                            <feature.icon className="w-3 h-3" />
                            {feature.label}
                          </Badge>
                        ) : null;
                      })}
                      {watchedBuildingFeatures.map(featureId => {
                        const feature = BUILDING_FEATURES.find(f => f.id === featureId);
                        return feature ? (
                          <Badge key={featureId} variant="outline" className="flex items-center gap-1">
                            <feature.icon className="w-3 h-3" />
                            {feature.label}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={prevStep}>
                  Previous
                </Button>
                <Button type="button" onClick={nextStep}>
                  Next: Images
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Images Step */}
        {currentStep === "images" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Property Images
              </CardTitle>
              <CardDescription>
                Upload high-quality images of your property to attract more tenants
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Image Uploader */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">Upload Images</Label>
                <ImageUploader
                  images={uploadedImages.map((url, index) => ({
                    id: `img-${index}`,
                    url,
                    isPrimary: index === 0,
                    order: index,
                  }))}
                  onImagesChange={(newImages) => setUploadedImages(newImages.map(img => img.url))}
                  maxImages={20}
                />
              </div>

              {/* Uploaded Images Preview */}
              {uploadedImages.length > 0 && (
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Uploaded Images ({uploadedImages.length})</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {uploadedImages.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="relative w-full h-32">
                          <Image
                            src={url}
                            alt={`Property image ${index + 1}`}
                            fill
                            className="object-cover rounded-lg border"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleImageRemove(url)}
                          >
                            Remove
                          </Button>
                        </div>
                        {index === 0 && (
                          <Badge className="absolute top-2 left-2 bg-primary">
                            Main Image
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Image Guidelines */}
              <Alert>
                <Camera className="h-4 w-4" />
                <AlertDescription>
                  <strong>Image Guidelines:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Upload at least 5 high-quality images</li>
                    <li>• First image will be used as the main listing image</li>
                    <li>• Include photos of all rooms, exterior, and amenities</li>
                    <li>• Maximum file size: 5MB per image</li>
                    <li>• Supported formats: JPEG, PNG, WebP</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={prevStep}>
                  Previous
                </Button>
                <Button type="button" onClick={nextStep}>
                  Next: Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview Step */}
        {currentStep === "preview" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Preview & Publish
              </CardTitle>
              <CardDescription>
                Review your property listing before publishing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Property Preview */}
              <div className="space-y-6">
                {/* Basic Info Preview */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <h4 className="font-medium text-lg">{watch("title") || "Property Title"}</h4>
                    <p className="text-sm text-muted-foreground">{watch("description") || "Property description..."}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {PROPERTY_TYPES.find(t => t.value === watch("propertyType"))?.label || "Property Type"}
                      </span>
                      {watch("bedrooms") && (
                        <span>{watch("bedrooms")} bed</span>
                      )}
                      {watch("bathrooms") && (
                        <span>{watch("bathrooms")} bath</span>
                      )}
                      {watch("area") && (
                        <span>{watch("area")}</span>
                      )}
                    </div>
                    {watch("price") && (
                      <div className="flex items-center gap-1 text-lg font-semibold text-primary">
                        <DollarSign className="w-4 h-4" />
                        ₦{watch("price")?.toLocaleString()}/month
                      </div>
                    )}
                  </div>
                </div>

                {/* Location Preview */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Location</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm">{watch("address")}</p>
                        <p className="text-sm text-muted-foreground">
                          {watch("city")}, {watch("state")}, {watch("country")}
                        </p>
                      </div>
                    </div>
                    {boundaryData && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        Boundary verified
                      </div>
                    )}
                  </div>
                </div>

                {/* Features Preview */}
                {(watchedFeatures.length > 0 || watchedBuildingFeatures.length > 0) && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Features & Amenities</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex flex-wrap gap-2">
                        {watchedFeatures.map(featureId => {
                          const feature = PROPERTY_FEATURES.find(f => f.id === featureId);
                          return feature ? (
                            <Badge key={featureId} variant="secondary" className="flex items-center gap-1">
                              <feature.icon className="w-3 h-3" />
                              {feature.label}
                            </Badge>
                          ) : null;
                        })}
                        {watchedBuildingFeatures.map(featureId => {
                          const feature = BUILDING_FEATURES.find(f => f.id === featureId);
                          return feature ? (
                            <Badge key={featureId} variant="outline" className="flex items-center gap-1">
                              <feature.icon className="w-3 h-3" />
                              {feature.label}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Images Preview */}
                {uploadedImages.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Images ({uploadedImages.length})</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {uploadedImages.slice(0, 4).map((url, index) => (
                        <div key={index} className="relative">
                          <div className="relative w-full h-24">
                            <Image
                              src={url}
                              alt={`Property image ${index + 1}`}
                              fill
                              className="object-cover rounded-lg border"
                            />
                          </div>
                          {index === 0 && (
                            <Badge className="absolute top-1 left-1 text-xs bg-primary">
                              Main
                            </Badge>
                          )}
                        </div>
                      ))}
                      {uploadedImages.length > 4 && (
                        <div className="h-24 bg-muted rounded-lg flex items-center justify-center">
                          <span className="text-sm text-muted-foreground">
                            +{uploadedImages.length - 4} more
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Validation Warnings */}
              <div className="space-y-2">
                {!boundaryData && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Property boundary not marked. This is required before publishing.
                    </AlertDescription>
                  </Alert>
                )}
                {uploadedImages.length === 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No images uploaded. At least one image is required before publishing.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Navigation & Actions */}
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={prevStep}>
                  Previous
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Draft
                  </Button>
                  <Button
                    type="button"
                    onClick={handlePublish}
                    disabled={isLoading || !boundaryData || uploadedImages.length === 0}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    {isEditing ? "Update Listing" : "Publish Listing"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </form>

      {/* Boundary Marking Modal */}
      {showBoundaryMap && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Mark Property Boundary</h3>
                <p className="text-sm text-muted-foreground">
                  Draw the boundary of your property on the map
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBoundaryMap(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="h-96">
              <BoundaryMarkingMap
                onBoundarySelected={(coordinates) => {
                  handleBoundaryComplete({
                    coordinates,
                    center: coordinates[0]
                  });
                }}
                onLocationConfirmed={() => {
                  // handle confirmed location if needed
                }}
                initialLocation={undefined}
                existingBoundaries={[]}
              />
            </div>
          </div>
        </div>
      )}

      {/* Property Marking Service Modal */}
      {showMarkingService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6">
            <p>Property marking service coming soon.</p>
            <Button onClick={() => setShowMarkingService(false)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}