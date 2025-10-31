// apps/admin/src/components/support/TicketDetails.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { User, Calendar, Tag, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import TicketPriority from './TicketPriority';
import TicketResponse from './TicketResponse';
import TicketTimeline from './TicketTimeline';
import TicketAssignment from './TicketAssignment';

interface TicketDetails {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
    phone?: string;
  };
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  adminResponse?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface TicketDetailsProps {
  ticketId: string;
  onStatusChange?: (status: string) => void;
  onResolve?: (response: string) => void;
}

export default function TicketDetails({
  ticketId,
  onStatusChange,
  onResolve,
}: TicketDetailsProps) {
  const [ticket, setTicket] = useState<TicketDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTicketDetails();
  }, [ticketId]);

  const fetchTicketDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/support/tickets/${ticketId}`);
      if (!response.ok) throw new Error('Failed to fetch ticket details');

      const data = await response.json();
      setTicket(data.ticket);
    } catch (error) {
      console.error('Error fetching ticket details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/support/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      await fetchTicketDetails();
      onStatusChange?.(newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { className: string }> = {
      OPEN: { className: 'bg-blue-500' },
      IN_PROGRESS: { className: 'bg-yellow-500' },
      RESOLVED: { className: 'bg-green-500' },
      CLOSED: { className: 'bg-gray-500' },
    };
    const config = configs[status] || configs.OPEN;
    return <Badge className={config.className}>{status.replace('_', ' ')}</Badge>;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      TECHNICAL: 'bg-purple-100 text-purple-800',
      BILLING: 'bg-green-100 text-green-800',
      PROPERTY: 'bg-blue-100 text-blue-800',
      VERIFICATION: 'bg-yellow-100 text-yellow-800',
      GENERAL: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors.GENERAL;
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

  if (!ticket) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-gray-500">Ticket not found</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{ticket.title}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Ticket ID: {ticket.id}</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchTicketDetails}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Status and Priority */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              {getStatusBadge(ticket.status)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Priority</span>
              <TicketPriority priority={ticket.priority} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Category</span>
              <Badge className={getCategoryColor(ticket.category)} variant="secondary">
                {ticket.category}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
        </CardContent>
      </Card>

      {/* User Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">{ticket.user.name}</p>
                <p className="text-sm text-gray-600">{ticket.user.email}</p>
                {ticket.user.phone && (
                  <p className="text-sm text-gray-600">{ticket.user.phone}</p>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Created: {new Date(ticket.createdAt).toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Updated: {new Date(ticket.updatedAt).toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Response Section */}
      {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
        <TicketResponse
          ticketId={ticket.id}
          onSubmit={async (response) => {
            await onResolve?.(response);
            await fetchTicketDetails();
          }}
        />
      )}

      {/* Existing Admin Response */}
      {ticket.adminResponse && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg text-green-900">Admin Response</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{ticket.adminResponse}</p>
            {ticket.resolvedAt && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-green-200 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Resolved: {new Date(ticket.resolvedAt).toLocaleString()}</span>
                {ticket.resolvedBy && <span>by Admin {ticket.resolvedBy}</span>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status Actions */}
      {ticket.status !== 'CLOSED' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {ticket.status === 'OPEN' && (
                <Button
                  variant="default"
                  onClick={() => handleStatusChange('IN_PROGRESS')}
                >
                  Start Working
                </Button>
              )}
              {ticket.status === 'IN_PROGRESS' && (
                <>
                  <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleStatusChange('RESOLVED')}
                  >
                    Mark as Resolved
                  </Button>
                  <Button variant="outline" onClick={() => handleStatusChange('OPEN')}>
                    Reopen
                  </Button>
                </>
              )}
              {ticket.status === 'RESOLVED' && (
                <>
                  <Button variant="default" onClick={() => handleStatusChange('CLOSED')}>
                    Close Ticket
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusChange('IN_PROGRESS')}
                  >
                    Reopen
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assignment */}
      <TicketAssignment ticketId={ticket.id} currentAssignee={ticket.resolvedBy} />

      {/* Timeline */}
      <TicketTimeline ticketId={ticket.id} />
    </div>
  );
}