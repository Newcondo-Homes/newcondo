// apps/platform/components/rentals/TenantInfoCard.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, User, Shield } from 'lucide-react';
import { VerificationStatus } from '@prisma/client';

interface TenantInfoCardProps {
  tenant: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    image?: string;
    address?: string;
    city?: string;
    state?: string;
    verificationStatus: VerificationStatus;
    isPremium: boolean;
  };
  onContactTenant?: () => void;
}

export function TenantInfoCard({
  tenant,
  onContactTenant,
}: TenantInfoCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getVerificationBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <Badge className="bg-green-500">
            <Shield className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            Pending Verification
          </Badge>
        );
      case 'REJECTED':
        return <Badge variant="destructive">Not Verified</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tenant Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={tenant.image} alt={tenant.name} />
            <AvatarFallback>{getInitials(tenant.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{tenant.name}</h3>
              {getVerificationBadge(tenant.verificationStatus)}
            </div>
            {tenant.isPremium && (
              <Badge variant="outline" className="mt-1 bg-purple-50 text-purple-700">
                Premium Member
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a
              href={`mailto:${tenant.email}`}
              className="text-sm hover:underline"
            >
              {tenant.email}
            </a>
          </div>

          {tenant.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${tenant.phone}`} className="text-sm hover:underline">
                {tenant.phone}
              </a>
            </div>
          )}

          {tenant.address && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-sm">
                <p>{tenant.address}</p>
                {tenant.city && tenant.state && (
                  <p className="text-muted-foreground">
                    {tenant.city}, {tenant.state}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {onContactTenant && (
          <Button onClick={onContactTenant} className="w-full" variant="outline">
            <User className="h-4 w-4 mr-2" />
            Contact Tenant
          </Button>
        )}
      </CardContent>
    </Card>
  );
}