'use client';
// apps/platform/components/properties/PropertyActions.tsx

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import {
  Heart,
  // Share2,
  MessageCircle,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Copy,
  CheckCheck,
} from 'lucide-react';
import { Button } from '@newcondo/ui/components/button';
import { Badge } from '@newcondo/ui/components/badge';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PropertyActionsProps {
  property: {
    id: string;
    title: string;
    price?: number | null;
    currency: string;
    isAvailable: boolean;
    status: string;
    structure: string;
    units?: Array<{
      id: string;
      unitNumber: string;
      price: number;
      isAvailable: boolean;
      bedrooms?: number | null;
    }>;
    [key: string]: unknown;
  };
  selectedUnit?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PropertyActions({ property, selectedUnit }: PropertyActionsProps) {
  const router = useRouter();
  const {  isAuthenticated } = useAuth();
  const [isFavourited, setIsFavourited] = useState(false);
  const [copied, setCopied] = useState(false);

  // Resolve the active unit for multi-family
  const activeUnit = property.structure === 'MULTI_FAMILY'
    ? property.units?.find((u) => u.id === selectedUnit) ?? property.units?.[0]
    : null;

  const displayPrice = activeUnit
    ? Number(activeUnit.price)
    : property.price != null
    ? Number(property.price)
    : null;

  const isAvailable = activeUnit ? activeUnit.isAvailable : property.isAvailable;

  // ── Favourite toggle ──────────────────────────────────────────────────────

  const { mutate: toggleFavourite, isPending: isFavPending } = useMutation({
    mutationFn: async () => {
      if (isFavourited) {
        await apiClient.delete(`/properties/${property.id}/favourite`);
      } else {
        await apiClient.post(`/properties/${property.id}/favourite`);
      }
    },
    onSuccess: () => setIsFavourited((f) => !f),
  });

  const handleFavourite = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/properties/${property.id}`);
      return;
    }
    toggleFavourite();
  };

  // ── Copy link ─────────────────────────────────────────────────────────────

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ── Rent / Pay ────────────────────────────────────────────────────────────

  const handleRent = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/properties/${property.id}`);
      return;
    }
    const unitParam = activeUnit ? `?unit=${activeUnit.id}` : '';
    router.push(`/dashboard/properties/${property.id}/rent${unitParam}`);
  };

  // ── Enquire ───────────────────────────────────────────────────────────────

  const handleEnquire = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/properties/${property.id}`);
      return;
    }
    router.push(`/dashboard/messages/new?propertyId=${property.id}`);
  };

  const formatNGN = (amount: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: property.currency,
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="space-y-4">
      {/* Price */}
      {displayPrice != null && (
        <div>
          <span className="text-3xl font-bold text-gray-900">{formatNGN(displayPrice)}</span>
          <span className="ml-1 text-sm text-gray-500">/ month</span>
        </div>
      )}

      {/* Availability badge */}
      {isAvailable ? (
        <Badge className="bg-green-100 text-green-800 gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Available Now
        </Badge>
      ) : (
        <Badge className="bg-red-100 text-red-700 gap-1">
          <AlertTriangle className="h-3.5 w-3.5" />
          Not Available
        </Badge>
      )}

      {/* Unit selector for multi-family */}
      {property.structure === 'MULTI_FAMILY' && property.units && property.units.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-gray-700">Select Unit</p>
          <div className="flex flex-wrap gap-2">
            {property.units.map((unit) => (
              <button
                key={unit.id}
                onClick={() =>
                  router.push(`/properties/${property.id}?unit=${unit.id}`, { scroll: false })
                }
                disabled={!unit.isAvailable}
                className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                  unit.id === (activeUnit?.id)
                    ? 'border-violet-500 bg-violet-50 text-violet-700 font-medium'
                    : unit.isAvailable
                    ? 'border-gray-200 hover:border-gray-300'
                    : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              >
                {unit.unitNumber}
                {!unit.isAvailable && ' (taken)'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CTA buttons */}
      <div className="space-y-2 pt-1">
        {property.status === 'PUBLISHED' && isAvailable && (
          <Button className="w-full gap-2" onClick={handleRent}>
            <CreditCard className="h-4 w-4" />
            Rent This Property
          </Button>
        )}

        <Button variant="outline" className="w-full gap-2" onClick={handleEnquire}>
          <MessageCircle className="h-4 w-4" />
          Send Enquiry
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className={`flex-1 gap-2 ${isFavourited ? 'text-red-600 border-red-200 hover:bg-red-50' : ''}`}
            onClick={handleFavourite}
            disabled={isFavPending}
          >
            <Heart className={`h-4 w-4 ${isFavourited ? 'fill-red-500 text-red-500' : ''}`} />
            {isFavourited ? 'Saved' : 'Save'}
          </Button>

          <Button variant="outline" className="flex-1 gap-2" onClick={handleCopy}>
            {copied ? (
              <>
                <CheckCheck className="h-4 w-4 text-green-600" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Link
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}