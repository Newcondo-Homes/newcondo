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





// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { Button } from "@newcondo/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@newcondo/ui/card";
// import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@newcondo/ui/form";
// import { Input } from "@newcondo/ui/input";
// import { Textarea } from "@newcondo/ui/textarea";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@newcondo/ui/select";
// import { RadioGroup, RadioGroupItem } from "@newcondo/ui/radio-group";
// import { Checkbox } from "@newcondo/ui/checkbox";
// import { useToast } from "@newcondo/ui/use-toast";
// import { MapPin, Home, Upload, AlertCircle, UserCheck, Users } from "lucide-react";
// import { Alert, AlertDescription } from "@newcondo/ui/alert";

// const propertySchema = z.object({
//   title: z.string().min(5, "Title must be at least 5 characters"),
//   description: z.string().min(20, "Description must be at least 20 characters"),
//   propertyType: z.enum(["APARTMENT", "HOUSE", "DUPLEX", "ROOM", "SHARED_APARTMENT", "OFFICE", "SHOP", "WAREHOUSE"]),
//   structure: z.enum(["SINGLE_UNIT", "MULTI_FAMILY"]),
//   price: z.string().optional(),
//   bedrooms: z.number().optional(),
//   bathrooms: z.number().optional(),
//   area: z.string().optional(),
//   address: z.string().min(5, "Address is required"),
//   state: z.string().min(1, "State is required"),
//   lga: z.string().min(1, "LGA is required"),
//   city: z.string().min(1, "City is required"),
//   features: z.array(z.string()).optional(),
//   isOwnerListing: z.boolean(),
//   markingMethod: z.enum(["SELF", "NEWCONDO", "FRIEND", "AGENT"]),
//   hasPropertyImages: z.boolean(),
// });

// type PropertyFormData = z.infer<typeof propertySchema>;

// export default function CreatePropertyPage() {
//   const router = useRouter();
//   const { toast } = useToast();
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [step, setStep] = useState<"details" | "location" | "marking">("details");

//   const form = useForm<PropertyFormData>({
//     resolver: zodResolver(propertySchema),
//     defaultValues: {
//       structure: "SINGLE_UNIT",
//       isOwnerListing: true,
//       markingMethod: "SELF",
//       hasPropertyImages: false,
//       features: [],
//     },
//   });

//   const watchStructure = form.watch("structure");
//   const watchMarkingMethod = form.watch("markingMethod");

//   const onSubmit = async (data: PropertyFormData) => {
//     setIsSubmitting(true);
//     try {
//       // Create property draft
//       const response = await fetch("/api/properties", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           ...data,
//           status: "DRAFT",
//         }),
//       });

//       if (!response.ok) throw new Error("Failed to create property");

//       const property = await response.json();

//       toast({
//         title: "Property Draft Created",
//         description: "Now let's mark your property on the map",
//       });

//       // Redirect based on marking method
//       if (data.markingMethod === "SELF") {
//         router.push(`/dashboard/properties/${property.id}/mark`);
//       } else {
//         router.push(`/dashboard/properties/${property.id}/marking-setup`);
//       }
//     } catch (error) {
//       toast({
//         title: "Error",
//         description: "Failed to create property. Please try again.",
//         variant: "destructive",
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="container max-w-4xl py-8">
//       <div className="mb-8">
//         <h1 className="text-3xl font-bold">List Your Property</h1>
//         <p className="text-muted-foreground mt-2">
//           Create a new property listing with automatic boundary verification
//         </p>
//       </div>

//       {/* Progress Steps */}
//       <div className="flex items-center justify-between mb-8">
//         <div className={`flex items-center gap-2 ${step === "details" ? "text-primary" : "text-muted-foreground"}`}>
//           <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "details" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
//             1
//           </div>
//           <span className="font-medium">Property Details</span>
//         </div>
//         <div className="flex-1 h-0.5 bg-muted mx-4" />
//         <div className={`flex items-center gap-2 ${step === "location" ? "text-primary" : "text-muted-foreground"}`}>
//           <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "location" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
//             2
//           </div>
//           <span className="font-medium">Location</span>
//         </div>
//         <div className="flex-1 h-0.5 bg-muted mx-4" />
//         <div className={`flex items-center gap-2 ${step === "marking" ? "text-primary" : "text-muted-foreground"}`}>
//           <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "marking" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
//             3
//           </div>
//           <span className="font-medium">Property Marking</span>
//         </div>
//       </div>

