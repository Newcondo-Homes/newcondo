'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Input } from '@newcondo/ui/components/input';
import { Label } from '@newcondo/ui/components/label';
import { Separator } from '@newcondo/ui/components/separator';
import { AlertCircle, CheckCircle2, DollarSign, FileText, Search } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
// import { useReconcileAccount } from '@/hooks/useVirtualAccounts';
import { useVirtualAccountStatements } from '@/hooks/useVirtualAccountStatements';
import { VirtualAccount, ReconciliationReport, VirtualAccountTransaction } from '@/types/virtualAccount';
import { LoadingSpinner } from '@/components/shared/feedback/LoadingSpinner';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';

interface AccountReconciliationProps {
  account: VirtualAccount;
  onReconciliationComplete?: (report: ReconciliationReport) => void;
}

export function AccountReconciliation({
  account,
  // onReconciliationComplete
}: AccountReconciliationProps) {
  const [reconciliationPeriod, setReconciliationPeriod] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0]
  });
  const [manualBalance, setManualBalance] = useState<string>('');
  const [reconciliationReport, setReconciliationReport] = useState<ReconciliationReport | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);

  // const reconcileMutation = useReconcileAccount();
  const {
    statements,
    transactions,
    isStatementsLoading: statementsLoading,
    setDateRange,
  } = useVirtualAccountStatements(account.id);


  useEffect(() => {
    if (account.id) {
      setDateRange(reconciliationPeriod.startDate, reconciliationPeriod.endDate);
    }
  }, [account.id, reconciliationPeriod, setDateRange]);

  const handleReconciliation = async () => {
    if (!manualBalance) return;

    setIsReconciling(true);
    try {
      //TODO: implement the reconcile feature
      // const report = await reconcileMutation.mutateAsync({
      //   accountId: account.id,
      //   startDate: reconciliationPeriod.startDate,
      //   endDate: reconciliationPeriod.endDate,
      //   manualBalance: parseFloat(manualBalance),
      //   statementBalance: account.balance,
      // })as ReconciliationReport;

      // setReconciliationReport(report);
      // onReconciliationComplete?.(report);
      setReconciliationReport(null);

    } catch (error) {
      console.error('Reconciliation failed:', error);
    } finally {
      setIsReconciling(false);
    }
  };

  const getReconciliationStatus = () => {
    if (!reconciliationReport) return null;

    const { discrepancy } = reconciliationReport;
    if (Math.abs(discrepancy) < 0.01) {
      return { status: 'balanced', color: 'success', icon: CheckCircle2 };
    } else if (Math.abs(discrepancy) < 100) {
      return { status: 'minor_discrepancy', color: 'warning', icon: AlertCircle };
    } else {
      return { status: 'major_discrepancy', color: 'destructive', icon: AlertCircle };
    }
  };

  const reconciliationStatus = getReconciliationStatus();

  if (statementsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Account Reconciliation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Account Reconciliation
          </CardTitle>
          <CardDescription>
            Compare your records with the system balance for {account.accountName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Reconciliation Period */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={reconciliationPeriod.startDate}
                onChange={(e) => setReconciliationPeriod(prev => ({
                  ...prev,
                  startDate: e.target.value
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={reconciliationPeriod.endDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setReconciliationPeriod(prev => ({
                  ...prev,
                  endDate: e.target.value
                }))}
              />
            </div>
          </div>

          {/* Balance Information */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">System Balance</Label>
              <p className="text-lg font-semibold">
                {formatCurrency(account.balance, account.currency)}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manualBalance">Your Records Balance</Label>
              <Input
                id="manualBalance"
                type="number"
                step="0.01"
                placeholder="Enter your balance"
                value={manualBalance}
                onChange={(e) => setManualBalance(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleReconciliation}
            disabled={!manualBalance || isReconciling}
            className="w-full"
          >
            {isReconciling ? (
              <>
                <LoadingSpinner className="h-4 w-4 mr-2" />
                Reconciling...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Run Reconciliation
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Reconciliation Report */}
      {reconciliationReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {reconciliationStatus && (
                <reconciliationStatus.icon className={`h-5 w-5 ${reconciliationStatus.color === 'success' ? 'text-green-600' :
                    reconciliationStatus.color === 'warning' ? 'text-yellow-600' :
                      'text-red-600'
                  }`} />
              )}
              Reconciliation Report
            </CardTitle>
            <CardDescription>
              Generated on {new Date(reconciliationReport.generatedAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 border rounded-lg">
                <p className="text-sm text-muted-foreground">System Balance</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(reconciliationReport.systemBalance, account.currency)}
                </p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-sm text-muted-foreground">Manual Balance</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(reconciliationReport.manualBalance, account.currency)}
                </p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-sm text-muted-foreground">Discrepancy</p>
                <p className={`text-lg font-semibold ${Math.abs(reconciliationReport.discrepancy) < 0.01 ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {formatCurrency(reconciliationReport.discrepancy, account.currency)}
                </p>
              </div>
            </div>

            {/* Status Alert */}
            {reconciliationStatus && (
              <Alert className={`border-${reconciliationStatus.color}`}>
                <reconciliationStatus.icon className="h-4 w-4" />
                <AlertDescription>
                  {reconciliationStatus.status === 'balanced' &&
                    'Perfect match! Your records are in sync with the system.'}
                  {reconciliationStatus.status === 'minor_discrepancy' &&
                    'Minor discrepancy detected. This might be due to pending transactions or timing differences.'}
                  {reconciliationStatus.status === 'major_discrepancy' &&
                    'Significant discrepancy found. Please review your records and contact support if needed.'}
                </AlertDescription>
              </Alert>
            )}

            {/* Transaction Summary */}
            <Separator />
            <div>
              <h4 className="font-medium mb-3">Transaction Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Credits:</span>
                    <span className="font-medium text-green-600">
                      {reconciliationReport.totalCredits} transactions
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Credits:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(reconciliationReport.creditAmount, account.currency)}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Debits:</span>
                    <span className="font-medium text-red-600">
                      {reconciliationReport.totalDebits} transactions
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Debits:</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(reconciliationReport.debitAmount, account.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {reconciliationReport.recommendations && reconciliationReport.recommendations.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-3">Recommendations</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {reconciliationReport.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-xs mt-1">•</span>
                        <span>{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions for Review */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Transactions for the selected reconciliation period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {transactions.slice(0, 10).map((transaction: VirtualAccountTransaction, index: number) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-1 rounded-full ${transaction.type === 'CREDIT' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                      <DollarSign className={`h-3 w-3 ${transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                        }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                      }`}>
                      {transaction.type === 'CREDIT' ? '+' : '-'}
                      {formatCurrency(transaction.amount, account.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {statements.length > 10 && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                Showing 10 of {statements.length} transactions
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}