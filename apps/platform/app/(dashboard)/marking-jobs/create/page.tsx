"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, redirect } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { markingApi } from "@/lib/api/marking";
import { propertyApi } from "@/lib/api/properties";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@newcondo/ui/components/card";
import { Input } from "@newcondo/ui/components/input";
import { Label } from "@newcondo/ui/components/label";
import { Textarea } from "@newcondo/ui/components/textarea";
import { RadioGroup, RadioGroupItem } from "@newcondo/ui/components/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@newcondo/ui/components/select";
import { Alert, AlertDescription } from "@newcondo/ui/components/alert";
import { useSession } from '@newcondo/auth/client';
import {
  ArrowLeft,
  AlertCircle,
  MapPin,
  User,
  Clock,
  CheckCircle,
  Users,
  Building,
  Share2,
} from "lucide-react";
import { LoadingSpinner } from "@/components/shared/feedback/LoadingSpinner";
import { Calendar } from "@newcondo/ui/components/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@newcondo/ui/components/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Image from "next/image";

// Validation schema
const markingJobSchema = z.object({
  propertyId: z.string().min(1, "Please select a property"),
  markingType: z.enum(["SELF", "NEWCONDO", "KNOWN_PERSON", "AGENT_QUEUE"]),
  contactPersonName: z.string().min(2, "Contact name must be at least 2 characters"),
  contactPersonPhone: z.string().regex(/^(\+234|0)[789]\d{9}$/, "Invalid Nigerian phone number"),
  accessInstructions: z.string().optional(),
  preferredTime: z.date().optional(),
  urgencyLevel: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
  shareableEmail: z.string().email().optional().or(z.literal("")),
});

type MarkingJobFormData = z.infer<typeof markingJobSchema>;

const MARKING_FEES = {
  SELF: 0,
  NEWCONDO: 25000,
  KNOWN_PERSON: 0,
  AGENT_QUEUE: 20000,
};

interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
  boundaryVerified: boolean;
  images?: { url: string }[];
}

interface JobResponse {
  job: { id: string };
}

interface LinkResponse {
  shareableLink: string;
}