//       <Form {...form}>
//         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
//           {/* Step 1: Property Details */}
//           {step === "details" && (
//             <Card>
//               <CardHeader>
//                 <CardTitle>Property Information</CardTitle>
//                 <CardDescription>Provide basic details about your property</CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-6">
//                 <FormField
//                   control={form.control}
//                   name="title"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Property Title</FormLabel>
//                       <FormControl>
//                         <Input placeholder="e.g., Spacious 3-Bedroom Apartment in Lekki" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="description"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Description</FormLabel>
//                       <FormControl>
//                         <Textarea
//                           placeholder="Describe your property, its features, and surroundings..."
//                           className="min-h-32"
//                           {...field}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <div className="grid grid-cols-2 gap-4">
//                   <FormField
//                     control={form.control}
//                     name="structure"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Property Structure</FormLabel>
//                         <Select onValueChange={field.onChange} defaultValue={field.value}>
//                           <FormControl>
//                             <SelectTrigger>
//                               <SelectValue />
//                             </SelectTrigger>
//                           </FormControl>
//                           <SelectContent>
//                             <SelectItem value="SINGLE_UNIT">Single Unit</SelectItem>
//                             <SelectItem value="MULTI_FAMILY">Multi-Family Building</SelectItem>
//                           </SelectContent>
//                         </Select>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <FormField
//                     control={form.control}
//                     name="propertyType"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Property Type</FormLabel>
//                         <Select onValueChange={field.onChange} defaultValue={field.value}>
//                           <FormControl>
//                             <SelectTrigger>
//                               <SelectValue />
//                             </SelectTrigger>
//                           </FormControl>
//                           <SelectContent>
//                             <SelectItem value="APARTMENT">Apartment</SelectItem>
//                             <SelectItem value="HOUSE">House</SelectItem>
//                             <SelectItem value="DUPLEX">Duplex</SelectItem>
//                             <SelectItem value="ROOM">Room</SelectItem>
//                             <SelectItem value="SHARED_APARTMENT">Shared Apartment</SelectItem>
//                             <SelectItem value="OFFICE">Office</SelectItem>
//                             <SelectItem value="SHOP">Shop</SelectItem>
//                             <SelectItem value="WAREHOUSE">Warehouse</SelectItem>
//                           </SelectContent>
//                         </Select>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>

//                 {watchStructure === "SINGLE_UNIT" && (
//                   <>
//                     <div className="grid grid-cols-3 gap-4">
//                       <FormField
//                         control={form.control}
//                         name="price"
//                         render={({ field }) => (
//                           <FormItem>
//                             <FormLabel>Monthly Rent (₦)</FormLabel>
//                             <FormControl>
//                               <Input type="number" placeholder="500000" {...field} />
//                             </FormControl>
//                             <FormMessage />
//                           </FormItem>
//                         )}
//                       />

//                       <FormField
//                         control={form.control}
//                         name="bedrooms"
//                         render={({ field }) => (
//                           <FormItem>
//                             <FormLabel>Bedrooms</FormLabel>
//                             <FormControl>
//                               <Input
//                                 type="number"
//                                 {...field}
//                                 onChange={(e) => field.onChange(Number(e.target.value))}
//                               />
//                             </FormControl>
//                             <FormMessage />
//                           </FormItem>
//                         )}
//                       />

//                       <FormField
//                         control={form.control}
//                         name="bathrooms"
//                         render={({ field }) => (
//                           <FormItem>
//                             <FormLabel>Bathrooms</FormLabel>
//                             <FormControl>
//                               <Input
//                                 type="number"
//                                 {...field}
//                                 onChange={(e) => field.onChange(Number(e.target.value))}
//                               />
//                             </FormControl>
//                             <FormMessage />
//                           </FormItem>
//                         )}
//                       />
//                     </div>

//                     <FormField
//                       control={form.control}
//                       name="area"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel>Property Area</FormLabel>
//                           <FormControl>
//                             <Input placeholder="e.g., 120 sqm" {...field} />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                   </>
//                 )}

//                 <FormField
//                   control={form.control}
//                   name="isOwnerListing"
//                   render={({ field }) => (
//                     <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
//                       <FormControl>
//                         <Checkbox checked={field.value} onCheckedChange={field.onChange} />
//                       </FormControl>
//                       <div className="space-y-1 leading-none">
//                         <FormLabel>I am the property owner</FormLabel>
//                         <FormDescription>
//                           Uncheck if you're listing as an agent with owner's consent
//                         </FormDescription>
//                       </div>
//                     </FormItem>
//                   )}
//                 />

//                 <Button type="button" onClick={() => setStep("location")} className="w-full">
//                   Continue to Location
//                 </Button>
//               </CardContent>
//             </Card>
//           )}

//           {/* Step 2: Location */}
//           {step === "location" && (
//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <MapPin className="w-5 h-5" />
//                   Property Location
//                 </CardTitle>
//                 <CardDescription>Provide the complete address of your property</CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-6">
//                 <Alert>
//                   <AlertCircle className="w-4 h-4" />
//                   <AlertDescription>
//                     Provide accurate location details. This will help marking agents locate your property easily.
//                   </AlertDescription>
//                 </Alert>

//                 <FormField
//                   control={form.control}
//                   name="address"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Street Address</FormLabel>
//                       <FormControl>
//                         <Input placeholder="e.g., 15 Admiralty Way" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <div className="grid grid-cols-3 gap-4">
//                   <FormField
//                     control={form.control}
//                     name="state"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>State</FormLabel>
//                         <Select onValueChange={field.onChange} defaultValue={field.value}>
//                           <FormControl>
//                             <SelectTrigger>
//                               <SelectValue placeholder="Select state" />
//                             </SelectTrigger>
//                           </FormControl>
//                           <SelectContent>
//                             <SelectItem value="Lagos">Lagos</SelectItem>
//                             <SelectItem value="Abuja">Abuja</SelectItem>
//                             <SelectItem value="Rivers">Rivers</SelectItem>
//                             {/* Add more states */}
//                           </SelectContent>
//                         </Select>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <FormField
//                     control={form.control}
//                     name="lga"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>LGA</FormLabel>
//                         <FormControl>
//                           <Input placeholder="Select LGA" {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <FormField
//                     control={form.control}
//                     name="city"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>City/Area</FormLabel>
//                         <FormControl>
//                           <Input placeholder="e.g., Lekki" {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>

