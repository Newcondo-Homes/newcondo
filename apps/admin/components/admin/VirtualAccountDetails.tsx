'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui';
import { Badge } from '@newcondo/ui';
import { Button } from '@newcondo/ui';
import { Separator } from '@newcondo/ui';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@newcondo/ui';
import {
  Banknote,
  User,
  Building2,
  Calendar,
  Hash,
  Activity,
  Lock,
  Unlock,
} from 'lucide-react';
import Link from 'next/link';
import { getVirtualAccountDetails, toggleAccountStatus } from '@/lib/api/virtualAccountAdmin';

interface AccountDetailsProps {
  accountId: string;
}

interface AccountDetails {
  id: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  balance: string;
  currency: string;
  isActive: boolean;
  flutterwaveAccountId: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  property: {
    id: string;
    title: string;
    address: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  stats: {
    totalTransactions: number;
    totalCredits: string;
    totalDebits: string;
    lastTransaction: string | null;
  };
}

export function VirtualAccountDetails({ accountId }: AccountDetailsProps) {
  const [account, setAccount] = useState<AccountDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    loadAccountDetails();
  }, [accountId]);

  const loadAccountDetails = async () => {
    try {
      setLoading(true);
      const data = await getVirtualAccountDetails(accountId);
      setAccount(data);
    } catch (error) {
      console.error('Failed to load account details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!account) return;
    
    try {
      setToggling(true);
      await toggleAccountStatus(accountId, !account.isActive);
      await loadAccountDetails();
    } catch (error) {
      console.error('Failed to toggle account status:', error);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return <div>Loading account details...</div>;
  }

  if (!account) {
    return <div>Account not found</div>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Account Information</CardTitle>
          <Badge variant={account.isActive ? 'default' : 'secondary'}>
            {account.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Hash className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Account Number</p>
              <p className="font-mono text-lg">{account.accountNumber}</p>
            </div>
          </div>

          <Separator />

          <div className="flex items-start gap-3">
            <Banknote className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Account Name</p>
              <p className="text-sm">{account.accountName}</p>
            </div>
          </div>

          <Separator />

          <div className="flex items-start gap-3">
            <Activity className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Current Balance</p>
              <p className="text-2xl font-bold">
                {account.currency} {parseFloat(account.balance).toLocaleString()}
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Created</p>
              <p className="text-sm text-muted-foreground">
                {new Date(account.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <Separator />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant={account.isActive ? 'destructive' : 'default'} 
                className="w-full"
                disabled={toggling}
              >
                {account.isActive ? (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Deactivate Account
                  </>
                ) : (
                  <>
                    <Unlock className="mr-2 h-4 w-4" />
                    Activate Account
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {account.isActive ? 'Deactivate' : 'Activate'} Virtual Account?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {account.isActive
                    ? 'This will prevent any new transactions to this account. Existing funds will remain accessible.'
                    : 'This will allow transactions to resume for this account.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleToggleStatus}>
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Owner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Name</p>
                <Link 
                  href={`/users/${account.user.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  {account.user.name}
                </Link>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <User className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{account.user.email}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <Badge variant="outline">{account.user.role}</Badge>
            </div>
          </CardContent>
        </Card>

        {account.property && (
          <Card>
            <CardHeader>
              <CardTitle>Linked Property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <Link 
                    href={`/properties/${account.property.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {account.property.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {account.property.address}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Account Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Total Transactions</p>
                <p className="text-2xl font-bold">{account.stats.totalTransactions}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Last Transaction</p>
                <p className="text-sm text-muted-foreground">
                  {account.stats.lastTransaction
                    ? new Date(account.stats.lastTransaction).toLocaleDateString()
                    : 'No transactions'}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-green-600">Total Credits</p>
                <p className="text-lg font-semibold text-green-600">
                  {account.currency} {parseFloat(account.stats.totalCredits).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-red-600">Total Debits</p>
                <p className="text-lg font-semibold text-red-600">
                  {account.currency} {parseFloat(account.stats.totalDebits).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}