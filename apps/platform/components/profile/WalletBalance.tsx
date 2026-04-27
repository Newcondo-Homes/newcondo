'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui';
import { Wallet, Clock, TrendingUp, Building2 } from 'lucide-react';
import type { VirtualAccountWithProperty, PendingRelease } from '@/types/wallet';

interface WalletBalanceProps {
  totalBalance: number;
  pendingAmount: number;
  virtualAccounts: VirtualAccountWithProperty[];
  pendingReleases: PendingRelease[];
}

function formatCurrency(amount: number, currency = 'NGN') {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: Date | null) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function WalletBalance({
  totalBalance,
  pendingAmount,
  virtualAccounts,
  pendingReleases,
}: WalletBalanceProps) {
  const activeAccounts = virtualAccounts.filter((a) => a.isActive);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Across {activeAccounts.length} active account
              {activeAccounts.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Release
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(pendingAmount)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingReleases.length} payment
              {pendingReleases.length !== 1 ? 's' : ''} pending confirmation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expected
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(totalBalance + pendingAmount)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Available + pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Virtual accounts */}
      {virtualAccounts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Virtual Accounts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {virtualAccounts.map((account) => (
              <Card key={account.id} className={!account.isActive ? 'opacity-60' : ''}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">{account.accountName}</p>
                        <p className="text-xs text-muted-foreground">
                          {account.accountNumber} · {account.bankCode}
                        </p>
                        {account.property && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {account.property.title}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(Number(account.balance), account.currency)}
                      </p>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full ${
                          account.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {account.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pending releases */}
      {pendingReleases.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Pending Releases</h2>
          <div className="space-y-2">
            {pendingReleases.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {payment.rental?.property?.title ?? 'Payment'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Releases {formatDate(payment.confirmationPeriodEnd)}
                      </p>
                    </div>
                    <p className="font-semibold text-sm">
                      {formatCurrency(
                        Number(payment.ownerAmount ?? payment.agentCommission ?? 0),
                        payment.currency
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}