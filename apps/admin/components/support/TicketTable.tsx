// apps/admin/src/components/support/TicketTable.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Filter,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import TicketPriority from './TicketPriority';

interface Ticket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface TicketTableProps {
  onViewDetails: (ticketId: string) => void;
}

export default function TicketTable({ onViewDetails }: TicketTableProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    fetchTickets();
  }, [currentPage, statusFilter, categoryFilter, priorityFilter, searchTerm]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(categoryFilter !== 'ALL' && { category: categoryFilter }),
        ...(priorityFilter !== 'ALL' && { priority: priorityFilter }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/admin/support/tickets?${params}`);
      if (!response.ok) throw new Error('Failed to fetch tickets');

      const data = await response.json();
      setTickets(data.tickets || []);
      setTotalPages(data.totalPages || 1);
      setTotalTickets(data.total || 0);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Support Tickets</CardTitle>
            <p className="text-sm text-gray-500 mt-1">{totalTickets} total tickets</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchTickets}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                <SelectItem value="TECHNICAL">Technical</SelectItem>
                <SelectItem value="BILLING">Billing</SelectItem>
                <SelectItem value="PROPERTY">Property</SelectItem>
                <SelectItem value="VERIFICATION">Verification</SelectItem>
                <SelectItem value="GENERAL">General</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Priorities</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                    </TableCell>
                  </TableRow>
                ) : tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No tickets found
                    </TableCell>
                  </TableRow>
                ) : (
                  tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <span className="font-mono text-sm">{ticket.id.slice(0, 8)}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{ticket.userName}</p>
                          <p className="text-sm text-gray-500">{ticket.userEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium line-clamp-1">{ticket.title}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(ticket.category)} variant="secondary">
                          {ticket.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <TicketPriority priority={ticket.priority} />
                      </TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(ticket.createdAt).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetails(ticket.id)}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}