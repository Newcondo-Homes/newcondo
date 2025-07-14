// apps/platform/src/app/(dashboard)/properties/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePropertyListingStore } from "@/store/propertyListingStore";
import { PropertyListingForm } from "@/components/property/property-listing-form";
import { BoundaryMarkingMap } from "@/components/property/boundary-marking-map";
import { Card, CardContent, CardHeader, CardTitle } from "@newcondo/ui/";
import { Button } from "@newcondo/ui/";
import { Stepper } from "@/components/shared/stepper";
import { ArrowLeft, MapPin, FileText, Image, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const steps = [
  {
    id: "property-details",
    title: "Property Details",
    icon: FileText,
    description: "Basic information about your property"
  },
  {
    id: "boundary-marking",
    title: "Mark Location",
    icon: MapPin,
    description: "Mark your property on the map"
  },
  {
    id: "images",
    title: "Upload Images",
    icon: Image,
    description: "Add photos of your property"
  },
  {
    id: "review",
    title: "Review & Submit",
    icon: CheckCircle,
    description: "Review and submit your listing"
  }
];

export default function CreatePropertyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    propertyData,
    boundaryData,
    images,
    submitProperty,
    resetForm,
    isValidStep
  } = usePropertyListingStore();

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await submitProperty();
      
      toast({
        title: "Property Listed Successfully!",
        description: "Your property has been submitted for review.",
      });
      
      resetForm();
      router.push("/dashboard/properties/my-listings");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit property. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = isValidStep(steps[currentStep].id);

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case "property-details":
        return <PropertyListingForm />;
      case "boundary-marking":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Mark Your Property Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BoundaryMarkingMap />
            </CardContent>
          </Card>
        );
      case "images":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Upload Property Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PropertyImageUpload />
            </CardContent>
          </Card>
        );
      case "review":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Review Your Listing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PropertyReview />
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Property Listing</h1>
          <p className="text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>
      </div>

      <Stepper
        steps={steps}
        currentStep={currentStep}
        onStepClick={setCurrentStep}
        className="mb-8"
      />

      <div className="mb-8">
        {renderStepContent()}
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          Previous
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={!canProceed || isSubmitting}
          loading={isSubmitting}
        >
          {currentStep === steps.length - 1 ? "Submit Listing" : "Next"}
        </Button>
      </div>
    </div>
  );
}

// Additional components for image upload and review
function PropertyImageUpload() {
  const { images, addImage, removeImage, setImageAsPrimary } = usePropertyListingStore();
  
  // Implementation for image upload component
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Upload high-quality photos of your property. The first image will be the main photo.
      </p>
      {/* Image upload implementation */}
    </div>
  );
}

function PropertyReview() {
  const { propertyData, boundaryData, images } = usePropertyListingStore();
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Property Details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Title:</span> {propertyData.title}
          </div>
          <div>
            <span className="font-medium">Price:</span> ₦{propertyData.price?.toLocaleString()}/month
          </div>
          <div>
            <span className="font-medium">Type:</span> {propertyData.propertyType}
          </div>
          <div>
            <span className="font-medium">Bedrooms:</span> {propertyData.bedrooms}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Location</h3>
        <p className="text-sm">{propertyData.address}</p>
        {boundaryData && (
          <p className="text-sm text-green-600 mt-1">
            ✓ Property boundary marked and verified
          </p>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Images</h3>
        <p className="text-sm">
          {images.length} image{images.length !== 1 ? 's' : ''} uploaded
        </p>
      </div>
    </div>
  );
}