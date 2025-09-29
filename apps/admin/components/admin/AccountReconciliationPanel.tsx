'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download,
  Filter,
  Search,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  getReconciliationDiscrepancies,
  reconcileTransaction,
  bulkReconcile,
  exportReconciliationReport,
} from '@/lib/api/virtualAccountAdmin';

interface Discrepancy {
  id: string;
  accountId: string;
  accountNumber: string;
  accountName: string;
  transactionRef: string;
  expectedAmount: number;
  actualAmount: number;
  difference: number;
  transactionDate: Date;
  status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'IGNORED';
  type: 'MISSING_CREDIT' | 'MISSING_DEBIT' | 'AMOUNT_MISMATCH' | 'DUPLICATE';
  notes?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
}

interface ReconcileDialogProps {
  discrepancy: Discrepancy | null;
  open: boolean;
  onClose: () => void;
  onReconcile: (data: ReconcileData) => void;
}

interface ReconcileData {
  discrepancyId: string;
  action: 'ADJUST_BALANCE' | 'MARK_RESOLVED' | 'IGNORE' | 'INVESTIGATE';
  notes: string;
  adjustmentAmount?: number;
}

function ReconcileDialog({
  discrepancy,
  open,
  onClose,
  onReconcile,
}: ReconcileDialogProps) {
  const [action, setAction] = useState<ReconcileData['action']>('MARK_RESOLVED');
  const [notes, setNotes] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');

  const handleSubmit = () => {
    if (!discrepancy) return;

    onReconcile({
      discrepancyId: discrepancy.id,
      action,
      notes,
      adjustmentAmount:
        action === 'ADJUST_BALANCE' ? parseFloat(adjustmentAmount) : undefined,
    });

    setNotes('');
    setAdjustmentAmount('');
    setAction('MARK_RESOLVED');
  };

  if (!discrepancy) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Reconcile Transaction Discrepancy</DialogTitle>
          <DialogDescription>
            Review and resolve the discrepancy for {discrepancy.accountName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Discrepancy Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Discrepancy Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Transaction Ref:</span>
                  <p className="font-medium">{discrepancy.transactionRef}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <p>
                    <Badge variant="outline">{discrepancy.type}</Badge>
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Expected:</span>
                  <p className="font-medium">
                    ₦{discrepancy.expectedAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Actual:</span>
                  <p className="font-medium">
                    ₦{discrepancy.actualAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Difference:</span>
                  <p
                    className={`font-medium ${
                      discrepancy.difference < 0
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}
                  >
                    ₦{Math.abs(discrepancy.difference).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <p className="font-medium">
                    {format(new Date(discrepancy.transactionDate), 'PPp')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resolution Action */}
          <div className="space-y-2">
            <Label>Resolution Action</Label>
            <Select
              value={action}
              onValueChange={(value) => setAction(value as ReconcileData['action'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MARK_RESOLVED">Mark as Resolved</SelectItem>
                <SelectItem value="ADJUST_BALANCE">Adjust Account Balance</SelectItem>
                <SelectItem value="INVESTIGATE">Requires Investigation</SelectItem>
                <SelectItem value="IGNORE">Ignore (Not an Issue)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Adjustment Amount (only for ADJUST_BALANCE) */}
          {action === 'ADJUST_BALANCE' && (
            <div className="space-y-2">
              <Label>Adjustment Amount (₦)</Label>
              <Input
                type="number"
                step="0.01"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(e.target.value)}
                placeholder="Enter adjustment amount"
              />
              <p className="text-xs text-muted-foreground">
                Positive values will credit the account, negative values will debit
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Resolution Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Explain the resolution..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!notes.trim()}>
            Apply Resolution
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AccountReconciliationPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState
    'pending' | 'investigating' | 'resolved'
  >('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedDiscrepancy, setSelectedDiscrepancy] =
    useState<Discrepancy | null>(null);
  const [reconcileDialogOpen, setReconcileDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Fetch discrepancies
  const { data: discrepancies, isLoading } = useQuery({
    queryKey: ['reconciliation-discrepancies', selectedTab, typeFilter, searchQuery],
    queryFn: () =>
      getReconciliationDiscrepancies({
        status: selectedTab.toUpperCase(),
        type: typeFilter !== 'all' ? typeFilter : undefined,
        search: searchQuery || undefined,
      }),
  });

  // Reconcile mutation
  const reconcileMutation = useMutation({
    mutationFn: reconcileTransaction,
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Discrepancy has been reconciled',
      });
      queryClient.invalidateQueries({ queryKey: ['reconciliation-discrepancies'] });
      setReconcileDialogOpen(false);
      setSelectedDiscrepancy(null);
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reconcile discrepancy',
      });
    },
  });

  // Bulk reconcile mutation
  const bulkReconcileMutation = useMutation({
    mutationFn: bulkReconcile,
    onSuccess: () => {
      toast({
        title: 'Success',
        description: `${selectedItems.size} discrepancies reconciled`,
      });
      queryClient.invalidateQueries({ queryKey: ['reconciliation-discrepancies'] });
      setSelectedItems(new Set());
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reconcile discrepancies',
      });
    },
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: exportReconciliationReport,
    onSuccess: (data) => {
      // Create download link
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `reconciliation-report-${format(new Date(), 'yyyy-MM-dd')}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast({
        title: 'Success',
        description: 'Report exported successfully',
      });
    },
  });

  const handleReconcile = (data: ReconcileData) => {
    reconcileMutation.mutate(data);
  };

  const handleBulkReconcile = () => {
    if (selectedItems.size === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select items to reconcile',
      });
      return;
    }

    bulkReconcileMutation.mutate({
      discrepancyIds: Array.from(selectedItems),
      action: 'MARK_RESOLVED',
      notes: 'Bulk reconciliation',
    });
  };

  const handleSelectAll = () => {
    if (!discrepancies) return;
    
    if (selectedItems.size === discrepancies.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(discrepancies.map((d: Discrepancy) => d.id)));
    }
  };

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const getStatusBadge = (status: Discrepancy['status']) => {
    const variants: Record
      Discrepancy['status'],
      { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }
    > = {
      PENDING: { variant: 'outline', icon: AlertCircle },
      INVESTIGATING: { variant: 'secondary', icon: RefreshCw },
      RESOLVED: { variant: 'default', icon: CheckCircle2 },
      IGNORED: { variant: 'destructive', icon: XCircle },
    };

    const { variant, icon: Icon } = variants[status];

    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getTypeBadge = (type: Discrepancy['type']) => {
    const colors: Record<Discrepancy['type'], string> = {
      MISSING_CREDIT: 'bg-yellow-100 text-yellow-800',
      MISSING_DEBIT: 'bg-orange-100 text-orange-800',
      AMOUNT_MISMATCH: 'bg-red-100 text-red-800',
      DUPLICATE: 'bg-purple-100 text-purple-800',
    };

    return (
      <Badge variant="outline" className={colors[type]}>
        {type.replace(/_/g, ' ')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Account Reconciliation</h2>
          <p className="text-muted-foreground">
            Review and resolve transaction discrepancies
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries()}
            disabled={isLoading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => exportMutation.mutate({ status: selectedTab })}
            disabled={exportMutation.isPending}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by account name, number, or transaction ref..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="MISSING_CREDIT">Missing Credit</SelectItem>
                <SelectItem value="MISSING_DEBIT">Missing Debit</SelectItem>
                <SelectItem value="AMOUNT_MISMATCH">Amount Mismatch</SelectItem>
                <SelectItem value="DUPLICATE">Duplicate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending
            {discrepancies &&
              selectedTab === 'pending' &&
              ` (${discrepancies.length})`}
          </TabsTrigger>
          <TabsTrigger value="investigating">
            Investigating
            {discrepancies &&
              selectedTab === 'investigating' &&
              ` (${discrepancies.length})`}
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved
            {discrepancies &&
              selectedTab === 'resolved' &&
              ` (${discrepancies.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          {/* Bulk Actions */}
          {selectedItems.size > 0 && (
            <Card>
              <CardContent className="flex items-center justify-between pt-6">
                <p className="text-sm text-muted-foreground">
                  {selectedItems.size} item(s) selected
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedItems(new Set())}
                  >
                    Clear Selection
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleBulkReconcile}
                    disabled={bulkReconcileMutation.isPending}
                  >
                    Bulk Reconcile
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Discrepancies Table */}
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !discrepancies || discrepancies.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No discrepancies found
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedItems.size === discrepancies.length}
                          onChange={handleSelectAll}
                          className="rounded"
                        />
                      </TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Transaction Ref</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Expected</TableHead>
                      <TableHead className="text-right">Actual</TableHead>
                      <TableHead className="text-right">Difference</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {discrepancies.map((discrepancy: Discrepancy) => (
                      <TableRow key={discrepancy.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedItems.has(discrepancy.id)}
                            onChange={() => handleSelectItem(discrepancy.id)}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{discrepancy.accountName}</p>
                            <p className="text-xs text-muted-foreground">
                              {discrepancy.accountNumber}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {discrepancy.transactionRef}
                        </TableCell>
                        <TableCell>{getTypeBadge(discrepancy.type)}</TableCell>
                        <TableCell className="text-right">
                          ₦{discrepancy.expectedAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ₦{discrepancy.actualAmount.toLocaleString()}
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            discrepancy.difference < 0
                              ? 'text-red-600'
                              : 'text-green-600'
                          }`}
                        >
                          {discrepancy.difference < 0 ? '-' : '+'}₦
                          {Math.abs(discrepancy.difference).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(
                            new Date(discrepancy.transactionDate),
                            'MMM d, yyyy'
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(discrepancy.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedDiscrepancy(discrepancy);
                              setReconcileDialogOpen(true);
                            }}
                          >
                            Reconcile
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reconcile Dialog */}
      <ReconcileDialog
        discrepancy={selectedDiscrepancy}
        open={reconcileDialogOpen}
        onClose={() => {
          setReconcileDialogOpen(false);
          setSelectedDiscrepancy(null);
        }}
        onReconcile={handleReconcile}
      />
    </div>
  );
}