//                 <div className="flex gap-4">
//                   <Button type="button" variant="outline" onClick={() => setStep("details")} className="flex-1">
//                     Back
//                   </Button>
//                   <Button type="button" onClick={() => setStep("marking")} className="flex-1">
//                     Continue to Marking
//                   </Button>
//                 </div>
//               </CardContent>
//             </Card>
//           )}

//           {/* Step 3: Property Marking Method */}
//           {step === "marking" && (
//             <Card>
//               <CardHeader>
//                 <CardTitle>Property Marking Method</CardTitle>
//                 <CardDescription>
//                   Choose how you want to verify and mark your property's boundaries
//                 </CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-6">
//                 <Alert>
//                   <Home className="w-4 h-4" />
//                   <AlertDescription>
//                     Property marking helps prevent duplicates and ensures accurate location verification. This is a required step.
//                   </AlertDescription>
//                 </Alert>

//                 <FormField
//                   control={form.control}
//                   name="hasPropertyImages"
//                   render={({ field }) => (
//                     <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
//                       <FormControl>
//                         <Checkbox checked={field.value} onCheckedChange={field.onChange} />
//                       </FormControl>
//                       <div className="space-y-1 leading-none">
//                         <FormLabel>I have property images available</FormLabel>
//                         <FormDescription>
//                           Images help marking agents identify your property more easily
//                         </FormDescription>
//                       </div>
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="markingMethod"
//                   render={({ field }) => (
//                     <FormItem className="space-y-4">
//                       <FormLabel>Select Marking Method</FormLabel>
//                       <FormControl>
//                         <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="space-y-4">
//                           <div className="flex items-start space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent">
//                             <RadioGroupItem value="SELF" id="self" />
//                             <label htmlFor="self" className="flex-1 cursor-pointer">
//                               <div className="flex items-center gap-2 font-medium">
//                                 <UserCheck className="w-4 h-4" />
//                                 Mark it myself
//                               </div>
//                               <p className="text-sm text-muted-foreground mt-1">
//                                 Free - Use our interactive map tool to mark your property boundaries yourself
//                               </p>
//                             </label>
//                           </div>

//                           <div className="flex items-start space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent">
//                             <RadioGroupItem value="FRIEND" id="friend" />
//                             <label htmlFor="friend" className="flex-1 cursor-pointer">
//                               <div className="flex items-center gap-2 font-medium">
//                                 <Users className="w-4 h-4" />
//                                 Send to someone I know
//                               </div>
//                               <p className="text-sm text-muted-foreground mt-1">
//                                 Free - Generate a shareable link for a friend or family member to mark the property
//                               </p>
//                             </label>
//                           </div>

//                           <div className="flex items-start space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent">
//                             <RadioGroupItem value="AGENT" id="agent" />
//                             <label htmlFor="agent" className="flex-1 cursor-pointer">
//                               <div className="flex items-center gap-2 font-medium">
//                                 <MapPin className="w-4 h-4" />
//                                 Assign to Newcondo agents
//                               </div>
//                               <p className="text-sm text-muted-foreground mt-1">
//                                 ₦20,000 - Professional marking agents will visit and mark your property
//                               </p>
//                             </label>
//                           </div>

//                           <div className="flex items-start space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent">
//                             <RadioGroupItem value="NEWCONDO" id="newcondo" />
//                             <label htmlFor="newcondo" className="flex-1 cursor-pointer">
//                               <div className="flex items-center gap-2 font-medium">
//                                 <Home className="w-4 h-4" />
//                                 Newcondo Premium Service
//                               </div>
//                               <p className="text-sm text-muted-foreground mt-1">
//                                 ₦25,000 - Newcondo staff will personally mark your property with priority service
//                               </p>
//                             </label>
//                           </div>
//                         </RadioGroup>
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 {watchMarkingMethod !== "SELF" && (
//                   <Alert>
//                     <AlertCircle className="w-4 h-4" />
//                     <AlertDescription>
//                       You'll be able to provide contact details and access instructions in the next step
//                     </AlertDescription>
//                   </Alert>
//                 )}

//                 <div className="flex gap-4">
//                   <Button type="button" variant="outline" onClick={() => setStep("location")} className="flex-1">
//                     Back
//                   </Button>
//                   <Button type="submit" disabled={isSubmitting} className="flex-1">
//                     {isSubmitting ? "Creating..." : "Create Property"}
//                   </Button>
//                 </div>
//               </CardContent>
//             </Card>
//           )}
//         </form>
//       </Form>
//     </div>
//   );
// }