'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@newcondo/ui/components/card';
import { Button } from '@newcondo/ui/components/button';
import { Textarea } from '@newcondo/ui/components/textarea';
import { Badge } from '@newcondo/ui/components/badge';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@newcondo/ui/components/form';
import { MarkingTimerCountdown } from './MarkingTimerCountdown';
import MarkingImageUploader from './MarkingImageUploader';
import { MapPin, Phone, User, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { markingApi } from '@/lib/api/marking';
import { toast } from 'sonner';
import type { MarkingJobResponse } from '@/lib/api/marking';

interface UploadedImage {
    id: string;
    url: string;
    name: string;
    size: number;
    category?: string;
}

const completionSchema = z.object({
    completionNotes: z.string().min(10, 'Please provide at least 10 characters describing the marking'),
    completionImages: z.array(z.string()).min(1, 'Please upload at least one image of the marked property'),
    boundaryData: z.any().optional(),
});

type CompletionFormValues = z.infer<typeof completionSchema>;

interface CompleteMarkingJobClientProps {
    job: MarkingJobResponse;
    timeRemainingMinutes: number;
}

export function CompleteMarkingJobClient({
    job,
    timeRemainingMinutes,
}: CompleteMarkingJobClientProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

    const form = useForm<CompletionFormValues>({
        resolver: zodResolver(completionSchema),
        defaultValues: {
            completionNotes: '',
            completionImages: [],
            boundaryData: null,
        },
    });

    const expiryTime = new Date(Date.now() + timeRemainingMinutes * 60 * 1000);

    const fee = Number(job.markingFee);
    const initialPayout = fee * 0.05;
    const remainingPayout = fee * 0.20;

    const onSubmit = async (values: CompletionFormValues) => {
        try {
            setIsSubmitting(true);

            await markingApi.completeJob({
                jobId: job.id,
                completionNotes: values.completionNotes,
                completionImages: uploadedImages.map((img) => img.url),
                boundaryData: values.boundaryData ?? {
                    boundaryCoordinates: { type: 'Polygon', coordinates: [] },
                    gpsCoordinates: { lat: 0, lng: 0 },
                    verificationPhotos: uploadedImages,
                    buildingFingerprint: '',
                },
            });

            toast.success('Marking job completed! The property owner has been notified to confirm.');
            router.push('/marking/my-jobs');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to complete marking job');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImagesUploaded = (images: UploadedImage[]) => {
        setUploadedImages(images);
        form.setValue('completionImages', images.map((img) => img.url));
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Complete Marking Job</h1>
                <p className="text-muted-foreground mt-1">
                    Job #{job.id.slice(0, 8)} · {job.property?.title}
                </p>
            </div>

            {/* Timer */}
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                <CardContent className="flex items-center gap-3 pt-4 pb-4">
                    <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            Time remaining to complete this job
                        </p>
                        <MarkingTimerCountdown
                            expiryTime={expiryTime}
                            totalDuration={3 * 60 * 60 * 1000}
                            variant="compact"
                            showProgress={false}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Property Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Property Details</CardTitle>
                    <CardDescription>Use this information to locate the property</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium">{job.property?.title}</p>
                            <p className="text-sm text-muted-foreground">
                                {job.property?.address}, {job.property?.city}, {job.property?.state}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium">Contact Person</p>
                            <p className="text-sm text-muted-foreground">{job.contactPersonName}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium">Phone</p>
                            <a
                                href={`tel:${job.contactPersonPhone}`}
                                className="text-sm text-primary hover:underline"
                            >
                                {job.contactPersonPhone}
                            </a>
                        </div>
                    </div>

                    {job.accessInstructions && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <span className="font-medium">Access Instructions: </span>
                                {job.accessInstructions}
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Property Images (if provided) */}
            {job.property?.images  && job.property.images.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Property Reference Images</CardTitle>
                        <CardDescription>Use these to identify the correct building</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-2">
                            {job.property.images.slice(0, 6).map((img, i) => (
                                <img
                                    key={i}
                                    src={typeof img === 'string' ? img : (img as any).url}
                                    alt={`Property image ${i + 1}`}
                                    className="w-full h-24 object-cover rounded-md border"
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Completion Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Submit Completion</CardTitle>
                    <CardDescription>
                        Upload photos of the marked property and provide notes
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Image Upload */}
                            <div className="space-y-2">
                                <FormLabel>
                                    Marking Photos <span className="text-destructive">*</span>
                                </FormLabel>
                                <p className="text-xs text-muted-foreground">
                                    Upload clear photos showing the marked boundary, key parts of the building,
                                    and surrounding areas. Minimum 1 photo required.
                                </p>
                                <MarkingImageUploader
                                    jobId={job.id}
                                    onImagesUploaded={handleImagesUploaded}
                                    maxImages={10}
                                />
                                {form.formState.errors.completionImages && (
                                    <p className="text-sm text-destructive">
                                        {form.formState.errors.completionImages.message}
                                    </p>
                                )}
                            </div>

                            {/* Completion Notes */}
                            <FormField
                                control={form.control}
                                name="completionNotes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Completion Notes <span className="text-destructive">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Describe what you marked, any challenges you encountered, notable features of the property boundary, etc."
                                                className="min-h-[120px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Earnings Info */}
                            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800 dark:text-green-200">
                                    <span className="font-medium">
                                        ₦{initialPayout.toLocaleString()}
                                    </span>{' '}
                                    will be credited to your wallet immediately. The remaining{' '}
                                    <span className="font-medium">
                                        ₦{remainingPayout.toLocaleString()}
                                    </span>{' '}
                                    will be released once the property owner confirms the marking.
                                </AlertDescription>
                            </Alert>

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                    disabled={isSubmitting}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || uploadedImages.length === 0}
                                    className="flex-1"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Completion'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}