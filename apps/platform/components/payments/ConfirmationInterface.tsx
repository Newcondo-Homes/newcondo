'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CheckCircle, AlertTriangle, Clock, MapPin, User, Phone } from 'lucide-react';
import { Button } from '@newcondo/ui/';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/';
import { Checkbox } from '@newcondo/ui/';
import { Textarea } from '@newcondo/ui/';
import { Badge } from '@newcondo/ui/';
import { ConfirmationTimer } from './ConfirmationTimer';
import { useConfirmation } from '@/hooks/useConfirmation';
import { useDispute } from '@/hooks/useDispute';
import type { VerificationChecklist } from '@/types/confirmation';
import { DisputeReason, PreferredResolution } from '@/types/dispute';

interface RentalWithRelations {
  id: string;
  propertyId: string;
  unitId?: string | null;
  renterId: string;
  monthlyRent: number | { toNumber: () => number };
  confirmationDeadline?: Date | null;
  isConfirmed: boolean;
  confirmedAt?: Date | null;
  property: {
    id: string;
    title: string;
    address: string;
    city: string;
    state: string;
    images: { url: string; altText?: string | null }[];
    owner: { id: string; name?: string | null; email: string; phone?: string | null };
    agent?: { id: string; name?: string | null; email: string; phone?: string | null } | null;
  };
  unit?: {
    id: string;
    unitNumber: string;
    floor?: number | null;
    images: { url: string; altText?: string | null }[];
  } | null;
  renter: { id: string; name?: string | null; email: string };
  payments: { id: string; amount: number | { toNumber: () => number }; status: string }[];
}

interface Props {
  rental: RentalWithRelations;
  timeRemaining: number;
  isExpired: boolean;
}

const DEFAULT_CHECKLIST: VerificationChecklist = {
  propertyExists: false,
  matchesDescription: false,
  keysReceived: false,
  conditionSatisfactory: false,
  utilitiesWorking: false,
  securityAdequate: false,
  accessGranted: false,
  documentationComplete: false,
};

const CHECKLIST_LABELS: Record<keyof VerificationChecklist, string> = {
  propertyExists: 'I have physically visited and confirmed the property exists',
  matchesDescription: 'The property matches the listing description',
  keysReceived: 'I have received the keys / access credentials',
  conditionSatisfactory: 'The condition of the property is satisfactory',
  utilitiesWorking: 'Utilities (water, electricity) are working',
  securityAdequate: 'Security arrangements are adequate',
  accessGranted: 'I have been granted full access to the property',
  documentationComplete: 'All required documentation has been provided',
};

