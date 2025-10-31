// apps/admin/src/components/support/TicketAssignment.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserCheck, Users, AlertCircle, CheckCircle } from 'lucide-react';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  activeTickets: number;
}

interface TicketAssignmentProps {
  ticketId: string;
  currentAssignee?: string;
  onAssign?: (adminId: string) => void;
}

export default function TicketAssignment({
  ticketId,
  currentAssignee,
  onAssign,
}: TicketAssignmentProps) {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState(currentAssignee || '');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  useEffect(() => {
    if (currentAssignee) {
      setSelectedAdmin(currentAssignee);
    }
  }, [currentAssignee]);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users?role=ADMIN');
      if (!response.ok) throw new Error('Failed to fetch admins');

      const data = await response.json();
      setAdmins(data.admins || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedAdmin) {
      setError('Please select an admin');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/admin/support/tickets/${ticketId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: selectedAdmin }),
      });

      if (!response.ok) throw new Error('Failed to assign ticket');

      setSuccess(true);
      onAssign?.(selectedAdmin);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const currentAssigneeDetails = admins.find((admin) => admin.id === currentAssignee);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Ticket Assignment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Assignee */}
          {currentAssigneeDetails && (
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                Currently assigned to:{' '}
                <strong>
                  {currentAssigneeDetails.name} ({currentAssigneeDetails.email})
                </strong>
              </AlertDescription>
            </Alert>
          )}

          {/* Admin Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Assign to Admin
            </label>
            <Select
              value={selectedAdmin}
              onValueChange={setSelectedAdmin}
              disabled={loading || submitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an admin" />
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                  <SelectItem value="loading" disabled>
                    Loading admins...
                  </SelectItem>
                ) : admins.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No admins available
                  </SelectItem>
                ) : (
                  admins.map((admin) => (
                    <SelectItem key={admin.id} value={admin.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>
                          {admin.name} - {admin.email}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          {admin.activeTickets} active tickets
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {success && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Ticket successfully assigned!
              </AlertDescription>
            </Alert>
          )}

          {/* Action Button */}
          <Button
            onClick={handleAssign}
            disabled={submitting || loading || !selectedAdmin}
            className="w-full"
          >
            {submitting ? 'Assigning...' : currentAssignee ? 'Reassign Ticket' : 'Assign Ticket'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}