export default function CreateMarkingJobPage() {
  const { data: session } = useSession();

  if (!session) {
    redirect('/login');
  }

  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyIdParam = searchParams.get("propertyId");

  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareableLink, setShareableLink] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MarkingJobFormData>({
    resolver: zodResolver(markingJobSchema),
    defaultValues: {
      propertyId: propertyIdParam || "",
      markingType: "AGENT_QUEUE",
      urgencyLevel: "NORMAL",
    },
  });

  const markingType = watch("markingType");
  const selectedPropertyId = watch("propertyId");
  const preferredTime = watch("preferredTime");

  const fetchProperties = useCallback(async () => {
    try {
      setIsLoadingProperties(true);
      const response = await propertyApi.getUserProperties(session.user.id, { isAvailable: false });
      setProperties(response.properties.filter((p: Property) => !p.boundaryVerified));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch properties");
    } finally {
      setIsLoadingProperties(false);
    }
  }, [session.user.id]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);
  const markingFee = MARKING_FEES[markingType];

  const onSubmit = async (data: MarkingJobFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (data.markingType === "KNOWN_PERSON") {
        const jobResponse: JobResponse = await markingApi.createJob({
          propertyId: data.propertyId,
          markingType: "self_assign",
          contactPersonName: data.contactPersonName,
          contactPersonPhone: data.contactPersonPhone,
          accessInstructions: data.accessInstructions,
          urgencyLevel: data.urgencyLevel,
        });

        const linkResponse: LinkResponse = await markingApi.generateShareableLink(
          jobResponse.job.id
        );
        setShareableLink(linkResponse.shareableLink);

      } else {
        const jobResponse: JobResponse = await markingApi.createJob({
          propertyId: data.propertyId,
          markingType: data.markingType === "NEWCONDO" || data.markingType === "AGENT_QUEUE"
            ? "newcondo_agent"
            : "self_assign",
          contactPersonName: data.contactPersonName,
          contactPersonPhone: data.contactPersonPhone,
          accessInstructions: data.accessInstructions,
          preferredTime: data.preferredTime?.toISOString(),
          urgencyLevel: data.urgencyLevel,
        });

        if (markingFee > 0) {
          router.push(`/payments/marking/${jobResponse.job.id}`);
        } else {
          router.push(`/marking-jobs/${jobResponse.job.id}`);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create marking job");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingProperties) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (shareableLink) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <CheckCircle className="h-6 w-6" />
              <CardTitle>Shareable Link Created</CardTitle>
            </div>
            <CardDescription>
              Share this link with the person who will mark your property
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg break-all">
              <code className="text-sm">{shareableLink}</code>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(shareableLink);
                  alert("Link copied to clipboard!");
                }}
                className="flex-1"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
              <Button variant="outline" onClick={() => router.push("/marking-jobs")}>
                View All Jobs
              </Button>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The person with this link will be able to mark your property. Make sure to share it only with trusted individuals.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => router.push("/marking-jobs")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Button>
      </div>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Request Property Marking</h1>
        <p className="text-gray-600">
          Choose how you want your property to be marked and verified
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Property Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Property</CardTitle>
            <CardDescription>
              Choose which property needs to be marked
            </CardDescription>
          </CardHeader>
          <CardContent>
            {properties.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You don&apos;t have any properties that need marking. Please create a property listing first.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <Select value={selectedPropertyId} onValueChange={(value) => setValue("propertyId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.title} - {property.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.propertyId && (
                  <p className="text-sm text-red-500">{errors.propertyId.message}</p>
                )}

                {selectedProperty && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-4">
                      {selectedProperty.images?.[0] && (
                        <div className="relative w-24 h-24 flex-shrink-0">
                          <Image
                            src={selectedProperty.images[0].url}
                            alt={selectedProperty.title}
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{selectedProperty.title}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {selectedProperty.address}, {selectedProperty.city}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Marking Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle>How do you want to mark this property?</CardTitle>
            <CardDescription>
              Choose the method that works best for you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={markingType} onValueChange={(value) => setValue("markingType", value as MarkingJobFormData["markingType"])}>
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="SELF" id="self" className="mt-1" />
                <Label htmlFor="self" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Mark it myself</span>
                    <span className="text-sm text-green-600 font-medium">FREE</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    I will mark the property boundaries myself using the app
                  </p>
                </Label>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="KNOWN_PERSON" id="known" className="mt-1" />
                <Label htmlFor="known" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <Share2 className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Send to someone I know</span>
                    <span className="text-sm text-green-600 font-medium">FREE</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Generate a shareable link for a friend or family member to mark the property
                  </p>
                </Label>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="NEWCONDO" id="newcondo" className="mt-1" />
                <Label htmlFor="newcondo" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <Building className="h-5 w-5 text-orange-600" />
                    <span className="font-medium">Assign to Newcondo Admin</span>
                    <span className="text-sm text-orange-600 font-medium">₦25,000</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Our admin team will handle the property marking for you
                  </p>
                </Label>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="AGENT_QUEUE" id="queue" className="mt-1" />
                <Label htmlFor="queue" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Assign to available agents</span>
                    <span className="text-sm text-blue-600 font-medium">₦20,000</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Broadcast to nearby agents. First-come, first-served with 3-hour time slots
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              Who should the marker contact when they arrive at the property?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="contactPersonName">Contact Person Name *</Label>
              <Input
                id="contactPersonName"
                {...register("contactPersonName")}
                placeholder="e.g., John Doe"
              />
              {errors.contactPersonName && (
                <p className="text-sm text-red-500 mt-1">{errors.contactPersonName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="contactPersonPhone">Contact Phone Number *</Label>
              <Input
                id="contactPersonPhone"
                {...register("contactPersonPhone")}
                placeholder="e.g., 08012345678"
              />
              {errors.contactPersonPhone && (
                <p className="text-sm text-red-500 mt-1">{errors.contactPersonPhone.message}</p>
              )}
            </div>

            {markingType === "KNOWN_PERSON" && (
              <div>
                <Label htmlFor="shareableEmail">Email (Optional)</Label>
                <Input
                  id="shareableEmail"
                  type="email"
                  {...register("shareableEmail")}
                  placeholder="Send link via email"
                />
                {errors.shareableEmail && (
                  <p className="text-sm text-red-500 mt-1">{errors.shareableEmail.message}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Details */}
        {(markingType === "AGENT_QUEUE" || markingType === "NEWCONDO") && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="accessInstructions">Access Instructions (Optional)</Label>
                <Textarea
                  id="accessInstructions"
                  {...register("accessInstructions")}
                  placeholder="e.g., Gate code is 1234, ask for Mr. Johnson at the security post"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="preferredTime">Preferred Time (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !preferredTime && "text-muted-foreground"
                      )}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      {preferredTime ? format(preferredTime, "PPP p") : "Pick a date and time"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={preferredTime}
                      onSelect={(date) => setValue("preferredTime", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="urgencyLevel">Urgency Level</Label>
                <Select
                  value={watch("urgencyLevel")}
                  onValueChange={(value) => setValue("urgencyLevel", value as MarkingJobFormData["urgencyLevel"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low - Within a week</SelectItem>
                    <SelectItem value="NORMAL">Normal - Within 3 days</SelectItem>
                    <SelectItem value="HIGH">High - Within 24 hours</SelectItem>
                    <SelectItem value="URGENT">Urgent - ASAP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        {markingFee > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Marking Fee:</span>
                <span>₦{markingFee.toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Payment will be held until you confirm the marking is accurate
              </p>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/marking-jobs")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || properties.length === 0}>
            {isSubmitting ? (
              <>
                <LoadingSpinner className="mr-2" />
                Processing...
              </>
            ) : markingType === "KNOWN_PERSON" ? (
              "Generate Shareable Link"
            ) : markingFee > 0 ? (
              "Proceed to Payment"
            ) : (
              "Create Marking Job"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}