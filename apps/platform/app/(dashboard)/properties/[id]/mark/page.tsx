'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Button } from '@newcondo/ui/components/button';
import { Input } from '@newcondo/ui/components/input';
import { Label } from '@newcondo/ui/components/label';
import { Textarea } from '@newcondo/ui/components/textarea';
import { RadioGroup, RadioGroupItem } from '@newcondo/ui/components/radio-group';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';
import { Badge } from '@newcondo/ui/components/badge';
import { Separator } from '@newcondo/ui/components/separator';
import { MapPin, User, Phone, Calendar, Clock, AlertCircle, CheckCircle, Link as LinkIcon, Building2, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type MarkingOption = 'SELF' | 'NEWCONDO' | 'KNOWN_PERSON' | 'ASSIGN_AGENT';

interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
  images: { url: string; isPrimary: boolean }[];
  owner: {
    id: string;
    name: string;
    phone: string;
  };
}

interface MarkingJobRequest {
  markingOption: MarkingOption;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: string;
  urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

export default function PropertyMarkingPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [markingOption, setMarkingOption] = useState<MarkingOption>('SELF');
  const [shareableLink, setShareableLink] = useState<string | null>(null);
  const [formData, setFormData] = useState<MarkingJobRequest>({
    markingOption: 'SELF',
    contactPersonName: '',
    contactPersonPhone: '',
    accessInstructions: '',
    urgencyLevel: 'NORMAL'
  });

  useEffect(() => {
    fetchProperty();
  }, [propertyId]);

