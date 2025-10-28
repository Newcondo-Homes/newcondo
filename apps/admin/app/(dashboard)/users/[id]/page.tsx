'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Home,
  Wallet,
  Activity,
  Ban,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { UserDocuments } from '@/components/admin/UserDocuments';
import { UserProperties } from '@/components/admin/UserProperties';
import { UserActivity } from '@/components/admin/UserActivity';
import { UserVirtualAccount } from '@/components/admin/UserVirtualAccount';

type UserDetail = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  userType: string | null;
  verificationStatus: string;
  verificationRejectionReason: string | null;
  isPremium: boolean;
  dateOfBirth: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  isAvailableForMarking: boolean;
  agentReliabilityScore: number | null;
  totalMarkingJobs: number;
  completedMarkingJobs: number;
  createdAt: string;
  updatedAt: string;
  _count: {
    properties: number;
    payments: number;
    rentals: number;
  };
};

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = params.id as string;

  const [activeTab, setActiveTab] = useState('overview');

  // Fetch user details
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user details');
      return response.json() as Promise<UserDetail>;
    },
  });

  // Verify user mutation
  const verifyUserMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/users/${userId}/verify`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to verify user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
      toast.success('User verified successfully');
    },
    onError: () => {
      toast.error('Failed to verify user');
    },
  });

  // Reject user mutation
  const rejectUserMutation = useMutation({
    mutationFn: async (reason: string) => {
      const response = await fetch(`/api/admin/users/${userId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error('Failed to reject user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
      toast.success('User verification rejected');
    },
    onError: () => {
      toast.error('Failed to reject user');
    },
  });

  // Suspend user mutation
  const suspendUserMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to suspend user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
      toast.success('User suspended');
    },
    onError: () => {
      toast.error('Failed to suspend user');
    },
  });

  if (isLoading) {
    return <UserDetailSkeleton />;
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Failed to load user details</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
      OWNER: 'bg-blue-100 text-blue-800 border-blue-200',
      AGENT: 'bg-green-100 text-green-800 border-green-200',
      RENTER: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED': return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'REJECTED': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </Button>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-semibold">
                {user.name?.[0] || user.email[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl">{user.name || 'No name'}</CardTitle>
                  {user.isPremium && (
                    <Badge variant="secondary">Premium</Badge>
                  )}
                </div>
                <CardDescription className="flex items-center gap-2 mt-1">
                  {getStatusIcon(user.verificationStatus)}
                  <span className="font-medium">{user.verificationStatus}</span>
                </CardDescription>
              </div>
            </div>
            <Badge className={getRoleBadge(user.role)}>
              {user.role}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contact Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{user.phone}</span>
              </div>
            )}
            {user.city && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{user.city}, {user.state}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <Separator />

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Properties</p>
              <p className="text-2xl font-bold">{user._count.properties}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Payments</p>
              <p className="text-2xl font-bold">{user._count.payments}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Rentals</p>
              <p className="text-2xl font-bold">{user._count.rentals}</p>
            </div>
            {user.role === 'AGENT' && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Marking Jobs</p>
                <p className="text-2xl font-bold">{user.completedMarkingJobs}/{user.totalMarkingJobs}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {user.verificationStatus === 'PENDING' && (
              <>
                <Button
                  onClick={() => verifyUserMutation.mutate()}
                  disabled={verifyUserMutation.isPending}
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Verify User
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Verification
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reject User Verification</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will reject the user's verification. Please provide a reason.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => rejectUserMutation.mutate('Documents do not meet requirements')}
                      >
                        Reject
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <Ban className="w-4 h-4 mr-2" />
                  Suspend User
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Suspend User</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will suspend the user's account. They will not be able to access the platform.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => suspendUserMutation.mutate()}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Suspend
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <UserVirtualAccount userId={userId} />
        </TabsContent>

        <TabsContent value="documents">
          <UserDocuments userId={userId} />
        </TabsContent>

        <TabsContent value="properties">
          <UserProperties userId={userId} />
        </TabsContent>

        <TabsContent value="activity">
          <UserActivity userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UserDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-32" />
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
          <Separator />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}