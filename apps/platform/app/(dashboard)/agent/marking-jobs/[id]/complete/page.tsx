"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queueApi } from "@/lib/api/queue";
import * as z from "zod";
import { Button } from "@newcondo/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@newcondo/ui/components/card";
import { Label } from "@newcondo/ui/components/label";
import { Textarea } from "@newcondo/ui/components/textarea";
import { Alert, AlertDescription } from "@newcondo/ui/components/alert";
import { Progress } from "@newcondo/ui/components/progress";
import {
  AlertCircle,
  ArrowLeft,
  Upload,
  X,
  CheckCircle,
  MapPin,
} from "lucide-react";
import { LoadingSpinner } from "@/components/shared/feedback/LoadingSpinner";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing";

const completionSchema = z.object({
  completionNotes: z.string().min(10, "Please provide at least 10 characters of notes"),
  completionImages: z.array(z.string()).min(5, "Please upload at least 5 photos"),
  boundaryData: z.any().optional(),
});

type CompletionFormData = z.infer<typeof completionSchema>;

// fix line 40: typed job instead of `any`
interface JobDetails {
  property: {
    title: string;
    address: string;
    city: string;
  };
}

export default function AgentJobCompletePage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CompletionFormData>({
    resolver: zodResolver(completionSchema),
    defaultValues: {
      completionNotes: "",
      completionImages: [],
    },
  });

  const completionNotes = watch("completionNotes");

  // fix line 77: replaced `any` with typed error narrowing
  const fetchJobDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await queueApi.getJobDetails(jobId);
      setJob(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch job details";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  // fix line 65: fetchJobDetails now stable via useCallback so it's safe in the dep array
  useEffect(() => {
    fetchJobDetails();
  }, [fetchJobDetails]);

  useEffect(() => {
    setValue("completionImages", uploadedImages);
  }, [uploadedImages, setValue]);

  const handleImageUpload = (urls: string[]) => {
    setUploadedImages((prev) => [...prev, ...urls]);
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // fix line 104: replaced `any` with typed error narrowing
  const onSubmit = async (data: CompletionFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      await queueApi.completeJob(jobId, {
        completionNotes: data.completionNotes,
        completionImages: data.completionImages,
        boundaryData: data.boundaryData,
      });

      router.push(`/agent/marking-jobs/${jobId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to complete job";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/agent/marking-jobs")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Button>
      </div>
    );
  }

  const progressPercentage = (currentStep / 3) * 100;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => router.push(`/agent/marking-jobs/${jobId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Job Details
        </Button>
      </div>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Complete Marking Job</h1>
        <p className="text-gray-600">Submit your marking evidence and notes</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Step {currentStep} of 3</span>
          <span className="text-sm text-gray-600">{Math.round(progressPercentage)}% Complete</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />

        <div className="flex justify-between mt-4 text-sm">
          <div className={`flex items-center gap-2 ${currentStep >= 1 ? "text-blue-600" : "text-gray-400"}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep >= 1 ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
              {currentStep > 1 ? <CheckCircle className="h-4 w-4" /> : "1"}
            </div>
            <span>Upload Photos</span>
          </div>
          <div className={`flex items-center gap-2 ${currentStep >= 2 ? "text-blue-600" : "text-gray-400"}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep >= 2 ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
              {currentStep > 2 ? <CheckCircle className="h-4 w-4" /> : "2"}
            </div>
            <span>Mark Boundary</span>
          </div>
          <div className={`flex items-center gap-2 ${currentStep >= 3 ? "text-blue-600" : "text-gray-400"}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep >= 3 ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
              3
            </div>
            <span>Add Notes</span>
          </div>
        </div>
      </div>

      {/* Property Info */}
      {job && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{job.property.title}</CardTitle>
            <CardDescription className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {job.property.address}, {job.property.city}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Upload Photos */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Upload Property Photos</CardTitle>
              <CardDescription>
                Upload at least 5 clear photos showing different angles of the property
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Button */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <UploadButton<OurFileRouter, "propertyImages">
                  endpoint="propertyImages"
                  onClientUploadComplete={(res) => {
                    const urls = res.map((file) => file.url);
                    handleImageUpload(urls);
                  }}
                  onUploadError={(uploadError: Error) => {
                    setError(uploadError.message);
                  }}
                />
                <p className="text-sm text-gray-600 mt-2">
                  Upload JPG, PNG or JPEG files (Max 10MB each)
                </p>
              </div>

              {/* fix line 227: <img> → <Image /> */}
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {uploadedImages.map((url, index) => (
                    <div key={index} className="relative group">
                      <div className="relative w-full h-32">
                        <Image
                          src={url}
                          alt={`Upload ${index + 1}`}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {uploadedImages.length < 5 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You need to upload at least 5 photos. Current: {uploadedImages.length}/5
                  </AlertDescription>
                </Alert>
              )}

              {errors.completionImages && (
                <p className="text-sm text-red-500">{errors.completionImages.message}</p>
              )}

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={uploadedImages.length < 5}
                >
                  Next: Mark Boundary
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Mark Boundary */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Mark Property Boundary</CardTitle>
              <CardDescription>
                Draw the property boundary on the map
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Map Component would go here */}
              <div className="border rounded-lg h-96 bg-gray-100 flex items-center justify-center">
                <p className="text-gray-500">
                  Interactive map for boundary marking will be implemented here
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Use the satellite view to accurately mark the property boundaries.
                  Zoom in to the last level for precision.
                </AlertDescription>
              </Alert>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                >
                  Back to Photos
                </Button>
                <Button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                >
                  Next: Add Notes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Add Notes */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Completion Notes</CardTitle>
              <CardDescription>
                Add any important notes or observations about the property
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="completionNotes">Notes *</Label>
                <Textarea
                  id="completionNotes"
                  {...register("completionNotes")}
                  placeholder="Describe what you observed, any challenges, unique features of the property, etc."
                  rows={6}
                  className="mt-2"
                />
                <div className="flex justify-between mt-2">
                  {errors.completionNotes && (
                    <p className="text-sm text-red-500">{errors.completionNotes.message}</p>
                  )}
                  <p className="text-sm text-gray-500 ml-auto">
                    {completionNotes.length} characters
                  </p>
                </div>
              </div>

              {/* Summary */}
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Ready to submit:</strong>
                  <ul className="list-disc list-inside mt-2 text-sm">
                    <li>{uploadedImages.length} photos uploaded</li>
                    <li>Property boundary marked</li>
                    <li>{completionNotes.length} characters of notes</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  disabled={isSubmitting}
                >
                  Back to Boundary
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner className="mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Complete Job
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
}