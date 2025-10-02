'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Lock, Unlock, RefreshCw, Search, Clock, User, Home, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

interface PropertyLock {
  id: string;
  propertyId: string;
  unitId?: string;
  userId: string;
  userName: string;
  userEmail: string;
  propertyTitle: string;
  unitNumber?: string;
  amount: number;
  lockedAt: string;
  expiresAt: string;
  remainingTime: number; // in seconds
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
  ipAddress?: string;
}

interface LockStats {
  totalActiveLocks: number;
  expiringSoon: number;
  averageLockDuration: number;
  locksByProperty: number;
}

export default function LockMonitor() {
  const [locks, setLocks] = useState<PropertyLock[]>([]);
  const [stats, setStats] = useState<LockStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();

  const fetchLocks = async () => {
    try {
      const response = await fetch('/api/admin/locks/active', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch locks');

      const data = await response.json();
      setLocks(data.locks);
      setStats(data.stats);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch active locks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseLock = async (lockId: string, propertyId: string) => {
    try {
      const response = await fetch(`/api/admin/locks/${lockId}/release`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ propertyId }),
      });

      if (!response.ok) throw new Error('Failed to release lock');

      toast({
        title: 'Success',
        description: 'Lock released successfully',
      });

      fetchLocks();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to release lock',
        variant: 'destructive',
      });
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchLocks();
  };

  useEffect(() => {
    fetchLocks();

    if (autoRefresh) {
      const interval = setInterval(fetchLocks, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const filteredLocks = locks.filter(lock => {
    const query = searchQuery.toLowerCase();
    return (
      lock.propertyTitle.toLowerCase().includes(query) ||
      lock.userName.toLowerCase().includes(query) ||
      lock.userEmail.toLowerCase().includes(query) ||
      lock.propertyId.includes(query)
    );
  });

  const getLockStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default">Active</Badge>;
      case 'EXPIRING_SOON':
        return <Badge variant="warning" className="bg-yellow-500">Expiring Soon</Badge>;
      case 'EXPIRED':
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return 'Expired';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Payment Locks</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Locks</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalActiveLocks || 0}</div>
            <p className="text-xs text-muted-foreground">Currently locked properties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.expiringSoon || 0}</div>
            <p className="text-xs text-muted-foreground">Locks expiring in 2 minutes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.averageLockDuration ? `${Math.floor(stats.averageLockDuration / 60)}m` : '0m'}
            </div>
            <p className="text-xs text-muted-foreground">Average lock duration</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Properties</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.locksByProperty || 0}</div>
            <p className="text-xs text-muted-foreground">Unique properties locked</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Lock Monitor Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Payment Locks</CardTitle>
              <CardDescription>Monitor and manage property payment locks in real-time</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? 'Auto-Refresh: ON' : 'Auto-Refresh: OFF'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by property, user, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Locks Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Locked At</TableHead>
                  <TableHead>Time Remaining</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLocks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No active locks found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLocks.map((lock) => (
                    <TableRow key={lock.id}>
                      <TableCell>{getLockStatusBadge(lock.status)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{lock.propertyTitle}</div>
                          {lock.unitNumber && (
                            <div className="text-xs text-muted-foreground">Unit: {lock.unitNumber}</div>
                          )}
                          <div className="text-xs text-muted-foreground">{lock.propertyId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{lock.userName}</div>
                          <div className="text-xs text-muted-foreground">{lock.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>₦{lock.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(lock.lockedAt), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(lock.lockedAt), 'HH:mm:ss')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`font-medium ${lock.status === 'EXPIRING_SOON' ? 'text-yellow-600' : ''}`}>
                          {formatTimeRemaining(lock.remainingTime)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Expires: {format(new Date(lock.expiresAt), 'HH:mm:ss')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{lock.ipAddress || 'N/A'}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReleaseLock(lock.id, lock.propertyId)}
                          disabled={lock.status === 'EXPIRED'}
                        >
                          <Unlock className="h-4 w-4 mr-1" />
                          Release
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}