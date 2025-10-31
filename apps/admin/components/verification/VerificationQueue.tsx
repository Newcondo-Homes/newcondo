'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, Search, Filter, User, Calendar, ArrowUpDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface VerificationQueueItem {
  id: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    userType: string | null;
  };
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  createdAt: string;
  documents: {
    count: number;
    hasId: boolean;
    hasSelfie: boolean;
  };
  priority: 'high' | 'medium' | 'low';
}

interface VerificationQueueProps {
  items: VerificationQueueItem[];
  isLoading?: boolean;
  onItemClick?: (userId: string) => void;
}

export function VerificationQueue({
  items,
  isLoading = false,
  onItemClick,
}: VerificationQueueProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50">Pending Review</Badge>;
      case 'VERIFIED':
        return <Badge variant="outline" className="bg-green-50">Verified</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-50">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredAndSortedItems = items
    .filter((item) => {
      const matchesSearch =
        item.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verification Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Verification Queue</CardTitle>
            <CardDescription>
              {filteredAndSortedItems.length} {filteredAndSortedItems.length === 1 ? 'user' : 'users'} awaiting verification
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-lg">
            {items.filter((i) => i.status === 'PENDING').length} Pending
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'date' | 'priority')}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Sort by Date</SelectItem>
              <SelectItem value="priority">Sort by Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Queue Items */}
        {filteredAndSortedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <User className="mb-4 h-12 w-12 text-gray-400" />
            <p className="text-lg font-medium text-gray-900">No verifications found</p>
            <p className="text-sm text-gray-500">
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'All users have been processed'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAndSortedItems.map((item) => (
              <div
                key={item.id}
                className="group cursor-pointer rounded-lg border p-4 transition-all hover:border-blue-300 hover:bg-blue-50/50"
                onClick={() => onItemClick?.(item.user.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {item.user.name || 'Unnamed User'}
                        </h4>
                        <p className="text-sm text-gray-500">{item.user.email}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(item.status)}
                      <Badge variant="outline" className={getPriorityColor(item.priority)}>
                        {item.priority} priority
                      </Badge>
                      <Badge variant="outline">
                        {item.user.role}
                        {item.user.userType && ` - ${item.user.userType}`}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <span className={item.documents.hasId ? 'text-green-600' : 'text-gray-400'}>
                        ✓ ID Document
                      </span>
                      <span className={item.documents.hasSelfie ? 'text-green-600' : 'text-gray-400'}>
                        ✓ Selfie
                      </span>
                      <span className="text-gray-500">
                        {item.documents.count} total documents
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100"
                    asChild
                  >
                    <Link href={`/verifications/${item.user.id}`}>
                      Review →
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}