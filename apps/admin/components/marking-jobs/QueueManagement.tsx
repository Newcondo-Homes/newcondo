// apps/admin/src/components/marking-jobs/QueueManagement.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Clock,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  MapPin,
} from 'lucide-react';

interface QueueAgent {
  id: string;
  name: string;
  email: string;
  phone: string;
  queuePosition: number;
  assignedAt: string;
  timeSlotExpiry: string;
  status: 'WAITING' | 'ACTIVE' | 'EXPIRED';
  agentReliabilityScore: number;
  totalMarkingJobs: number;
  completedMarkingJobs: number;
  distance?: string; // Distance from property
}

interface QueueStats {
  totalInQueue: number;
  activeAgent: number;
  waitingAgents: number;
  expiredSlots: number;
  averageWaitTime: string;
}

interface QueueManagementProps {
  jobId: string;
  propertyAddress: string;
}

export default function QueueManagement({ jobId, propertyAddress }: QueueManagementProps) {
  const [agents, setAgents] = useState<QueueAgent[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQueueData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchQueueData, 30000);
    return () => clearInterval(interval);
  }, [jobId]);

  const fetchQueueData = async () => {
    try {
      const response = await fetch(`/api/admin/marking-jobs/${jobId}/queue`);
      if (!response.ok) throw new Error('Failed to fetch queue data');
      
      const data = await response.json();
      setAgents(data.agents || []);
      setStats(data.stats || null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromQueue = async (agentId: string) => {
    if (!confirm('Are you sure you want to remove this agent from the queue?')) return;

    setActionLoading(agentId);
    try {
      const response = await fetch(`/api/admin/marking-jobs/${jobId}/queue/${agentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove agent');

      await fetchQueueData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove agent');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRotateQueue = async () => {
    if (!confirm('This will move the current agent to the back and assign the next agent. Continue?')) return;

    setActionLoading('rotate');
    try {
      const response = await fetch(`/api/admin/marking-jobs/${jobId}/queue/rotate`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to rotate queue');

      await fetchQueueData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rotate queue');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReassignExpired = async () => {
    setActionLoading('reassign');
    try {
      const response = await fetch(`/api/admin/marking-jobs/${jobId}/queue/reassign-expired`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to reassign expired slots');

      await fetchQueueData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reassign');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: QueueAgent['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500';
      case 'WAITING':
        return 'bg-blue-500';
      case 'EXPIRED':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTimeRemaining = (expiry: string) => {
    const now = new Date();
    const expiryDate = new Date(expiry);
    const diff = expiryDate.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Queue Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalInQueue}</p>
                  <p className="text-sm text-gray-600">Total in Queue</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.activeAgent}</p>
                  <p className="text-sm text-gray-600">Active Agent</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.waitingAgents}</p>
                  <p className="text-sm text-gray-600">Waiting</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.expiredSlots}</p>
                  <p className="text-sm text-gray-600">Expired Slots</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.averageWaitTime}</p>
                  <p className="text-sm text-gray-600">Avg Wait Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Property Location */}
      <Alert>
        <MapPin className="h-4 w-4" />
        <AlertDescription>
          <strong>Property Location:</strong> {propertyAddress}
        </AlertDescription>
      </Alert>

      {/* Queue Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Queue Actions</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchQueueData}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {stats && stats.expiredSlots > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReassignExpired}
                  disabled={actionLoading === 'reassign'}
                >
                  Reassign Expired
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRotateQueue}
                disabled={actionLoading === 'rotate' || agents.length < 2}
              >
                Rotate Queue
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Queue Table */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Queue ({agents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No agents in queue
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time Remaining</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <Badge variant={agent.queuePosition === 1 ? 'default' : 'outline'}>
                        #{agent.queuePosition}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-sm text-gray-500">{agent.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{agent.phone}</p>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {agent.agentReliabilityScore.toFixed(1)} ⭐
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {agent.completedMarkingJobs}/{agent.totalMarkingJobs} jobs
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {agent.distance || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(agent.status)}>
                        {agent.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {agent.status === 'ACTIVE' ? (
                        <span className="text-sm font-medium">
                          {getTimeRemaining(agent.timeSlotExpiry)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFromQueue(agent.id)}
                        disabled={actionLoading === agent.id}
                      >
                        <XCircle className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}