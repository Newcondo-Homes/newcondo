"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, AlertCircle, Home, MapPin, FileText, Users } from "lucide-react";
import { Button } from "@newcondo/ui/components/button";
import { Input } from "@newcondo/ui/components/input";
import { Textarea } from "@newcondo/ui/components/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@newcondo/ui/components/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@newcondo/ui/components/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@newcondo/ui/components/card";
import { Alert, AlertDescription } from "@newcondo/ui/components/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@newcondo/ui/components/tabs";
import { Checkbox } from "@newcondo/ui/components/checkbox";
import { NigerianAddressSelector } from "@/components/address/NigerianAddressSelector";
import { ContactPersonForm } from "@/components/properties/ContactPersonForm";
import { PropertyMarkingStatus } from "@/components/properties/PropertyMarkingStatus";
import { ImageUploader } from "@/components/property/image-uploader";
import { useRouter } from "next/navigation";
import { toast } from "@newcondo/ui/";
// import type { PropertyImage } from '@/components/property/image-uploader';

const propertyFormSchema = z.object({
  // Basic Information
  title: z.string().min(10, "Title must be at least 10 characters"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  propertyType: z.enum([
    "APARTMENT",
    "HOUSE",
    "DUPLEX",
    "ROOM",
    "SHARED_APARTMENT",
    "OFFICE",
    "SHOP",
    "WAREHOUSE",
  ]),
  structure: z.enum(["SINGLE_UNIT", "MULTI_FAMILY"]),

  // Pricing (optional for multi-family)
  price: z.string().optional(),
  currency: z.string().default("NGN"),

  // Multi-family specific
  totalUnits: z.number().optional(),
  buildingFeatures: z.array(z.string()).optional(),

  // Single unit specific
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  area: z.string().optional(),
  features: z.array(z.string()).default([]),

  // Address
  hierarchicalAddress: z.object({
    state: z.string().min(1, "State is required"),
    lga: z.string().min(1, "LGA is required"),
    location: z.string().min(1, "Location is required"),
    streetAddress: z.string().optional(),
  }),
  address: z.string().min(10, "Full address is required"),

  // Ownership
  isOwnerListing: z.boolean().default(true),

  images: z.array(
    z.object({
      id: z.string(),
      url: z.string(),
      altText: z.string().optional(),
      isPrimary: z.boolean().default(false),
      order: z.number(),
    })
  ).min(3, 'At least 3 images are required'),

  // Property Marking
  requiresMarking: z.boolean().default(true),
  markingOption: z.enum(["SELF", "NEWCONDO", "SOMEONE_KNOWN", "ASSIGN_AGENT"]).optional(),
  contactPerson: z
    .object({
      name: z.string(),
      phone: z.string(),
      relationship: z.string(),
      accessInstructions: z.string().optional(),
    })
    .optional(),
});

type PropertyFormValues = z.infer<typeof propertyFormSchema>;

interface PropertyFormProps {
  propertyId?: string;
  initialData?: Partial<PropertyFormValues>;
  onSuccess?: (propertyId: string) => void;
}

export function PropertyForm({ propertyId, initialData, onSuccess }: PropertyFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTab, setCurrentTab] = useState("basic");
  const [markingJobId, setMarkingJobId] = useState<string | null>(null);
  const [markingJob, setMarkingJob] = useState<Parameters<typeof PropertyMarkingStatus>[0]['markingJob']>(undefined);

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      structure: "SINGLE_UNIT",
      currency: "NGN",
      isOwnerListing: true,
      requiresMarking: true,
      features: [],
      images: [],
      ...initialData,
    },
  });

  const watchStructure = form.watch("structure");
  const watchRequiresMarking = form.watch("requiresMarking");
  const watchMarkingOption = form.watch("markingOption");


  const handleConfirm = () => {
    // call your API to confirm marking
  };

  const handleReject = () => {
    // call your API to reject and request remark
  };

  const handleCancel = () => {
    // call your API to cancel the job
    setMarkingJobId(null);
    setMarkingJob(undefined);
  };
  const onSubmit = async (data: PropertyFormValues) => {
    setIsSubmitting(true);

    try {
      const url = propertyId
        ? `/api/properties/${propertyId}`
        : "/api/properties";
      
      const method = propertyId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save property");
      }

      const result = await response.json();

      toast.success("Sucess", {
        description: propertyId
          ? "Property updated successfully"
          : "Property created successfully",
      });

      if (onSuccess) {
        onSuccess(result.data.id);
      } else {
        router.push(`/dashboard/properties/${result.data.id}`);
      }
    } catch (error) {
      toast.error("Error",{
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">
              <Home className="h-4 w-4 mr-2" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="location">
              <MapPin className="h-4 w-4 mr-2" />
              Location
            </TabsTrigger>
            <TabsTrigger value="details">
              <FileText className="h-4 w-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="marking">
              <Users className="h-4 w-4 mr-2" />
              Property Marking
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Provide the essential details about your property
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Title *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Modern 3-Bedroom Apartment in Lekki"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your property in detail..."
                          rows={5}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Minimum 50 characters. Include key features and amenities.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="propertyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Type *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="APARTMENT">Apartment</SelectItem>
                            <SelectItem value="HOUSE">House</SelectItem>
                            <SelectItem value="DUPLEX">Duplex</SelectItem>
                            <SelectItem value="ROOM">Room</SelectItem>
                            <SelectItem value="SHARED_APARTMENT">
                              Shared Apartment
                            </SelectItem>
                            <SelectItem value="OFFICE">Office</SelectItem>
                            <SelectItem value="SHOP">Shop</SelectItem>
                            <SelectItem value="WAREHOUSE">Warehouse</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="structure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Structure *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select structure" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SINGLE_UNIT">
                              Single Unit
                            </SelectItem>
                            <SelectItem value="MULTI_FAMILY">
                              Multi-Family Building
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {watchStructure === "MULTI_FAMILY"
                            ? "Building with multiple rental units"
                            : "Single property for rent"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isOwnerListing"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>I am the property owner</FormLabel>
                        <FormDescription>
                          Uncheck if you're listing as an agent
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Location Tab */}
          <TabsContent value="location" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Location</CardTitle>
                <CardDescription>
                  Provide detailed location information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="hierarchicalAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hierarchical Address *</FormLabel>
                      <FormControl>
                        <NigerianAddressSelector
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>
                        Select State, LGA, and Location for accurate property placement
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Street Address *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Plot 123, Block A, Estate Name, Street Name"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Include plot number, street name, and landmarks
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
                <CardDescription>
                  Add pricing and property specifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {watchStructure === "SINGLE_UNIT" && (
                  <>
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Rent (NGN) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g., 500000"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="bedrooms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bedrooms</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) || 0)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bathrooms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bathrooms</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) || 0)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="area"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Area (sqm)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 120" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                {watchStructure === "MULTI_FAMILY" && (
                  <FormField
                    control={form.control}
                    name="totalUnits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Units in Building *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 12"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          You'll add individual unit details after property creation
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="images"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Images *</FormLabel>
                      <FormControl>
                        <ImageUploader
                          images={field.value}
                          onImagesChange={field.onChange}
                          maxImages={10}
                        />
                      </FormControl>
                      <FormDescription>
                        Upload at least 3 high-quality images
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Property Marking Tab */}
          <TabsContent value="marking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Marking Service</CardTitle>
                <CardDescription>
                  Choose how you want to mark your property on the map
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Property marking is required to verify location and prevent duplicates.
                    This involves drawing a boundary on satellite view.
                  </AlertDescription>
                </Alert>

                {markingJobId && markingJob && (
                  <PropertyMarkingStatus
                    markingJob={markingJob}        // the full object, not just the id
                    propertyId={propertyId ?? ""}
                    onConfirmMarking={handleConfirm}
                    onRejectMarking={handleReject}
                    onCancelJob={handleCancel}
                  />
                )}

                <FormField
                  control={form.control}
                  name="requiresMarking"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>This property requires marking</FormLabel>
                        <FormDescription>
                          Uncheck only if property is already marked
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {watchRequiresMarking && (
                  <>
                    <FormField
                      control={form.control}
                      name="markingOption"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marking Option *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose marking option" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="SELF">
                                Mark it myself
                              </SelectItem>
                              <SelectItem value="NEWCONDO">
                                Let Newcondo mark it (₦25,000)
                              </SelectItem>
                              <SelectItem value="SOMEONE_KNOWN">
                                Send someone I know
                              </SelectItem>
                              <SelectItem value="ASSIGN_AGENT">
                                Assign to nearby agents (₦20,000)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchMarkingOption &&
                      watchMarkingOption !== "SELF" && (
                        <FormField
                          control={form.control}
                          name="contactPerson"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Person Details *</FormLabel>
                              <FormControl>
                                <ContactPersonForm
                                  defaultValues={
                                    field.value
                                      ? {
                                          contactPersonName: field.value.name,
                                          contactPersonPhone: field.value.phone,
                                          accessInstructions: field.value.accessInstructions,
                                        }
                                      : undefined
                                  }
                                  onSubmit={(data) =>
                                    field.onChange({
                                      name: data.contactPersonName,
                                      phone: data.contactPersonPhone,
                                      relationship: "contact",
                                      accessInstructions: data.accessInstructions,
                                    })
                                  }
                                  isLoading={isSubmitting}
                                />

                              </FormControl>
                              <FormDescription>
                                Provide contact details for property access
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <div className="flex gap-2">
            {currentTab !== "marking" && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const tabs = ["basic", "location", "details", "marking"];
                  const currentIndex = tabs.indexOf(currentTab);
                  if (currentIndex < tabs.length - 1) {
                    setCurrentTab(tabs[currentIndex + 1]);
                  }
                }}
              >
                Next
              </Button>
            )}

            {currentTab === "marking" && (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {propertyId ? "Update Property" : "Create Property"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}






// // apps/platform/components/properties/PropertyForm.tsx

// 'use client';

// import React, { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { Button, Card, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@newcondo/ui';
// import { AlertCircle, Home, MapPin, DollarSign, Image as ImageIcon, FileText, Save, ArrowRight } from 'lucide-react';
// import { AddressSelector } from '@/components/address/AddressSelector';
// import { ImageUploader } from '@/components/properties/ImageUploader';
// import { ContactPersonForm } from '@/components/properties/ContactPersonForm';
// import { usePropertyStore } from '@/store/propertyStore';
// import { z } from 'zod';

// const propertyFormSchema = z.object({
//   title: z.string().min(10, 'Title must be at least 10 characters'),
//   description: z.string().min(50, 'Description must be at least 50 characters'),
//   propertyType: z.enum(['APARTMENT', 'HOUSE', 'DUPLEX', 'ROOM', 'SHARED_APARTMENT', 'OFFICE', 'SHOP', 'WAREHOUSE']),
//   price: z.number().positive('Price must be positive'),
//   bedrooms: z.number().min(0).optional(),
//   bathrooms: z.number().min(0).optional(),
//   area: z.string().optional(),
//   features: z.array(z.string()),
//   address: z.object({
//     state: z.string(),
//     lga: z.string(),
//     city: z.string().optional(),
//     location: z.string(),
//     streetAddress: z.string().optional(),
//   }),
//   isOwnerListing: z.boolean(),
// });

// type PropertyFormData = z.infer<typeof propertyFormSchema>;

// interface PropertyFormProps {
//   mode?: 'create' | 'edit';
//   initialData?: Partial<PropertyFormData>;
//   propertyId?: string;
// }

// export const PropertyForm: React.FC<PropertyFormProps> = ({
//   mode = 'create',
//   initialData,
//   propertyId,
// }) => {
//   const router = useRouter();
//   const { createProperty, updateProperty } = usePropertyStore();
  
//   const [step, setStep] = useState(1);
//   const [formData, setFormData] = useState<Partial<PropertyFormData>>(initialData || {
//     features: [],
//     isOwnerListing: true,
//   });
//   const [images, setImages] = useState<string[]>([]);
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [needsMarking, setNeedsMarking] = useState(true);

//   const updateFormData = (field: string, value: any) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
//     // Clear error for this field
//     if (errors[field]) {
//       setErrors(prev => {
//         const newErrors = { ...prev };
//         delete newErrors[field];
//         return newErrors;
//       });
//     }
//   };

//   const validateStep = (stepNumber: number): boolean => {
//     const newErrors: Record<string, string> = {};

//     if (stepNumber === 1) {
//       if (!formData.title || formData.title.length < 10) {
//         newErrors.title = 'Title must be at least 10 characters';
//       }
//       if (!formData.description || formData.description.length < 50) {
//         newErrors.description = 'Description must be at least 50 characters';
//       }
//       if (!formData.propertyType) {
//         newErrors.propertyType = 'Please select a property type';
//       }
//     }

//     if (stepNumber === 2) {
//       if (!formData.price || formData.price <= 0) {
//         newErrors.price = 'Please enter a valid price';
//       }
//       if (!formData.address?.state || !formData.address?.lga || !formData.address?.location) {
//         newErrors.address = 'Please complete the address information';
//       }
//     }

//     if (stepNumber === 3 && images.length === 0) {
//       newErrors.images = 'Please upload at least one property image';
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleNext = () => {
//     if (validateStep(step)) {
//       setStep(prev => prev + 1);
//     }
//   };

//   const handleBack = () => {
//     setStep(prev => prev - 1);
//   };

//   const handleSaveDraft = async () => {
//     setIsSubmitting(true);
//     try {
//       const propertyData = {
//         ...formData,
//         images,
//         status: 'DRAFT',
//       };

//       if (mode === 'edit' && propertyId) {
//         await updateProperty(propertyId, propertyData);
//       } else {
//         await createProperty(propertyData);
//       }

//       router.push('/dashboard/properties/my-listings');
//     } catch (error) {
//       console.error('Error saving draft:', error);
//       setErrors({ submit: 'Failed to save draft. Please try again.' });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleProceedToMarking = async () => {
//     if (!validateStep(step)) return;

//     setIsSubmitting(true);
//     try {
//       const propertyData = {
//         ...formData,
//         images,
//         status: 'PENDING',
//       };

//       let savedPropertyId = propertyId;

//       if (mode === 'edit' && propertyId) {
//         await updateProperty(propertyId, propertyData);
//       } else {
//         const newProperty = await createProperty(propertyData);
//         savedPropertyId = newProperty.id;
//       }

//       // Redirect to marking selection page
//       router.push(`/dashboard/properties/${savedPropertyId}/marking/select`);
//     } catch (error) {
//       console.error('Error saving property:', error);
//       setErrors({ submit: 'Failed to save property. Please try again.' });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const renderStepIndicator = () => (
//     <div className="flex items-center justify-between mb-8">
//       {[1, 2, 3, 4].map((stepNum) => (
//         <div key={stepNum} className="flex items-center flex-1">
//           <div
//             className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
//               stepNum === step
//                 ? 'border-primary bg-primary text-white'
//                 : stepNum < step
//                 ? 'border-primary bg-primary text-white'
//                 : 'border-gray-300 text-gray-500'
//             }`}
//           >
//             {stepNum}
//           </div>
//           {stepNum < 4 && (
//             <div
//               className={`flex-1 h-1 mx-2 ${
//                 stepNum < step ? 'bg-primary' : 'bg-gray-300'
//               }`}
//             />
//           )}
//         </div>
//       ))}
//     </div>
//   );

//   const renderStep1 = () => (
//     <div className="space-y-6">
//       <Card className="p-6">
//         <div className="flex items-center gap-2 mb-4">
//           <Home className="h-5 w-5 text-primary" />
//           <h3 className="text-lg font-semibold">Property Details</h3>
//         </div>

//         <div className="space-y-4">
//           <div>
//             <Label htmlFor="title">Property Title *</Label>
//             <Input
//               id="title"
//               placeholder="e.g., Spacious 3-bedroom apartment in Lekki"
//               value={formData.title || ''}
//               onChange={(e) => updateFormData('title', e.target.value)}
//             />
//             {errors.title && (
//               <p className="text-sm text-red-500 mt-1">{errors.title}</p>
//             )}
//           </div>

//           <div>
//             <Label htmlFor="description">Description *</Label>
//             <Textarea
//               id="description"
//               placeholder="Describe your property in detail..."
//               rows={6}
//               value={formData.description || ''}
//               onChange={(e) => updateFormData('description', e.target.value)}
//             />
//             <p className="text-xs text-muted-foreground mt-1">
//               {formData.description?.length || 0} / 50 minimum characters
//             </p>
//             {errors.description && (
//               <p className="text-sm text-red-500 mt-1">{errors.description}</p>
//             )}
//           </div>

//           <div>
//             <Label htmlFor="propertyType">Property Type *</Label>
//             <Select
//               value={formData.propertyType}
//               onValueChange={(value) => updateFormData('propertyType', value)}
//             >
//               <SelectTrigger>
//                 <SelectValue placeholder="Select property type" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="APARTMENT">Apartment</SelectItem>
//                 <SelectItem value="HOUSE">House</SelectItem>
//                 <SelectItem value="DUPLEX">Duplex</SelectItem>
//                 <SelectItem value="ROOM">Room</SelectItem>
//                 <SelectItem value="SHARED_APARTMENT">Shared Apartment</SelectItem>
//                 <SelectItem value="OFFICE">Office</SelectItem>
//                 <SelectItem value="SHOP">Shop</SelectItem>
//                 <SelectItem value="WAREHOUSE">Warehouse</SelectItem>
//               </SelectContent>
//             </Select>
//             {errors.propertyType && (
//               <p className="text-sm text-red-500 mt-1">{errors.propertyType}</p>
//             )}
//           </div>

//           <div className="grid grid-cols-3 gap-4">
//             <div>
//               <Label htmlFor="bedrooms">Bedrooms</Label>
//               <Input
//                 id="bedrooms"
//                 type="number"
//                 min="0"
//                 placeholder="0"
//                 value={formData.bedrooms || ''}
//                 onChange={(e) => updateFormData('bedrooms', parseInt(e.target.value))}
//               />
//             </div>

//             <div>
//               <Label htmlFor="bathrooms">Bathrooms</Label>
//               <Input
//                 id="bathrooms"
//                 type="number"
//                 min="0"
//                 placeholder="0"
//                 value={formData.bathrooms || ''}
//                 onChange={(e) => updateFormData('bathrooms', parseInt(e.target.value))}
//               />
//             </div>

//             <div>
//               <Label htmlFor="area">Area (sqm)</Label>
//               <Input
//                 id="area"
//                 placeholder="e.g., 120"
//                 value={formData.area || ''}
//                 onChange={(e) => updateFormData('area', e.target.value)}
//               />
//             </div>
//           </div>
//         </div>
//       </Card>
//     </div>
//   );

//   const renderStep2 = () => (
//     <div className="space-y-6">
//       <Card className="p-6">
//         <div className="flex items-center gap-2 mb-4">
//           <DollarSign className="h-5 w-5 text-primary" />
//           <h3 className="text-lg font-semibold">Pricing & Location</h3>
//         </div>

//         <div className="space-y-4">
//           <div>
//             <Label htmlFor="price">Monthly Rent (₦) *</Label>
//             <Input
//               id="price"
//               type="number"
//               min="0"
//               placeholder="e.g., 500000"
//               value={formData.price || ''}
//               onChange={(e) => updateFormData('price', parseFloat(e.target.value))}
//             />
//             {errors.price && (
//               <p className="text-sm text-red-500 mt-1">{errors.price}</p>
//             )}
//           </div>

//           <div>
//             <Label>Property Address *</Label>
//             <AddressSelector
//               value={formData.address}
//               onChange={(address) => updateFormData('address', address)}
//             />
//             {errors.address && (
//               <p className="text-sm text-red-500 mt-1">{errors.address}</p>
//             )}
//           </div>
//         </div>
//       </Card>
//     </div>
//   );

//   const renderStep3 = () => (
//     <div className="space-y-6">
//       <Card className="p-6">
//         <div className="flex items-center gap-2 mb-4">
//           <ImageIcon className="h-5 w-5 text-primary" />
//           <h3 className="text-lg font-semibold">Property Images</h3>
//         </div>

//         <ImageUploader
//           images={images}
//           onChange={setImages}
//           maxImages={10}
//         />
//         {errors.images && (
//           <p className="text-sm text-red-500 mt-2">{errors.images}</p>
//         )}
//       </Card>
//     </div>
//   );

//   const renderStep4 = () => (
//     <div className="space-y-6">
//       <Card className="p-6">
//         <div className="flex items-center gap-2 mb-4">
//           <FileText className="h-5 w-5 text-primary" />
//           <h3 className="text-lg font-semibold">Property Marking Required</h3>
//         </div>

//         <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
//           <div className="flex gap-3">
//             <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
//             <div className="flex-1">
//               <h4 className="font-medium text-blue-900 mb-1">
//                 Property Boundary Verification Required
//               </h4>
//               <p className="text-sm text-blue-700">
//                 To prevent duplicates and verify property ownership, you need to mark your property
//                 boundaries on a satellite map. You can do this yourself or assign someone to do it for you.
//               </p>
//             </div>
//           </div>
//         </div>

//         <div className="space-y-4">
//           <p className="text-sm text-muted-foreground">
//             Your property details have been saved. You can either:
//           </p>

//           <ul className="space-y-2 text-sm">
//             <li className="flex items-start gap-2">
//               <span className="text-primary">•</span>
//               <span>Save as draft and mark the property later</span>
//             </li>
//             <li className="flex items-start gap-2">
//               <span className="text-primary">•</span>
//               <span>Proceed to mark the property now (required before publishing)</span>
//             </li>
//           </ul>
//         </div>
//       </Card>

//       {errors.submit && (
//         <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//           <p className="text-sm text-red-700">{errors.submit}</p>
//         </div>
//       )}
//     </div>
//   );

//   return (
//     <div className="max-w-4xl mx-auto py-8 px-4">
//       <div className="mb-8">
//         <h1 className="text-3xl font-bold mb-2">
//           {mode === 'edit' ? 'Edit Property' : 'List Your Property'}
//         </h1>
//         <p className="text-muted-foreground">
//           Fill in the details about your property. All fields marked with * are required.
//         </p>
//       </div>

//       {renderStepIndicator()}

//       <div className="mb-6">
//         {step === 1 && renderStep1()}
//         {step === 2 && renderStep2()}
//         {step === 3 && renderStep3()}
//         {step === 4 && renderStep4()}
//       </div>

//       <div className="flex items-center justify-between pt-6 border-t">
//         <div>
//           {step > 1 && (
//             <Button
//               variant="outline"
//               onClick={handleBack}
//               disabled={isSubmitting}
//             >
//               Back
//             </Button>
//           )}
//         </div>

//         <div className="flex items-center gap-3">
//           {step === 4 && (
//             <Button
//               variant="outline"
//               onClick={handleSaveDraft}
//               disabled={isSubmitting}
//             >
//               <Save className="h-4 w-4 mr-2" />
//               Save as Draft
//             </Button>
//           )}

//           {step < 4 ? (
//             <Button onClick={handleNext}>
//               Next
//               <ArrowRight className="h-4 w-4 ml-2" />
//             </Button>
//           ) : (
//             <Button
//               onClick={handleProceedToMarking}
//               disabled={isSubmitting}
//             >
//               Proceed to Marking
//               <ArrowRight className="h-4 w-4 ml-2" />
//             </Button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };