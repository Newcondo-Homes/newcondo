// apps/platform/components/virtual-accounts/VirtualAccountStatements.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Download,
  Calendar as CalendarIcon,
  Filter,
  FileText,
  AlertCircle,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils/format';

interface StatementTransaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: string;
  currency: string;
  description: string;
  reference: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  balanceAfter: string;
  createdAt: string;
  metadata?: {
    propertyTitle?: string;
    renterName?: string;
    paymentType?: string;
  };
}

interface VirtualAccountStatement {
  id: string;
  accountId: string;
  accountNumber: string;
  accountName: string;
  period: {
    startDate: string;
    endDate: string;
  };
  openingBalance: string;
  closingBalance: string;
  totalCredits: string;
  totalDebits: string;
  transactionCount: number;
  transactions: StatementTransaction[];
  generatedAt: string;
}

interface VirtualAccountStatementsProps {
  accountId?: string;
  propertyId?: string;
}

export default function VirtualAccountStatements({ 
  accountId, 
  propertyId 
}: VirtualAccountStatementsProps) {
  const { user } = useAuth();
  const [statements, setStatements] = useState<VirtualAccountStatement[]>([]);
  const [selectedStatement, setSelectedStatement] = useState<VirtualAccountStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchStatements();
  }, [accountId, propertyId, user?.id]);

  const fetchStatements = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams({
        userId: user.id,
        ...(accountId && { accountId }),
        ...(propertyId && { propertyId })
      });

      const response = await fetch(`/api/virtual-accounts/statements?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch statements');
      }
      
      const data = await response.json();
      setStatements(data.statements || []);
      
      if (data.statements?.length > 0) {
        setSelectedStatement(data.statements[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statements');
    } finally {
      setLoading(false);
    }
  };

  const generateStatement = async () => {
    if (!user?.id || !dateRange.from || !dateRange.to) return;
    
    try {
      setIsGenerating(true);
      setError(null);
      
      const response = await fetch('/api/virtual-accounts/statements/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          accountId: selectedAccount !== 'all' ? selectedAccount : undefined,
          propertyId,
          startDate: dateRange.from.toISOString(),
          endDate: dateRange.to.toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate statement');
      }
      
      const newStatement = await response.json();
      setStatements(prev => [newStatement.statement, ...prev]);
      setSelectedStatement(newStatement.statement);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate statement');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadStatement = async (statementId: string, format: 'PDF' | 'CSV') => {
    try {
      const response = await fetch(`/api/virtual-accounts/statements/${statementId}/download?format=${format.toLowerCase()}`);
      
      if (!response.ok) {
        throw new Error('Failed to download statement');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `statement_${statementId}.${format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download statement');
    }
  };

  const getTransactionIcon = (transaction: StatementTransaction) => {
    if (transaction.type === 'CREDIT') {
      return <div className="w-2 h-2 bg-green-500 rounded-full" />;
    }
    return <div className="w-2 h-2 bg-red-500 rounded-full" />;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      SUCCESS: 'default',
      PENDING: 'secondary',
      FAILED: 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'} className="text-xs">
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Error loading statements</p>
              <p className="text-sm text-red-500">{error}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchStatements}
            className="mt-3"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statement Generation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Account Statements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date Range Picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Period</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Account Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Account</label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {/* Add dynamic account options here */}
                </SelectContent>
              </Select>
            </div>

            {/* Transaction Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="credit">Credits Only</SelectItem>
                  <SelectItem value="debit">Debits Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Generate Button */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Actions</label>
              <Button 
                onClick={generateStatement} 
                disabled={isGenerating || !dateRange.from || !dateRange.to}
                className="w-full"
              >
                {isGenerating ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                Generate Statement
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statement List */}
      {statements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Statements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statements.map((statement) => (
                <div
                  key={statement.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedStatement?.id === statement.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedStatement(statement)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{statement.accountName}</h4>
                      <p className="text-sm text-gray-600">
                        {format(new Date(statement.period.startDate), "MMM dd, yyyy")} - {" "}
                        {format(new Date(statement.period.endDate), "MMM dd, yyyy")}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {statement.transactionCount} transactions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatCurrency(parseFloat(statement.closingBalance), statement.transactions[0]?.currency || 'NGN')}
                      </p>
                      <div className="flex space-x-1 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadStatement(statement.id, 'PDF');
                          }}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadStatement(statement.id, 'CSV');
                          }}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          CSV
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statement Details */}
      {selectedStatement && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Statement Details</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedStatement.accountName} • {selectedStatement.accountNumber}
                </p>
              </div>
              <Badge variant="outline">
                {format(new Date(selectedStatement.period.startDate), "MMM dd")} - {" "}
                {format(new Date(selectedStatement.period.endDate), "MMM dd, yyyy")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Statement Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Opening Balance</p>
                <p className="font-medium">
                  {formatCurrency(parseFloat(selectedStatement.openingBalance), 'NGN')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Credits</p>
                <p className="font-medium text-green-600">
                  +{formatCurrency(parseFloat(selectedStatement.totalCredits), 'NGN')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Debits</p>
                <p className="font-medium text-red-600">
                  -{formatCurrency(parseFloat(selectedStatement.totalDebits), 'NGN')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Closing Balance</p>
                <p className="font-medium">
                  {formatCurrency(parseFloat(selectedStatement.closingBalance), 'NGN')}
                </p>
              </div>
            </div>

            {/* Transactions */}
            <div>
              <h4 className="font-medium mb-3">Transaction History</h4>
              <div className="space-y-3">
                {selectedStatement.transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    {getTransactionIcon(transaction)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{transaction.description}</p>
                        <div className="text-right">
                          <p className={`font-medium ${
                            transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'CREDIT' ? '+' : '-'}
                            {formatCurrency(parseFloat(transaction.amount), transaction.currency)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Balance: {formatCurrency(parseFloat(transaction.balanceAfter), transaction.currency)}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
                        <span>{format(new Date(transaction.createdAt), 'MMM dd, yyyy hh:mm a')}</span>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
