'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent } from '@newcondo/ui/components/card';
import { Button } from '@newcondo/ui/components/button';
import { Input } from '@newcondo/ui/components/input';
import { Label } from '@newcondo/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@newcondo/ui/components/select';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createVirtualAccount } from '@/lib/api/virtualAccounts';

// ─── Validation Schema ────────────────────────────────────────────────────────

const createVirtualAccountSchema = z.object({
  accountName: z
    .string()
    .min(3, 'Account name must be at least 3 characters')
    .max(100, 'Account name must be under 100 characters'),
  propertyId: z.string().optional(),
});

type CreateVirtualAccountFormData = z.infer<typeof createVirtualAccountSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
}

interface VirtualAccountCreationFormProps {
  userId: string;
  userRole: string;
  properties: Property[];
  preSelectedPropertyId?: string;
  returnUrl?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function VirtualAccountCreationForm({
  userId,
  userRole,
  properties,
  preSelectedPropertyId,
  returnUrl,
}: VirtualAccountCreationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateVirtualAccountFormData>({
    resolver: zodResolver(createVirtualAccountSchema),
    defaultValues: {
      accountName: '',
      propertyId: preSelectedPropertyId ?? '',
    },
  });

  const selectedPropertyId = watch('propertyId');

  // Auto-fill account name when a property is selected
  const handlePropertyChange = (propertyId: string) => {
    setValue('propertyId', propertyId);

    if (propertyId) {
      const property = properties.find(p => p.id === propertyId);
      if (property) {
        setValue('accountName', `${property.title} - Virtual Account`);
      }
    }
  };

  const onSubmit = async (data: CreateVirtualAccountFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const account = await createVirtualAccount({
        userId,
        accountName: data.accountName,
        propertyId: data.propertyId || undefined,
      });

      setSubmitSuccess(true);

      // Short delay so the user sees the success state before navigating
      setTimeout(() => {
        if (returnUrl) {
          router.push(returnUrl);
        } else {
          router.push(`/virtual-accounts/${account.id}`);
        }
      }, 1200);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Failed to create virtual account. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <h3 className="text-lg font-semibold text-gray-900">Account Created!</h3>
        <p className="text-sm text-gray-500">
          Your virtual account has been created. Redirecting you now…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Property selection (owners / agents with properties) */}
      {properties.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="propertyId">
            Link to Property{' '}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Select
            value={selectedPropertyId}
            onValueChange={handlePropertyChange}
          >
            <SelectTrigger id="propertyId">
              <SelectValue placeholder="Select a property (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No property — personal account</SelectItem>
              {properties.map(property => (
                <SelectItem key={property.id} value={property.id}>
                  <div className="flex flex-col">
                    <span>{property.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {property.address}, {property.city}, {property.state}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Linking a property allows tenants to pay rent directly into this account.
          </p>
        </div>
      )}

      {/* Account name */}
      <div className="space-y-2">
        <Label htmlFor="accountName">Account Name</Label>
        <Input
          id="accountName"
          placeholder="e.g. Lekki Phase 1 Apartment — Virtual Account"
          {...register('accountName')}
          disabled={isSubmitting}
        />
        {errors.accountName && (
          <p className="text-sm text-destructive">{errors.accountName.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          This name appears on bank transfers so make it recognisable.
        </p>
      </div>

      {/* Role notice for agents */}
      {userRole === 'AGENT' && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 text-sm text-amber-800">
            As an agent, this account will be used to hold commissions and marking
            fees. Funds are released after the confirmation period.
          </CardContent>
        </Card>
      )}

      {/* Error feedback */}
      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating…
            </>
          ) : (
            'Create Account'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={() => router.push(returnUrl ?? '/virtual-accounts')}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}