export function ConfirmationInterface({ rental, timeRemaining, isExpired }: Props) {
  const router = useRouter();
  const [checklist, setChecklist] = useState<VerificationChecklist>(DEFAULT_CHECKLIST);
  const [notes, setNotes] = useState('');
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeDescription, setDisputeDescription] = useState('');

  const { confirmProperty, isConfirming } = useConfirmation();
  const { createDispute, isCreating } = useDispute();

  const payment = rental.payments[0];
  const primaryImage =
    rental.unit?.images[0]?.url ?? rental.property.images[0]?.url ?? null;
  const amount =
    typeof payment?.amount === 'object'
      ? payment.amount.toNumber()
      : (payment?.amount ?? 0);

  const allChecked = Object.values(checklist).every(Boolean);

  function toggle(key: keyof VerificationChecklist) {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleConfirm() {
    if (!payment) return;
    await confirmProperty({
      paymentId: payment.id,
      verificationChecklist: checklist,
      notes: notes || undefined,
    });
    router.push('/dashboard');
  }

  async function handleDispute() {
    if (!payment || !disputeDescription.trim()) return;
    await createDispute({
      paymentId: payment.id,
      rentalId: rental.id,
      reason: DisputeReason.PROPERTY_NOT_AS_DESCRIBED,
      description: disputeDescription,
      preferredResolution: PreferredResolution.REFUND,
    });
    router.push('/payments/history');
  }

  if (rental.isConfirmed) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <CheckCircle className="h-16 w-16 text-green-500" />
          <h2 className="text-2xl font-semibold text-green-800">Property Confirmed</h2>
          <p className="text-green-700 text-center">
            You confirmed this property on{' '}
            {rental.confirmedAt
              ? new Date(rental.confirmedAt).toLocaleDateString()
              : '—'}
            . Payment has been released to the relevant parties.
          </p>
          <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
        </CardContent>
      </Card>
    );
  }

  if (isExpired) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <AlertTriangle className="h-16 w-16 text-orange-500" />
          <h2 className="text-2xl font-semibold text-orange-800">Confirmation Period Expired</h2>
          <p className="text-orange-700 text-center">
            The 24-hour confirmation window has passed. Payment has been automatically released.
          </p>
          <Button variant="outline" onClick={() => router.push('/payments/history')}>
            View Payment History
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Confirm Your Property</h1>
        <p className="text-muted-foreground mt-1">
          Please verify and confirm the property within 24 hours of payment.
        </p>
      </div>

      {/* Timer */}
      {rental.confirmationDeadline && (
        <ConfirmationTimer
          deadline={rental.confirmationDeadline}
        />
      )}

      {/* Property summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Property Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {primaryImage && (
            <div className="relative h-48 w-full rounded-md overflow-hidden">
              <Image src={primaryImage} alt={rental.property.title} fill className="object-cover" />
            </div>
          )}

          <div>
            <h3 className="font-semibold text-lg">{rental.property.title}</h3>
            {rental.unit && (
              <Badge variant="secondary" className="mt-1">
                Unit {rental.unit.unitNumber}
                {rental.unit.floor != null ? ` · Floor ${rental.unit.floor}` : ''}
              </Badge>
            )}
          </div>

          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              {rental.property.address}, {rental.property.city}, {rental.property.state}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Contact (Owner)</p>
              <p className="font-medium text-sm">{rental.property.owner.name ?? '—'}</p>
              {rental.property.owner.phone && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {rental.property.owner.phone}
                </div>
              )}
            </div>
            {rental.property.agent && (
              <div>
                <p className="text-xs text-muted-foreground">Listing Agent</p>
                <p className="font-medium text-sm">{rental.property.agent.name ?? '—'}</p>
                {rental.property.agent.phone && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {rental.property.agent.phone}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-muted-foreground">Amount paid</span>
            <span className="font-semibold">
              ₦{amount.toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Verification checklist */}
      {!showDisputeForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verification Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(Object.keys(DEFAULT_CHECKLIST) as (keyof VerificationChecklist)[]).map((key) => (
              <label key={key} className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={checklist[key]}
                  onCheckedChange={() => toggle(key)}
                  className="mt-0.5"
                />
                <span className="text-sm leading-tight">{CHECKLIST_LABELS[key]}</span>
              </label>
            ))}

            <div className="pt-2">
              <Textarea
                placeholder="Additional notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              className="w-full"
              disabled={!allChecked || isConfirming || !payment}
              onClick={handleConfirm}
            >
              {isConfirming ? 'Confirming…' : 'Confirm Property & Release Payment'}
            </Button>

            <Button
              variant="outline"
              className="w-full text-destructive border-destructive hover:bg-destructive/10"
              onClick={() => setShowDisputeForm(true)}
            >
              Raise a Dispute
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dispute form */}
      {showDisputeForm && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Raise a Dispute</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Describe the issue with the property. Our team will review your dispute within 24–48 hours.
            </p>
            <Textarea
              placeholder="Describe the issue in detail…"
              value={disputeDescription}
              onChange={(e) => setDisputeDescription(e.target.value)}
              rows={5}
            />
            <div className="flex gap-3">
              <Button
                variant="destructive"
                className="flex-1"
                disabled={!disputeDescription.trim() || isCreating || !payment}
                onClick={handleDispute}
              >
                {isCreating ? 'Submitting…' : 'Submit Dispute'}
              </Button>
              <Button variant="outline" onClick={() => setShowDisputeForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}