'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, FileCheck, Eye, Clock, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

type VerificationItem = {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  userRole: string;
  verificationType: string;
  status: string;
  submittedAt: string;
  documentCount: number;
};

export default function VerificationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Fetch verification requests
  const { data, isLoading } = useQuery({
    queryKey: ['admin-verifications', activeTab, searchQuery, typeFilter, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        status: activeTab.toUpperCase(),
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
      });

      const response = await fetch(`/api/admin/verifications?${params}`);
      if (!response.ok) throw new Error('Failed to fetch verifications');
      return response.json();
    },
  });

  const handleViewVerification = (userId: string) => {
    router.push(`/verifications/${userId}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'VERIFIED':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Verified</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getVerificationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      USER: 'User Identity',
      PROPERTY: 'Property Ownership',
      AGENT: 'Agent License',
      BUSINESS: 'Business Registration',
    };
    return labels[type] || type;
  };

  const getPendingCount = () => {
    return data?.stats?.pending || 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Verifications</h1>
          <p className="text-muted-foreground mt-2">
            Review and verify user-submitted documents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <Clock className="w-4 h-4 mr-2" />
            {getPendingCount()} Pending
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter verification requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="USER">User Identity</SelectItem>
                <SelectItem value="PROPERTY">Property Ownership</SelectItem>
                <SelectItem value="AGENT">Agent License</SelectItem>
                <SelectItem value="BUSINESS">Business Registration</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Verification Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="relative">
            Pending
            {data?.stats?.pending > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {data.stats.pending}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <VerificationsTableSkeleton />
              ) : !data?.verifications || data.verifications.length === 0 ? (
                <div className="p-8 text-center">
                  <FileCheck className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    No {activeTab} verification requests found
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Documents</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.verifications.map((item: VerificationItem) => (
                      <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                              {item.userName?.[0] || item.userEmail[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{item.userName || 'No name'}</p>
                              <p className="text-xs text-muted-foreground">{item.userEmail}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {item.userRole}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {getVerificationTypeLabel(item.verificationType)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <FileCheck className="w-4 h-4 text-muted-foreground" />
                            {item.documentCount} docs
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(item.submittedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(item.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewVerification(item.userId)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * pageSize) + 1} to{' '}
                {Math.min(currentPage * pageSize, data.total)} of {data.total} requests
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(data.pages, p + 1))}
                  disabled={currentPage === data.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Today</CardTitle>
            <FileCheck className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.verifiedToday || 0}</div>
            <p className="text-xs text-muted-foreground">Approved today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.rejected || 0}</div>
            <p className="text-xs text-muted-foreground">Total rejections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Review Time</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.avgReviewTime || '0'}h</div>
            <p className="text-xs text-muted-foreground">Average processing</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function VerificationsTableSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="w-9 h-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  );
}