'use client';

import { Badge } from '@newcondo/ui';
import { ArrowDownToLine, ArrowUpFromLine, Clock } from 'lucide-react';
import type { RecentTransaction } from '@/types/wallet';

interface TransactionHistoryProps {
  transactions: RecentTransaction[];
}

function formatCurrency(amount: number, currency = 'NGN') {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: Date | string | null) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'SUCCESS':
    case 'RELEASED':
      return 'default';
    case 'PENDING':
    case 'HELD':
      return 'secondary';
    case 'FAILED':
    case 'CANCELLED':
      return 'destructive';
    default:
      return 'outline';
  }
}

function paymentTypeLabel(type: string) {
  return type
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-10">
        <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No transactions yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {transactions.map((tx) => {
        const isCredit = tx.status === 'RELEASED' || tx.status === 'SUCCESS';
        const displayAmount = Number(tx.ownerAmount ?? tx.agentCommission ?? tx.amount);

        return (
          <div
            key={tx.id}
            className="flex items-center justify-between py-3 border-b last:border-0"
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-1.5 rounded-full ${
                  isCredit ? 'bg-green-100' : 'bg-red-100'
                }`}
              >
                {isCredit ? (
                  <ArrowDownToLine className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <ArrowUpFromLine className="h-3.5 w-3.5 text-red-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {tx.rental?.property?.title ??
                    tx.description ??
                    paymentTypeLabel(tx.paymentType)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(tx.releasedAt ?? tx.paidAt ?? tx.createdAt)}
                </p>
              </div>
            </div>

            <div className="text-right space-y-1">
              <p
                className={`text-sm font-semibold ${
                  isCredit ? 'text-green-600' : 'text-foreground'
                }`}
              >
                {isCredit ? '+' : ''}
                {formatCurrency(displayAmount, tx.currency)}
              </p>
              <Badge variant={statusVariant(tx.status)} className="text-xs py-0">
                {tx.status}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}