  const fetchProperty = async () => {
    try {
      const res = await fetch(`/api/properties/${propertyId}`);
      if (!res.ok) throw new Error('Failed to fetch property');
      const data = await res.json();
      setProperty(data);
      
      // Pre-fill contact details with owner info
      setFormData(prev => ({
        ...prev,
        contactPersonName: data.owner.name || '',
        contactPersonPhone: data.owner.phone || ''
      }));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load property details',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateShareableLink = async () => {
    try {
      const res = await fetch(`/api/marking/generate-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          contactPersonName: formData.contactPersonName,
          contactPersonPhone: formData.contactPersonPhone,
          accessInstructions: formData.accessInstructions
        })
      });

      if (!res.ok) throw new Error('Failed to generate link');
      const data = await res.json();
      
      setShareableLink(data.shareableLink);
      toast({
        title: 'Link Generated',
        description: 'Share this link with your chosen marker',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate shareable link',
        variant: 'destructive'
      });
    }
  };

  const handleCopyLink = () => {
    if (shareableLink) {
      navigator.clipboard.writeText(shareableLink);
      toast({
        title: 'Link Copied',
        description: 'Shareable link copied to clipboard'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (markingOption === 'KNOWN_PERSON' && !shareableLink) {
      toast({
        title: 'Generate Link First',
        description: 'Please generate a shareable link before proceeding',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/marking/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          ...formData,
          markingOption
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create marking job');
      }

      const data = await res.json();

      // Redirect based on marking option
      if (markingOption === 'SELF') {
        router.push(`/dashboard/properties/${propertyId}/mark/complete`);
      } else if (markingOption === 'KNOWN_PERSON') {
        toast({
          title: 'Link Generated',
          description: 'Share the link with your chosen marker'
        });
        router.push(`/dashboard/properties/${propertyId}/marking-status`);
      } else {
        // Redirect to payment for NEWCONDO or ASSIGN_AGENT
        router.push(`/dashboard/payments/marking/${data.jobId}`);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create marking job',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!property) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Property not found</AlertDescription>
      </Alert>
    );
  }

  const markingFees = {
    SELF: 0,
    NEWCONDO: 25000,
    KNOWN_PERSON: 0,
    ASSIGN_AGENT: 20000
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Mark Property Boundary</h1>
        <p className="text-muted-foreground mt-2">
          Define your property boundaries on the map to prevent duplicates and verify ownership
        </p>
      </div>

      {/* Property Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Property Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {property.images[0] && (
              <img
                src={property.images[0].url}
                alt={property.title}
                className="w-24 h-24 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{property.title}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-4 w-4" />
                {property.address}, {property.city}, {property.state}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marking Options */}
      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Choose Marking Option</CardTitle>
            <CardDescription>
              Select how you want to mark your property boundary
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={markingOption}
              onValueChange={(value) => {
                setMarkingOption(value as MarkingOption);
                setFormData(prev => ({ ...prev, markingOption: value as MarkingOption }));
              }}
              className="space-y-4"
            >
              {/* Self Marking */}
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="SELF" id="self" />
                <div className="flex-1">
                  <Label htmlFor="self" className="cursor-pointer">
                    <div className="font-semibold">Mark it Myself</div>
                    <div className="text-sm text-muted-foreground">
                      I'll mark the property boundary myself using the interactive map
                    </div>
                    <Badge variant="secondary" className="mt-2">FREE</Badge>
                  </Label>
                </div>
              </div>

              {/* Known Person */}
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="KNOWN_PERSON" id="known" />
                <div className="flex-1">
                  <Label htmlFor="known" className="cursor-pointer">
                    <div className="font-semibold flex items-center gap-2">
                      Send Someone I Know
                      <Share2 className="h-4 w-4" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Generate a shareable link for someone you trust to mark the property
                    </div>
                    <Badge variant="secondary" className="mt-2">FREE</Badge>
                  </Label>
                </div>
              </div>

              {/* Assign to Agent */}
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="ASSIGN_AGENT" id="agent" />
                <div className="flex-1">
                  <Label htmlFor="agent" className="cursor-pointer">
                    <div className="font-semibold">Assign to Newcondo Agent</div>
                    <div className="text-sm text-muted-foreground">
                      Available agents nearby will be notified and assigned on first-come basis
                    </div>
                    <Badge variant="default" className="mt-2">₦20,000</Badge>
                  </Label>
                </div>
              </div>

              {/* Newcondo Service */}
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="NEWCONDO" id="newcondo" />
                <div className="flex-1">
                  <Label htmlFor="newcondo" className="cursor-pointer">
                    <div className="font-semibold">Newcondo Premium Service</div>
                    <div className="text-sm text-muted-foreground">
                      Our dedicated team will handle the property marking professionally
                    </div>
                    <Badge variant="default" className="mt-2">₦25,000</Badge>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              Provide contact details for property access coordination
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Person Name *</Label>
                <Input
                  id="contactName"
                  placeholder="Full name"
                  value={formData.contactPersonName}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPersonName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone *</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  placeholder="+234 XXX XXX XXXX"
                  value={formData.contactPersonPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPersonPhone: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Access Instructions (Optional)</Label>
              <Textarea
                id="instructions"
                placeholder="E.g., Use the back gate, ask for security, etc."
                value={formData.accessInstructions}
                onChange={(e) => setFormData(prev => ({ ...prev, accessInstructions: e.target.value }))}
                rows={3}
              />
            </div>

            {markingOption !== 'SELF' && (
              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency Level</Label>
                <select
                  id="urgency"
                  className="w-full p-2 border rounded-md"
                  value={formData.urgencyLevel}
                  onChange={(e) => setFormData(prev => ({ ...prev, urgencyLevel: e.target.value as any }))}
                >
                  <option value="LOW">Low - Within 1 week</option>
                  <option value="NORMAL">Normal - Within 3 days</option>
                  <option value="HIGH">High - Within 24 hours</option>
                  <option value="URGENT">Urgent - ASAP</option>
                </select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shareable Link Section */}
        {markingOption === 'KNOWN_PERSON' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Shareable Link
              </CardTitle>
              <CardDescription>
                Generate a secure link to share with your chosen marker
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!shareableLink ? (
                <Button
                  type="button"
                  onClick={handleGenerateShareableLink}
                  variant="outline"
                  className="w-full"
                >
                  Generate Shareable Link
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input value={shareableLink} readOnly className="flex-1" />
                    <Button type="button" onClick={handleCopyLink} variant="outline">
                      Copy
                    </Button>
                  </div>
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Share this link with the person who will mark your property. The link is secure and expires after use.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Cost Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Cost Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Marking Service Fee</span>
                <span className="font-semibold">
                  ₦{markingFees[markingOption].toLocaleString()}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>₦{markingFees[markingOption].toLocaleString()}</span>
              </div>
            </div>

            {markingOption === 'ASSIGN_AGENT' && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Agent receives ₦5,000 (25%) as compensation. Payment is held until marking is verified.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={submitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="flex-1"
          >
            {submitting ? 'Processing...' : markingOption === 'SELF' ? 'Start Marking' : 'Proceed to Payment'}
          </Button>
        </div>
      </form>
    </div>
  );
}