// apps/admin/src/app/(dashboard)/referrals/users/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ReferralTable from "@/components/referrals/ReferralTable";
import { referralAdminAPI } from "@/lib/api/referralAdmin";
import { Search, Eye, TrendingUp, Award, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserReferralData {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  totalReferrals: number;
  activeReferrals: number;
  qualifiedReferrals: number;
  totalEarned: number;
  conversionRate: number;
  joinedAt: string;
}

export default function UserReferralsPage() {
  const [users, setUsers] = useState<UserReferralData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserReferralData | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [userReferrals, setUserReferrals] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // This would typically be a dedicated endpoint for user referral stats
      const response = await referralAdminAPI.getStats();
      
      // Mock data - replace with actual API call
      const mockUsers: UserReferralData[] = [
        {
          userId: "user1",
          userName: "John Doe",
          userEmail: "john@example.com",
          userRole: "OWNER",
          totalReferrals: 25,
          activeReferrals: 18,
          qualifiedReferrals: 20,
          totalEarned: 250000,
          conversionRate: 80,
          joinedAt: "2024-01-15",
        },
        {
          userId: "user2",
          userName: "Jane Smith",
          userEmail: "jane@example.com",
          userRole: "AGENT",
          totalReferrals: 15,
          activeReferrals: 12,
          qualifiedReferrals: 13,
          totalEarned: 130000,
          conversionRate: 86.7,
          joinedAt: "2024-02-20",
        },
      ];

      setUsers(mockUsers);
    } catch (error) {
      console.error("Failed to load users:", error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (user: UserReferralData) => {
    setSelectedUser(user);
    setShowDetailsDialog(true);
    setLoadingDetails(true);

    try {
      const response = await referralAdminAPI.getUserReferrals(user.userId, {
        page: 1,
        limit: 50,
      });
      setUserReferrals(response.data.referrals || []);
    } catch (error) {
      console.error("Failed to load user referrals:", error);
      toast({
        title: "Error",
        description: "Failed to load user referrals",
        variant: "destructive",
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case "OWNER":
        return "bg-blue-100 text-blue-800";
      case "AGENT":
        return "bg-purple-100 text-purple-800";
      case "RENTER":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Referrals</h1>
          <p className="text-muted-foreground">
            View referral performance by user
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">With referral activity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.length > 0 ? users[0].userName : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {users.length > 0 ? `${users[0].totalReferrals} referrals` : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.length > 0
                ? `${(
                    users.reduce((sum, u) => sum + u.conversionRate, 0) / users.length
                  ).toFixed(1)}%`
                : "0%"}
            </div>
            <p className="text-xs text-muted-foreground">Platform average</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>User Referral Performance</CardTitle>
              <CardDescription>View referral statistics for each user</CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Total Referrals</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Qualified</TableHead>
                    <TableHead>Conversion Rate</TableHead>
                    <TableHead>Total Earned</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.userId}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.userName}</p>
                            <p className="text-sm text-muted-foreground">{user.userEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(user.userRole)}>{user.userRole}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">{user.totalReferrals}</TableCell>
                        <TableCell>{user.activeReferrals}</TableCell>
                        <TableCell>{user.qualifiedReferrals}</TableCell>
                        <TableCell>
                          <span className="font-medium text-green-600">
                            {user.conversionRate.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold">
                          ₦{user.totalEarned.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.joinedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(user)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Referral Details</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <span>
                  Referrals for {selectedUser.userName} ({selectedUser.userEmail})
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* User Stats */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{selectedUser.totalReferrals}</p>
                      <p className="text-sm text-muted-foreground">Total Referrals</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{selectedUser.activeReferrals}</p>
                      <p className="text-sm text-muted-foreground">Active</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {selectedUser.conversionRate.toFixed(1)}%
                      </p>
                      <p className="text-sm text-muted-foreground">Conversion</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        ₦{selectedUser.totalEarned.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Earned</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* User Referrals Table */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Referral History</h3>
                <ReferralTable
                  referrals={userReferrals}
                  loading={loadingDetails}
                  showPagination={false}
                  compact
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}