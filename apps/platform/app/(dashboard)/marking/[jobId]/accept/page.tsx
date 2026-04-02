'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Button } from '@newcondo/ui/components/button';
import { Checkbox } from '@newcondo/ui/components/checkbox';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';
import { Skeleton } from '@newcondo/ui/components/skeleton';
import { toast } from '@newcondo/ui/';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  FileText,
  Shield,
  Info
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';

interface JobSummary {
  id: string;
  propertyId: string;
  markingFee: number;
  property: {
    title: string;
    address: string;
    city: string;
    state: string;
  };
  status: string;
}

export default function AcceptJobPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<JobSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [understandingAccepted, setUnderstandingAccepted] = useState(false);
  const [availabilityConfirmed, setAvailabilityConfirmed] = useState(false);

  useEffect(() => {
    fetchJobSummary();
  }, [jobId]);

  const fetchJobSummary = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/marking/jobs/${jobId}/summary`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch job summary');
      }

      const data = await response.json();
      setJob(data.job);
    } catch (err) {
      toast.error('Error',{
        description: 'Failed to load job information',
      });
      router.push('/marking/available-jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptJob = async () => {
    if (!termsAccepted || !understandingAccepted || !availabilityConfirmed) {
      toast.error('Incomplete',{
        description: 'Please accept all terms and confirmations',
      });
      return;
    }

    try {
      setAccepting(true);

      const response = await fetch(`/api/marking/jobs/${jobId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to accept job');
      }

      const data = await response.json();

      toast.success('Success!',{
        description: 'Job accepted successfully. You have 3 hours to complete it.',
      });

      router.push(`/marking/${jobId}/details`);
    } catch (err) {
      toast.error('Error',{
        description: err instanceof Error ? err.message : 'Failed to accept job',
      });
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Job not found or no longer available</AlertDescription>
        </Alert>
        <Button 
          onClick={() => router.push('/marking/available-jobs')} 
          variant="outline" 
          className="mt-4"
        >
          View Available Jobs
        </Button>
      </div>
    );
  }

  const canProceed = termsAccepted && understandingAccepted && availabilityConfirmed;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Accept Marking Job</h1>
        <p className="text-muted-foreground mt-2">
          Review the terms and confirm your availability before accepting
        </p>
      </div>

      {/* Job Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Job Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Property</p>
            <p className="font-medium">{job.property.title}</p>
            <p className="text-sm text-muted-foreground">
              {job.property.address}, {job.property.city}, {job.property.state}
            </p>
          </div>

          <div className="flex justify-between items-center pt-3 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Your Earnings</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(Number(job.markingFee) * 0.25)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Job Fee</p>
              <p className="text-lg font-semibold">
                {formatCurrency(Number(job.markingFee))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Commitment Alert */}
      <Alert className="mb-6 border-yellow-500 bg-yellow-50">
        <Clock className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <strong>3-Hour Time Window:</strong> Once you accept this job, you'll have exactly 3 hours to complete the marking. 
          If you don't complete it within this timeframe, the job will be automatically reassigned to the next agent in queue.
        </AlertDescription>
      </Alert>

      {/* Terms and Conditions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Terms & Responsibilities
          </CardTitle>
          <CardDescription>
            Please read and accept the following terms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Terms */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Your Responsibilities:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Contact the property owner's representative using the provided contact information</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Visit the property and accurately mark the boundaries on the satellite map</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Take clear photos of key areas and rooms as specified in the requirements</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Complete the job within the 3-hour time window</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Be professional and respectful when interacting with property contacts</span>
              </li>
            </ul>
          </div>

          {/* Payment Terms */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Payment Terms:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Upon completion, ₦1,000 will be sent to your wallet as initial payment</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>The property owner has 2-3 days to verify the marking</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Once verified, the remaining balance ({formatCurrency(Number(job.markingFee) * 0.25 - 1000)}) will be released</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>If the owner doesn't verify within the timeframe, partial compensation will be provided</span>
              </li>
            </ul>
          </div>

          {/* Checkboxes */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-start space-x-3">
              <Checkbox 
                id="terms" 
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
              />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I have read and accept the terms and responsibilities listed above
              </label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox 
                id="understanding" 
                checked={understandingAccepted}
                onCheckedChange={(checked) => setUnderstandingAccepted(checked as boolean)}
              />
              <label
                htmlFor="understanding"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I understand the 3-hour time limit and the payment structure
              </label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox 
                id="availability" 
                checked={availabilityConfirmed}
                onCheckedChange={(checked) => setAvailabilityConfirmed(checked as boolean)}
              />
              <label
                htmlFor="availability"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I confirm that I am available to complete this job within the next 3 hours
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legal Protection Notice */}
      <Alert className="mb-6">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Legal Protection:</strong> By accepting this job, you agree to Newcondo's Property Marking Service Terms. 
          Newcondo is not liable for any incidents that occur during property visits. You are responsible for your own safety and insurance.
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="flex-1"
          disabled={accepting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleAcceptJob}
          className="flex-1"
          disabled={!canProceed || accepting}
        >
          {accepting ? (
            <>Processing...</>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Accept Job & Start Timer
            </>
          )}
        </Button>
      </div>

      {!canProceed && (
        <p className="text-sm text-center text-muted-foreground mt-4">
          Please accept all terms to continue
        </p>
      )}
    </div>
  );
}