'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Button } from '@newcondo/ui/components/button';
import { Badge } from '@newcondo/ui/components/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@newcondo/ui/components/select';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';
import { Separator } from '@newcondo/ui/components/separator';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/shared/feedback/LoadingSpinner';
import {
  ArrowLeft,
  Download,
  FileText,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Filter,
  Eye,
  List
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@newcondo/ui/components/table';

// TODO: remember to implement virtualAccount webhooks and websockets 
// for instant notifications.
// look at the newcondo prompts folder for virtual accounts
interface Statement {
  id: string;
  month: string; // YYYY-MM format
  year: number;
  openingBalance: number;
  closingBalance: number;
  totalCredits: number;
  totalDebits: number;
  transactionCount: number;
  currency: string;
  generatedAt: string;
  downloadUrl?: string;
  status: 'READY' | 'GENERATING' | 'FAILED';
}

interface MonthlyTransaction {
  id: string;
  date: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  currency: string;
  description: string;
  reference: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  balanceAfter: number;
}

interface VirtualAccountInfo {
  id: string;
  accountName: string;
  accountNumber: string;
  bankCode: string;
  balance: number;
  currency: string;
}

export default function VirtualAccountStatementsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [accountInfo, setAccountInfo] = useState<VirtualAccountInfo | null>(null);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [selectedStatement, setSelectedStatement] = useState<Statement | null>(null);
  const [transactions, setTransactions] = useState<MonthlyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');

  useEffect(() => {
    fetchAccountInfo();
    fetchStatements();
  }, [id]);

  useEffect(() => {
    if (selectedPeriod && statements.length > 0) {
      const statement = statements.find(s => s.month === selectedPeriod);
      if (statement) {
        setSelectedStatement(statement);
        fetchTransactionsForPeriod(selectedPeriod);
      }
    }
  }, [selectedPeriod, statements]);

  const fetchAccountInfo = async () => {
    try {
      const response = await fetch(`/api/virtual-accounts/${id}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch account information');
      }

      const data = await response.json();
      setAccountInfo({
        id: data.data.id,
        accountName: data.data.accountName,
        accountNumber: data.data.accountNumber,
        bankCode: data.data.bankCode,
        balance: data.data.balance,
        currency: data.data.currency,
      });
    } catch (err) {
      console.error('Error fetching account info:', err);
    }
  };

  const fetchStatements = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/virtual-accounts/${id}/statements`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch statements');
      }

      const data = await response.json();
      setStatements(data.data);

      // Auto-select current month if available
      if (data.data.length > 0 && !selectedPeriod) {
        const currentMonth = format(new Date(), 'yyyy-MM');
        const currentStatement = data.data.find((s: Statement) => s.month === currentMonth);
        if (currentStatement) {
          setSelectedPeriod(currentMonth);
        } else {
          // Select most recent statement
          const sortedStatements = data.data.sort((a: Statement, b: Statement) =>
            new Date(b.month + '-01').getTime() - new Date(a.month + '-01').getTime()
          );
          setSelectedPeriod(sortedStatements[0].month);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionsForPeriod = async (period: string) => {
    try {
      setLoadingTransactions(true);
      const [year, month] = period.split('-');
      const startDate = startOfMonth(new Date(parseInt(year), parseInt(month) - 1));
      const endDate = endOfMonth(new Date(parseInt(year), parseInt(month) - 1));

      const response = await fetch(
        `/api/virtual-accounts/${id}/transactions?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data.data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const generateStatement = async (period: string) => {
    try {
      const response = await fetch(`/api/virtual-accounts/${id}/statements/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate statement');
      }

      // Refresh statements
      fetchStatements();
    } catch (err) {
      console.error('Error generating statement:', err);
    }
  };

  const downloadStatement = async (statement: Statement) => {
    try {
      const response = await fetch(`/api/virtual-accounts/${id}/statements/${statement.month}/download`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to download statement');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `statement-${accountInfo?.accountName}-${statement.month}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading statement:', err);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getMonthName = (monthString: string) => {
    const [year, month] = monthString.split('-');
    return format(new Date(parseInt(year), parseInt(month) - 1), 'MMMM yyyy');
  };

  // Generate available periods (last 12 months)
  const getAvailablePeriods = () => {
    const periods = [];
    const currentDate = new Date();

    for (let i = 0; i < 12; i++) {
      const date = subMonths(currentDate, i);
      const period = format(date, 'yyyy-MM');
      periods.push({
        value: period,
        label: format(date, 'MMMM yyyy'),
        hasStatement: statements.some(s => s.month === period)
      });
    }

    return periods;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !accountInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Account information not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const availablePeriods = getAvailablePeriods();

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/virtual-accounts/${id}`)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Account
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Account Statements</h1>
          <p className="text-muted-foreground">
            {accountInfo.accountName} - {accountInfo.accountNumber}
          </p>
        </div>
      </div>

      {/* Period Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Select Statement Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {availablePeriods.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    <div className="flex items-center gap-2">
                      {period.label}
                      {period.hasStatement && (
                        <Badge variant="secondary" className="text-xs">
                          Available
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedPeriod && !statements.find(s => s.month === selectedPeriod) && (
              <Button
                onClick={() => generateStatement(selectedPeriod)}
                variant="outline"
              >
                Generate Statement
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedStatement && (
        <>
          {/* Statement Summary */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Statement for {getMonthName(selectedStatement.month)}
                  </CardTitle>
                  <CardDescription>
                    Generated on {format(parseISO(selectedStatement.generatedAt), 'PPp')}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    selectedStatement.status === 'READY' ? 'default' :
                      selectedStatement.status === 'GENERATING' ? 'secondary' : 'destructive'
                  }>
                    {selectedStatement.status}
                  </Badge>
                  {selectedStatement.status === 'READY' && (
                    <Button
                      onClick={() => downloadStatement(selectedStatement)}
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Opening Balance</label>
                  <p className="text-2xl font-bold">
                    {formatCurrency(selectedStatement.openingBalance, selectedStatement.currency)}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Total Credits</label>
                  <p className="text-2xl font-bold text-green-600 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    {formatCurrency(selectedStatement.totalCredits, selectedStatement.currency)}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Total Debits</label>
                  <p className="text-2xl font-bold text-red-600 flex items-center gap-2">
                    <TrendingDown className="h-5 w-5" />
                    {formatCurrency(selectedStatement.totalDebits, selectedStatement.currency)}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Closing Balance</label>
                  <p className="text-2xl font-bold">
                    {formatCurrency(selectedStatement.closingBalance, selectedStatement.currency)}
                  </p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Total Transactions: {selectedStatement.transactionCount}</span>
                <span>•</span>
                <span>Period: {getMonthName(selectedStatement.month)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                Transactions for {getMonthName(selectedStatement.month)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTransactions ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No transactions found for this period.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-[150px]">Reference</TableHead>
                        <TableHead className="text-right">Balance After</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">
                            {format(parseISO(t.date), 'MM/dd/yyyy')}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{t.description}</div>
                            <div className="text-xs text-muted-foreground">{t.status}</div>
                          </TableCell>
                          <TableCell className={`text-right font-medium ${t.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                            {t.type === 'DEBIT' && '-'}{formatCurrency(t.amount, t.currency)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{t.reference}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(t.balanceAfter, t.currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
