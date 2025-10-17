// apps/platform/app/(dashboard)/properties/[id]/marking/request/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Phone, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import LoadingSpinner from '@/components/shared/feedback/LoadingSpinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Validation schema
const markingRequestSchema = z.object({
  contactPersonName: z.string().min(2, 'Name must be at least 2 characters'),
  contactPersonPhone: z.string().regex(/^\+?234\d{10}$/, 'Invalid Nigerian phone number'),
  accessInstructions: z.string().optional(),
  urgencyLevel: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  markerOption: z.enum(['SELF', 'NEWCONDO', 'KNOWN_PERSON', 'AGENT_QUEUE']),
  guideName: z.string().optional(),
  guidePhone: z.string().optional(),
});

type MarkingRequestFormData = z.infer<typeof markingRequestSchema>;

interface MarkingOption {
  id: string;
  title: string;
  description: string;
  cost: number;
  timeframe: string;
  icon: React.ReactNode;
}

export default function RequestMarkingJobPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const propertyId = params.id as string;
  const [property, setProperty] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<string>('AGENT_QUEUE');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<MarkingRequestFormData>({
    resolver: zodResolver(markingRequestSchema),
    defaultValues: {
      markerOption: 'AGENT_QUEUE',
      urgencyLevel: 'NORMAL',
    },
  });

  const markerOption = watch('markerOption');

  const markingOptions: MarkingOption[] = [
    {
      id: 'SELF',
      title: 'Mark It Yourself',
      description: 'Mark the property boundary yourself using our interactive mapping tool',
      cost: 0,
      timeframe: 'Immediate',
      icon: <MapPin className="w-6 h-6" />,
    },
    {
      id: 'KNOWN_PERSON',
      title: 'Send Someone You Know',
      description: 'Share a marking link with someone to mark on your behalf',
      cost: 0,
      timeframe: '24-48 hours',
      icon: <Phone className="w-6 h-6" />,
    },
    {
      id: 'AGENT_QUEUE',
      title: 'Assign to Available Agents',
      description: 'First-come-first-served queue of agents/renters near you',
      cost: 20000,
      timeframe: '3-hour slots',
      icon: <AlertCircle className="w-6 h-6" />,
    },
    {
      id: 'NEWCONDO',
      title: 'Newcondo Marking Service',
      description: 'Let our professional team handle the property marking',
      cost: 25000,
      timeframe: '1-2 business days',
      icon: <CheckCircle className="w-6 h-6" />,
    },
  ];

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/properties/${propertyId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch property');
        }

        const data = await response.json();
        setProperty(data.property);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  const onSubmit = async (data: MarkingRequestFormData) => {
    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        ...data,
        propertyId,
        requestedBy: user?.id,
      };

      const response = await fetch('/api/marking-jobs/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create marking job');
      }

      const result = await response.json();
      setSuccess(true);

      setTimeout(() => {
        if (data.markerOption === 'SELF') {
          router.push(`/properties/${propertyId}/boundary-marking`);
        } else {
          router.push(`/properties/${propertyId}/marking/queue-status?jobId=${result.jobId}`);
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create marking job');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (error && !property) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Property not found</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900">Marking Job Created</h2>
            <p className="text-gray-600">
              Your marking job has been successfully created. Redirecting...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          ← Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight mt-4">Request Property Marking</h1>
        <p className="text-gray-600 mt-2">{property.title}</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Select Marking Method */}
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Select Marking Method</CardTitle>
            <CardDescription>
              Choose how you want your property marked
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {markingOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setSelectedMarker(option.id);
                    setValue('markerOption', option.id as any);
                  }}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedMarker === option.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={selectedMarker === option.id ? 'text-blue-600' : 'text-gray-600'}>
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{option.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{option.description}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded">
                          {option.timeframe}
                        </span>
                        {option.cost > 0 && (
                          <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            ₦{option.cost.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Contact Information</CardTitle>
            <CardDescription>
              Person who will be on-site during marking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactPersonName">Contact Person Name *</Label>
                <Input
                  id="contactPersonName"
                  {...register('contactPersonName')}
                  placeholder="Full name"
                  className="mt-1"
                />
                {errors.contactPersonName && (
                  <p className="text-xs text-red-600 mt-1">{errors.contactPersonName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="contactPersonPhone">Contact Person Phone *</Label>
                <Input
                  id="contactPersonPhone"
                  {...register('contactPersonPhone')}
                  placeholder="+234 XXX XXXX XXX"
                  className="mt-1"
                />
                {errors.contactPersonPhone && (
                  <p className="text-xs text-red-600 mt-1">{errors.contactPersonPhone.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="accessInstructions">Access Instructions</Label>
              <Textarea
                id="accessInstructions"
                {...register('accessInstructions')}
                placeholder="Describe how to access the property (gate code, directions, etc.)"
                className="mt-1 min-h-24"
              />
              {errors.accessInstructions && (
                <p className="text-xs text-red-600 mt-1">{errors.accessInstructions.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Conditional Fields Based on Marker Option */}
        {markerOption === 'KNOWN_PERSON' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Guide Information</CardTitle>
              <CardDescription>
                Person who will assist the marker to locate the property
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="guideName">Guide Name (Optional)</Label>
                  <Input
                    id="guideName"
                    {...register('guideName')}
                    placeholder="Full name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="guidePhone">Guide Phone (Optional)</Label>
                  <Input
                    id="guidePhone"
                    {...register('guidePhone')}
                    placeholder="+234 XXX XXXX XXX"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3/4: Urgency Level */}
        <Card>
          <CardHeader>
            <CardTitle>Step {markerOption === 'KNOWN_PERSON' ? '4' : '3'}: Urgency Level</CardTitle>
            <CardDescription>
              How soon do you need this property marked?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select defaultValue="NORMAL" onValueChange={(value) => setValue('urgencyLevel', value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">
                  <div>
                    <p className="font-medium">Low - Within 7 days</p>
                    <p className="text-xs text-gray-600">Standard processing</p>
                  </div>
                </SelectItem>
                <SelectItem value="NORMAL">
                  <div>
                    <p className="font-medium">Normal - Within 3-5 days</p>
                    <p className="text-xs text-gray-600">Regular queue</p>
                  </div>
                </SelectItem>
                <SelectItem value="HIGH">
                  <div>
                    <p className="font-medium">High - Within 1-2 days</p>
                    <p className="text-xs text-gray-600">Priority processing</p>
                  </div>
                </SelectItem>
                <SelectItem value="URGENT">
                  <div>
                    <p className="font-medium">Urgent - Within 24 hours</p>
                    <p className="text-xs text-gray-600">Top priority</p>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.urgencyLevel && (
              <p className="text-xs text-red-600 mt-1">{errors.urgencyLevel.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Cost Summary */}
        {(markerOption === 'AGENT_QUEUE' || markerOption === 'NEWCONDO') && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">Cost Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Marking Service Fee</span>
                  <span className="font-semibold">
                    ₦{markerOption === 'AGENT_QUEUE' ? '20,000' : '25,000'}
                  </span>
                </div>
                {markerOption === 'AGENT_QUEUE' && (
                  <>
                    <p className="text-xs text-gray-600 mt-2">
                      💡 Agent/Renter earns: ₦5,000 (25% of fee)
                    </p>
                    <p className="text-xs text-gray-600">
                      🏢 Newcondo earns: ₦15,000 (75% of fee)
                    </p>
                  </>
                )}
                {markerOption === 'NEWCONDO' && (
                  <p className="text-xs text-gray-600 mt-2">
                    Professional marking service included
                  </p>
                )}
              </div>

              <Alert className="bg-white border-blue-200 mt-4">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm">
                  Payment will be processed via your virtual account. You'll receive a receipt after successful payment.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Important Notes */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="space-y-2">
            <p className="font-semibold">Important Information:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>You have 2-3 days to confirm the marking after completion</li>
              <li>Agents are assigned 3-hour time slots to complete marking</li>
              <li>Completion photos will be required for verification</li>
              <li>If marking isn't confirmed, the agent receives compensation and you'll need to request marking again</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Form Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {submitting ? (
              <>
                <span className="inline-block animate-spin mr-2">⟳</span>
                Creating Marking Job...
              </>
            ) : (
              'Create Marking Job'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}