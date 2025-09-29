'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { getAccountAuditLogs, getAuditLogDetails } from '@/lib/api/virtualAccountAdmin';

interface AuditLog {
  id: string;
  accountId: string;
  accountNumber: string;
  accountName: string;
  action: string;
  actionType:
    | 'ACCOUNT_CREATED'
    | 'BALANCE_ADJUSTED'
    | 'TRANSACTION_CREDITED'
    | 'TRANSACTION_DEBITED'
    | 'ACCOUNT_SUSPENDED'
    | 'ACCOUNT_REACTIVATED'
    | 'RECONCILIATION'
    | 'STATEMENT_GENERATED';
  performedBy: string;
  performedByName: string;
  performedByRole: string;
  previousState?: any;
  newState?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

interface AuditDetailsDialogProps {
  logId: string | null;
  open: boolean;
  onClose: () => void;
}

function AuditDetailsDialog({ logId, open, onClose }: AuditDetailsDialogProps) {
  const { data: details, isLoading } = useQuery<AuditLog>({
    queryKey: ['audit-log-details', logId],
    queryFn: () => getAuditLogDetails(logId!),
    enabled: !!logId && open,
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Audit Log Details</DialogTitle>
          <DialogDescription>
            Detailed information about this audit event
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : details ? (
          <div className="space-y-4">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground">Action:</span>
                    <p className="font-medium">{details.action}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <p>
                      <Badge>{details.actionType}</Badge>
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Performed By:</span>
                    <p className="font-medium">{details.performedByName}</p>
                    <p className="text-xs text-muted-foreground">
                      {details.performedByRole}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Timestamp:</span>
                    <p className="font-medium">
                      {format(new Date(details.timestamp), 'PPpp')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground">Account Name:</span>
                    <p className="font-medium">{details.accountName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Account Number:</span>
                    <p className="font-mono">{details.accountNumber}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* State Changes */}
            {(details.previousState || details.newState) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">State Changes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {details.previousState && (
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Previous State:
                        </span>
                        <pre className="mt-1 rounded bg-muted p-2 text-xs overflow-x-auto">
                          {JSON.stringify(details.previousState, null, 2)}
                        </pre>
                      </div>
                    )}
                    {details.newState && (
                      <div>
                        <span className="text-muted-foreground text-xs">
                          New State:
                        </span>
                        <pre className="mt-1 rounded bg-muted p-2 text-xs overflow-x-auto">
                          {JSON.stringify(details.newState, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            {details.metadata && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Additional Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="rounded bg-muted p-3 text-xs overflow-x-auto">
                    {JSON.stringify(details.metadata, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Request Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Request Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">IP Address:</span>
                  <p className="font-mono">{details.ipAddress || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">User Agent:</span>
                  <p className="text-xs break-all">
                    {details.userAgent || 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// Helper function to render the severity badge
const getSeverityBadge = (severity: AuditLog['severity']) => {
  const base = 'px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1';
  switch (severity) {
    case 'CRITICAL':
      return <Badge variant="destructive" className={base}><AlertTriangle className="h-3 w-3" /> Critical</Badge>;
    case 'WARNING':
      // Custom styling for a warning badge (often yellow)
      return <Badge variant="default" className={`${base} bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80`}><AlertTriangle className="h-3 w-3" /> Warning</Badge>;
    case 'INFO':
    default:
      return <Badge variant="secondary" className={base}><CheckCircle2 className="h-3 w-3" /> Info</Badge>;
  }
};

// Helper function to render action icon
const getActionIcon = (actionType: AuditLog['actionType']) => {
  switch (actionType) {
    case 'TRANSACTION_CREDITED':
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case 'TRANSACTION_DEBITED':
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    case 'ACCOUNT_CREATED':
    case 'ACCOUNT_REACTIVATED':
      return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
    case 'ACCOUNT_SUSPENDED':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'BALANCE_ADJUSTED':
    case 'RECONCILIATION':
      return <RefreshCw className="h-4 w-4 text-yellow-500" />;
    case 'STATEMENT_GENERATED':
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

// Available action types for filtering
const actionTypeOptions: AuditLog['actionType'][] = [
  'ACCOUNT_CREATED',
  'BALANCE_ADJUSTED',
  'TRANSACTION_CREDITED',
  'TRANSACTION_DEBITED',
  'ACCOUNT_SUSPENDED',
  'ACCOUNT_REACTIVATED',
  'RECONCILIATION',
  'STATEMENT_GENERATED',
];

export default function VirtualAccountAudit() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>(
    'week'
  );
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const openDetailsDialog = (logId: string) => {
    setSelectedLogId(logId);
    setDetailsDialogOpen(true);
  };

  // Fetch audit logs
  const { data: auditLogs, isLoading, refetch } = useQuery<AuditLog[]>({
    queryKey: [
      'audit-logs',
      searchQuery,
      actionTypeFilter,
      severityFilter,
      dateRange,
    ],
    queryFn: () =>
      getAccountAuditLogs({
        search: searchQuery,
        actionType: actionTypeFilter === 'all' ? undefined : actionTypeFilter,
        severity: severityFilter === 'all' ? undefined : severityFilter,
        dateRange: dateRange === 'all' ? undefined : dateRange,
      }),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Virtual Account Audit Logs</CardTitle>
            <CardDescription>
              Track all changes and actions performed on virtual accounts.
            </CardDescription>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Section */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by account number, name, or performer..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={actionTypeFilter}
                onValueChange={setActionTypeFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Action Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {actionTypeOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={severityFilter}
                onValueChange={setSeverityFilter}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                  <SelectItem value="WARNING">Warning</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range Tabs */}
          <Tabs value={dateRange} onValueChange={setDateRange as (value: string) => void} className="w-full">
            <TabsList className="grid w-full grid-cols-4 md:w-fit">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">Past Week</TabsTrigger>
              <TabsTrigger value="month">Past Month</TabsTrigger>
              <TabsTrigger value="all">All Time</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Timestamp</TableHead>
                  <TableHead className="w-[180px]">Account</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Performed By</TableHead>
                  <TableHead className="text-center">Severity</TableHead>
                  <TableHead className="w-[80px]">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-5 w-5 animate-spin mr-2 text-muted-foreground" />
                        Loading audit logs...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : auditLogs && auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium text-xs">
                        {format(new Date(log.timestamp), 'MMM dd, yyyy')}
                        <div className="text-muted-foreground">
                          {format(new Date(log.timestamp), 'HH:mm:ss')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{log.accountName}</div>
                        <div className="text-xs text-muted-foreground">
                          {log.accountNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.actionType)}
                          <span className="font-medium">{log.action}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {log.actionType.replace('_', ' ')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{log.performedByName}</div>
                        <div className="text-xs text-muted-foreground">
                          {log.performedByRole}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {getSeverityBadge(log.severity)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDetailsDialog(log.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No audit logs found matching the current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Details Dialog */}
      <AuditDetailsDialog
        logId={selectedLogId}
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
      />
    </div>
  );
}