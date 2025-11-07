"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Shield,
  CreditCard,
  Home,
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  FileText,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface UserDetails {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  userType: string | null;
  verificationStatus: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  isPremium: boolean;
  isB2BCustomer: boolean;
  image: string | null;
  
  // Profile
  dateOfBirth: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  
  // B2B
  companyName: string | null;
  businessRegNumber: string | null;
  
  // Agent
  isAvailableForMarking: boolean;
  agentServiceAreas: string[];
  agentReliabilityScore: number | null;
  totalMarkingJobs: number;
  completedMarkingJobs: number;
  
  // Stats
  totalProperties: number;
  totalPayments: number;
  totalRentals: number;
  totalReferrals: number;
  
  // Dates
  createdAt: string;
  updatedAt: string;
  verifiedAt: string | null;
  premiumExpiresAt: string | null;
}

interface UserDetailsPanelProps {
  userId: string;
  onClose?: () => void;
}

export default function UserDetailsPanel({ userId, onClose }: UserDetailsPanelProps) {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`);
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p>Loading user details...</p>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p>User not found</p>
        </CardContent>
      </Card>
    );
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getVerificationBadge = (status: string) => {
    const config = {
      VERIFIED: { variant: 'default' as const, icon: CheckCircle2, label: 'Verified' },
      PENDING: { variant: 'warning' as const, icon: Clock, label: 'Pending' },
      REJECTED: { variant: 'destructive' as const, icon: XCircle, label: 'Rejected' }
    };
    
    const { variant, icon: Icon, label } = config[status as keyof typeof config] || config.PENDING;
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      OWNER: 'bg-blue-100 text-blue-700',
      AGENT: 'bg-green-100 text-green-700',
      RENTER: 'bg-purple-100 text-purple-700',
      ADMIN: 'bg-red-100 text-red-700'
    };
    
    return (
      <Badge className={colors[role as keyof typeof colors] || ''}>
        {role}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.image || undefined} />
                <AvatarFallback className="text-lg">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-2">
                <div>
                  <h2 className="text-2xl font-bold">{user.name || 'No name'}</h2>
                  <p className="text-sm text-muted-foreground">ID: {user.id}</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {getRoleBadge(user.role)}
                  {getVerificationBadge(user.verificationStatus)}
                  {user.isPremium && (
                    <Badge variant="default" className="bg-yellow-500">
                      <Shield className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                  {user.isB2BCustomer && (
                    <Badge variant="secondary">
                      <Briefcase className="h-3 w-3 mr-1" />
                      B2B
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {onClose && (
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          {user.role === 'AGENT' && (
            <TabsTrigger value="agent">Agent Info</TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div className="flex-grow">
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                {user.emailVerified && (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                )}
              </div>
              
              {user.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-grow">
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{user.phone}</p>
                  </div>
                  {user.phoneVerified && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">User Type</p>
                  <p className="text-sm text-muted-foreground">
                    {user.userType || 'Not specified'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Verification Status</p>
                  {getVerificationBadge(user.verificationStatus)}
                </div>
                
                <div>
                  <p className="text-sm font-medium">Member Since</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(user.createdAt), 'PPP')}
                  </p>
                </div>
                
                {user.verifiedAt && (
                  <div>
                    <p className="text-sm font-medium">Verified At</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(user.verifiedAt), 'PPP')}
                    </p>
                  </div>
                )}
                
                {user.isPremium && user.premiumExpiresAt && (
                  <div>
                    <p className="text-sm font-medium">Premium Expires</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(user.premiumExpiresAt), 'PPP')}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                {user.dateOfBirth && (
                  <div>
                    <p className="text-sm font-medium">Date of Birth</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(user.dateOfBirth), 'PPP')}
                    </p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-medium">Country</p>
                  <p className="text-sm text-muted-foreground">{user.country}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-grow space-y-1">
                  {user.address && (
                    <p className="text-sm">{user.address}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {[user.city, user.state].filter(Boolean).join(', ') || 'No location set'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {user.isB2BCustomer && (
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  {user.companyName && (
                    <div>
                      <p className="text-sm font-medium">Company Name</p>
                      <p className="text-sm text-muted-foreground">{user.companyName}</p>
                    </div>
                  )}
                  
                  {user.businessRegNumber && (
                    <div>
                      <p className="text-sm font-medium">Registration Number</p>
                      <p className="text-sm text-muted-foreground">{user.businessRegNumber}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Home className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{user.totalProperties}</p>
                    <p className="text-xs text-muted-foreground">Properties</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{user.totalPayments}</p>
                    <p className="text-xs text-muted-foreground">Payments</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">{user.totalRentals}</p>
                    <p className="text-xs text-muted-foreground">Rentals</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">{user.totalReferrals}</p>
                    <p className="text-xs text-muted-foreground">Referrals</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Agent Info Tab */}
        {user.role === 'AGENT' && (
          <TabsContent value="agent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Agent Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium">Reliability Score</p>
                    <p className="text-2xl font-bold text-green-600">
                      {user.agentReliabilityScore?.toFixed(2) || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Total Jobs</p>
                    <p className="text-2xl font-bold">{user.totalMarkingJobs}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Completed</p>
                    <p className="text-2xl font-bold text-green-600">
                      {user.completedMarkingJobs}
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium mb-2">Service Areas</p>
                  {user.agentServiceAreas.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.agentServiceAreas.map((area, index) => (
                        <Badge key={index} variant="outline">{area}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No service areas set</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Available for Marking:</p>
                  {user.isAvailableForMarking ? (
                    <Badge variant="default" className="bg-green-600">Available</Badge>
                  ) : (
                    <Badge variant="secondary">Not Available</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}