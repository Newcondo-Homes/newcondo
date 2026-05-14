'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, EyeOff, RefreshCw, Wallet } from 'lucide-react';
import { Button } from '@newcondo/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Skeleton } from '@newcondo/ui/components/skeleton';
import { formatCurrency } from '@/lib/utils/format';
import { virtualAccountsApi } from '@/lib/api/virtualAccounts';
import type { VirtualAccount } from '@/types/virtualAccount';

interface VirtualAccountBalanceProps {
  showWithdrawButton?: boolean;
  onWithdraw?: () => void;
}

export function VirtualAccountBalance({
  showWithdrawButton = true,
  onWithdraw,
}: VirtualAccountBalanceProps) {
  const [showBalance, setShowBalance] = useState(true);

  //  If you need a specific account by ID, use virtualAccountsApi.getAccount(accountId)
  //  instead and add accountId as a prop to VirtualAccountBalanceProps.
  const {
    data: account,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['virtual-account-balance'],
    queryFn: (): Promise<VirtualAccount> => virtualAccountsApi.getUserVirtualAccounts().then(accounts => accounts[0]),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wallet Balance</CardTitle>
          <CardDescription>Your virtual account balance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!account) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wallet Balance</CardTitle>
          <CardDescription>Your virtual account balance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No virtual account found. Please contact support.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Wallet Balance</CardTitle>
            <CardDescription>Your virtual account balance</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
            <p className="text-3xl font-bold">
              {showBalance ? (
                formatCurrency(parseFloat(account.balance.toString()), account.currency)
              ) : (
                <span className="tracking-wider">₦ ••••••</span>
              )}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowBalance(!showBalance)}
          >
            {showBalance ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Account Number</span>
            <span className="font-mono font-medium">{account.accountNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Account Name</span>
            <span className="font-medium">{account.accountName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Bank</span>
            <span className="font-medium">{account.bankCode}</span>
          </div>
        </div>

        {showWithdrawButton && parseFloat(account.balance.toString()) > 0 && (
          <Button
            onClick={onWithdraw}
            className="w-full"
            size="lg"
          >
            Withdraw Funds
          </Button>
        )}

        {!account.isActive && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Your virtual account is currently inactive. Please contact support.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}