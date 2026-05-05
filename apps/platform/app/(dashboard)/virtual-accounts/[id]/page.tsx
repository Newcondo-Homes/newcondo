'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Button } from '@newcondo/ui/components/button';
import { Badge } from '@newcondo/ui/components/badge';
import { Separator } from '@newcondo/ui/components/separator';
// fix line 9: removed unused Tabs, TabsContent, TabsList, TabsTrigger
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/shared/feedback/LoadingSpinner';
import {
  ArrowLeft,
  Copy,
  Eye,
  EyeOff,
  AlertCircle,
  // fix line 19: removed unused CheckCircle
  Building,
  User,
  CreditCard,
  Activity,
  FileText
} from 'lucide-react';
import VirtualAccountBalance from '@/components/virtual-accounts/VirtualAccountBalance';
import { format } from 'date-fns';

interface VirtualAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  balance: number;
  currency: string;
  isActive: boolean;
  flutterwaveAccountId?: string;
  property?: {
    id: string;
    title: string;
    address: string;
    city: string;
    state: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface RecentTransaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  currency: string;
  description: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  createdAt: string;
}

export default function VirtualAccountDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  // fix line 68: removed unused `user` destructure — keep useAuth if needed elsewhere
  useAuth();
  const [virtualAccount, setVirtualAccount] = useState<VirtualAccount | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // fix line 78: wrapped in useCallback so it's stable for the dep array
  const fetchVirtualAccountDetails = useCallback(async () => {
    try {
      setLoading(true);

      const accountResponse = await fetch(`/api/virtual-accounts/${id}`,
        { credentials: 'include' }
      );

      if (!accountResponse.ok) {
        throw new Error('Failed to fetch virtual account details');
      }

      const accountData = await accountResponse.json();
      setVirtualAccount(accountData.data);

      const transactionsResponse = await fetch(`/api/virtual-accounts/${id}/transactions?limit=5`,
        { credentials: 'include' });

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setRecentTransactions(transactionsData.data);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVirtualAccountDetails();
  }, [fetchVirtualAccountDetails]);

  const handleCopyAccountNumber = async () => {
    if (virtualAccount) {
      try {
        await navigator.clipboard.writeText(virtualAccount.accountNumber);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy account number:', err);
      }
    }
  };

  const formatCurrency = (amount: number, currency: string = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getBankName = (bankCode: string) => {
    const bankNames: Record<string, string> = {
      '044': 'Access Bank',
      '014': 'Afribank',
      '023': 'Citibank',
      '050': 'Ecobank',
      '084': 'Enterprise Bank',
      '070': 'Fidelity Bank',
      '011': 'First Bank',
      '214': 'FCMB',
      '058': 'GTBank',
      '030': 'Heritage Bank',
      '082': 'Keystone Bank',
      '076': 'Polaris Bank',
      '221': 'Stanbic IBTC',
      '068': 'Standard Chartered',
      '232': 'Sterling Bank',
      '032': 'Union Bank',
      '033': 'UBA',
      '215': 'Unity Bank',
      '035': 'Wema Bank',
      '057': 'Zenith Bank',
    };
    return bankNames[bankCode] || 'Unknown Bank';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !virtualAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Virtual account not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Virtual Account Details</h1>
          <p className="text-muted-foreground">
            Manage your virtual account and view transaction history
          </p>
        </div>
      </div>

      {/* Account Status Alert */}
      {!virtualAccount.isActive && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This virtual account is currently inactive. Please contact support for assistance.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Information Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Account Information
                  </CardTitle>
                  <CardDescription>
                    Virtual account details for {virtualAccount.property ? 'property' : 'general'} transactions
                  </CardDescription>
                </div>
                <Badge variant={virtualAccount.isActive ? "default" : "secondary"}>
                  {virtualAccount.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Account Name</label>
                  <p className="font-mono text-lg">{virtualAccount.accountName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Bank</label>
                  <p className="text-lg">{getBankName(virtualAccount.bankCode)}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Account Number</label>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-mono text-lg">
                      {showAccountNumber ? virtualAccount.accountNumber : '••••••••••'}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAccountNumber(!showAccountNumber)}
                    >
                      {showAccountNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyAccountNumber}
                      disabled={!showAccountNumber}
                    >
                      <Copy className="h-4 w-4" />
                      {copySuccess ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <span className="ml-2">{format(new Date(virtualAccount.createdAt), 'PPP')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span className="ml-2">{format(new Date(virtualAccount.updatedAt), 'PPP')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Linked Property/User */}
          {virtualAccount.property ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Linked Property
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="font-medium">{virtualAccount.property.title}</h3>
                  <p className="text-muted-foreground">
                    {virtualAccount.property.address}, {virtualAccount.property.city}, {virtualAccount.property.state}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/properties/${virtualAccount.property?.id}`)}
                  >
                    View Property
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Owner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="font-medium">{virtualAccount.user.name}</h3>
                  <p className="text-muted-foreground">{virtualAccount.user.email}</p>
                  <Badge variant="outline">{virtualAccount.user.role}</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Transactions
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/virtual-accounts/${id}/transactions`)}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No transactions yet
                </p>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(transaction.createdAt), 'PPp')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'CREDIT' ? '+' : '-'}
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </p>
                        <Badge
                          variant={
                            transaction.status === 'SUCCESS' ? 'default' :
                              transaction.status === 'PENDING' ? 'secondary' : 'destructive'
                          }
                          className="text-xs"
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Balance Card */}
          <VirtualAccountBalance
            propertyId={virtualAccount.property?.id}
          />

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                onClick={() => router.push(`/virtual-accounts/${id}/statements`)}
              >
                <FileText className="h-4 w-4 mr-2" />
                View Statements
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/virtual-accounts/${id}/transactions`)}
              >
                <Activity className="h-4 w-4 mr-2" />
                Transaction History
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}