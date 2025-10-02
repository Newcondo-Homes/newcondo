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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, CheckCircle, XCircle, Eye, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

interface BookingConflict {
  id: string;
  propertyId: string;
  unitId?: string;
  propertyTitle: string;
  unitNumber?: string;
  conflictType: 'SIMULTANEOUS_PAYMENT' | 'DOUBLE_BOOKING' | 'EXPIRED_LOCK' | 'DUPLICATE_PROPERTY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'ESCALATED';
  
  // Involved parties
  users: Array<{
    id: string;
    name: string;
    email: string;
    paymentAmount: number;
    paymentStatus: string;
    lockAcquiredAt?: string;
  }>;
  
  // Conflict details
  detectedAt: string;
  description: string;
  affectedPayments: string[];
  
  // Resolution
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionAction?: 'REFUND_ALL' | 'REFUND_LOSER' | 'MANUAL_REVIEW' | 'PROPERTY_DELISTED';
}

export default function ConflictResolution() {
  const [conflicts, setConflicts] = useState<BookingConflict[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<BookingConflict | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionAction, setResolutionAction] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  const fetchConflicts = async () => {
    try {
      const response = await fetch('/api/admin/conflicts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch conflicts');

      const data = await response.json();
      setConflicts(data.conflicts);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch booking conflicts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (conflict: BookingConflict) => {
    setSelectedConflict(conflict);
    setShowDialog(true);
    setResolutionNotes('');
    setResolutionAction('');
  };

  const handleResolveConflict = async () => {
    if (!selectedConflict || !resolutionAction) {
      toast({
        title: 'Error',
        description: 'Please select a resolution action',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`/api/admin/conflicts/${selectedConflict.id}/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: resolutionAction,
          notes: resolutionNotes,
        }),
      });

      if (!response.ok) throw new Error('Failed to resolve conflict');

      toast({
        title: 'Success',
        description: 'Conflict resolved successfully',
      });

      setShowDialog(false);
      fetchConflicts();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resolve conflict',
        variant: 'destructive',
      });
    }
  };

  const handleEscalate = async (conflictId: string) => {
    try {
      const response = await fetch(`/api/admin/conflicts/${conflictId}/escalate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to escalate conflict');

      toast({
        title: 'Success',
        description: 'Conflict escalated to senior admin',
      });

      fetchConflicts();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to escalate conflict',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchConflicts();
  }, []);

  const getConflictTypeBadge = (type: string) => {
    const styles = {
      SIMULTANEOUS_PAYMENT: 'bg-red-500',
      DOUBLE_BOOKING: 'bg-orange-500',
      EXPIRED_LOCK: 'bg-yellow-500',
      DUPLICATE_PROPERTY: 'bg-purple-500',
    };

    return (
      <Badge className={styles[type as keyof typeof styles] || 'bg-gray-500'}>
        {type.replace(/_/g, ' ')}
      </Badge>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      LOW: 'secondary',
      MEDIUM: 'default',
      HIGH: 'warning',
      CRITICAL: 'destructive',
    };

    return <Badge variant={variants[severity as keyof typeof variants] as any}>{severity}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const icons = {
      PENDING: <Clock className="h-3 w-3 mr-1" />,
      INVESTIGATING: <Eye className="h-3 w-3 mr-1" />,
      RESOLVED: <CheckCircle className="h-3 w-3 mr-1" />,
      ESCALATED: <AlertTriangle className="h-3 w-3 mr-1" />,
    };

    return (
      <Badge variant="outline" className="flex items-center">
        {icons[status as keyof typeof icons]}
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Booking Conflicts</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Booking Conflicts & Disputes</CardTitle>
          <CardDescription>Manage and resolve double booking conflicts and payment disputes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Users Involved</TableHead>
                  <TableHead>Detected At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conflicts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No conflicts found
                    </TableCell>
                  </TableRow>
                ) : (
                  conflicts.map((conflict) => (
                    <TableRow key={conflict.id}>
                      <TableCell>{getStatusBadge(conflict.status)}</TableCell>
                      <TableCell>{getConflictTypeBadge(conflict.conflictType)}</TableCell>
                      <TableCell>{getSeverityBadge(conflict.severity)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{conflict.propertyTitle}</div>
                          {conflict.unitNumber && (
                            <div className="text-xs text-muted-foreground">Unit: {conflict.unitNumber}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {conflict.users.map((user, idx) => (
                            <div key={idx} className="text-sm">
                              {user.name} - ₦{user.paymentAmount.toLocaleString()}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(conflict.detectedAt), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(conflict.detectedAt), 'HH:mm:ss')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(conflict)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {conflict.status !== 'RESOLVED' && conflict.status !== 'ESCALATED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEscalate(conflict.id)}
                            >
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              Escalate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Conflict Details Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Conflict Resolution</DialogTitle>
            <DialogDescription>
              Review conflict details and select appropriate resolution action
            </DialogDescription>
          </DialogHeader>

          {selectedConflict && (
            <div className="space-y-6">
              {/* Conflict Overview */}
              <div className="space-y-2">
                <h3 className="font-semibold">Conflict Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <div>{getConflictTypeBadge(selectedConflict.conflictType)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Severity:</span>
                    <div>{getSeverityBadge(selectedConflict.severity)}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Description:</span>
                    <p className="mt-1">{selectedConflict.description}</p>
                  </div>
                </div>
              </div>

              {/* Property Details */}
              <div className="space-y-2">
                <h3 className="font-semibold">Property Information</h3>
                <div className="text-sm">
                  <p><strong>Title:</strong> {selectedConflict.propertyTitle}</p>
                  {selectedConflict.unitNumber && (
                    <p><strong>Unit:</strong> {selectedConflict.unitNumber}</p>
                  )}
                  <p className="text-xs text-muted-foreground">ID: {selectedConflict.propertyId}</p>
                </div>
              </div>

              {/* Involved Users */}
              <div className="space-y-2">
                <h3 className="font-semibold">Involved Users ({selectedConflict.users.length})</h3>
                <div className="space-y-3">
                  {selectedConflict.users.map((user, idx) => (
                    <div key={idx} className="border rounded-lg p-3 space-y-1">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <Badge>{user.paymentStatus}</Badge>
                      </div>
                      <div className="text-sm">
                        <p>Payment Amount: ₦{user.paymentAmount.toLocaleString()}</p>
                        {user.lockAcquiredAt && (
                          <p className="text-xs text-muted-foreground">
                            Lock Acquired: {format(new Date(user.lockAcquiredAt), 'MMM dd, yyyy HH:mm:ss')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resolution Action */}
              {selectedConflict.status !== 'RESOLVED' && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Resolution Action</h3>
                  <Select value={resolutionAction} onValueChange={setResolutionAction}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select resolution action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REFUND_ALL">Refund All Parties</SelectItem>
                      <SelectItem value="REFUND_LOSER">Refund Losing Party</SelectItem>
                      <SelectItem value="MANUAL_REVIEW">Manual Review Required</SelectItem>
                      <SelectItem value="PROPERTY_DELISTED">Delist Property</SelectItem>
                    </SelectContent>
                  </Select>

                  <div>
                    <label className="text-sm font-medium">Resolution Notes</label>
                    <Textarea
                      placeholder="Enter detailed resolution notes..."
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              {/* Existing Resolution (if resolved) */}
              {selectedConflict.status === 'RESOLVED' && selectedConflict.resolution && (
                <div className="space-y-2 bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900">Resolution</h3>
                  <p className="text-sm">{selectedConflict.resolution}</p>
                  <p className="text-xs text-muted-foreground">
                    Resolved by: {selectedConflict.resolvedBy} on{' '}
                    {selectedConflict.resolvedAt && format(new Date(selectedConflict.resolvedAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Close
            </Button>
            {selectedConflict?.status !== 'RESOLVED' && (
              <Button onClick={handleResolveConflict} disabled={!resolutionAction}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Resolve Conflict
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}