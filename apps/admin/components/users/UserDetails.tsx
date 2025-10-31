"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@newcondo/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@newcondo/ui/avatar";
import { Badge } from "@newcondo/ui/badge";
import { Separator } from "@newcondo/ui/separator";
import { 
  Mail, Phone, MapPin, Calendar, Shield, 
  Home, CreditCard, Star, TrendingUp 
} from "lucide-react";
import { UserStatusBadge } from "./UserStatusBadge";
import { adminApi } from "@/lib/api/admin";
import { format } from "date-fns";

interface UserDetails {
  id: string;
  name: string;
  email: string;
  phone?: string;
  image?: string;
  role: string;
  userType?: string;
  verificationStatus: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  isPremium: boolean;
  premiumExpiresAt?: string;
  isAvailableForMarking: boolean;
  agentServiceAreas?: string[];
  agentReliabilityScore?: number;
  totalMarkingJobs: number;
  completedMarkingJobs: number;
  companyName?: string;
  businessRegNumber?: string;
  isB2BCustomer: boolean;
  totalProperties: number;
  totalPayments: number;
  totalRevenue: number;
  referralCode: string;
  createdAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

interface UserDetailsProps {
  userId: string;
}

export function UserDetails({ userId }: UserDetailsProps) {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getUserDetails(userId);
      setUser(response.data);
    } catch (error) {
      console.error("Failed to fetch user details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="h-8 w-48 animate-pulse bg-gray-200 rounded" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 w-full animate-pulse bg-gray-200 rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">User not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.image} />
              <AvatarFallback className="text-2xl">
                {user.name?.substring(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-2xl font-bold">{user.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="capitalize">{user.role.toLowerCase()}</Badge>
                  <UserStatusBadge status={user.verificationStatus} />
                  {user.isPremium && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <Star className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                  {user.isAvailableForMarking && (
                    <Badge variant="outline">Available for Marking</Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{user.phone}</span>
                  </div>
                )}
                {(user.city || user.state) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{[user.city, user.state].filter(Boolean).join(", ")}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {format(new Date(user.createdAt), "MMM dd, yyyy")}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Information (if B2B) */}
      {user.isB2BCustomer && (
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user.companyName && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Company Name</p>
                <p className="text-base">{user.companyName}</p>
              </div>
            )}
            {user.businessRegNumber && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Registration Number
                </p>
                <p className="text-base">{user.businessRegNumber}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Agent Statistics */}
      {user.role === "AGENT" && (
        <Card>
          <CardHeader>
            <CardTitle>Agent Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Reliability Score</p>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-2xl font-bold">
                    {user.agentReliabilityScore?.toFixed(2) || "N/A"}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Jobs</p>
                <p className="text-2xl font-bold">{user.totalMarkingJobs}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {user.completedMarkingJobs}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">
                  {user.totalMarkingJobs > 0
                    ? ((user.completedMarkingJobs / user.totalMarkingJobs) * 100).toFixed(0)
                    : 0}
                  %
                </p>
              </div>
            </div>

            {user.agentServiceAreas && user.agentServiceAreas.length > 0 && (
              <>
                <Separator className="my-4" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Service Areas
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {user.agentServiceAreas.map((area, index) => (
                      <Badge key={index} variant="outline">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Activity Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Activity & Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-100">
                <Home className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Properties</p>
                <p className="text-2xl font-bold">{user.totalProperties}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-100">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">{user.totalPayments}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-100">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">
                  ₦{user.totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Information */}
      {user.verifiedAt && (
        <Card>
          <CardHeader>
            <CardTitle>Verification Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Verified At</p>
              <p className="text-base">
                {format(new Date(user.verifiedAt), "PPpp")}
              </p>
            </div>
            {user.verifiedBy && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Verified By</p>
                <p className="text-base">{user.verifiedBy}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Referral Information */}
      <Card>
        <CardHeader>
          <CardTitle>Referral Code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <code className="text-base font-mono">{user.referralCode}</code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}