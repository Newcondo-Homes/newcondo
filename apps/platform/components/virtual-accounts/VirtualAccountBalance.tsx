// apps/platform/components/virtual-accounts/VirtualAccountBalance.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Badge } from '@newcondo/ui/components/badge';
import { Button } from '@/components/ui/button';
import { 
  Eye, 
  EyeOff, 
  CreditCard, 
  TrendingUp, 
  Wallet,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils/format';

interface VirtualAccountData {
  id: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  balance: string;
  currency: string;
  isActive: boolean;
  property?: {
    id: string;
    title: string;
    address: string;
  };
  totalReceived: string;
  totalWithdrawn: string;
  lastTransactionDate: string | null;
}

interface VirtualAccountBalanceProps {
  propertyId?: string;
  showPropertyDetails?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

export default function VirtualAccountBalance({ 
  propertyId, 
  showPropertyDetails = false,
  variant = 'default'
}: VirtualAccountBalanceProps) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<VirtualAccountData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBalance, setShowBalance] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchVirtualAccounts();
  }, [propertyId, user?.id]);

  const fetchVirtualAccounts = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams({
        userId: user.id,
        ...(propertyId && { propertyId })
      });

      const response = await fetch(`/api/virtual-accounts?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch virtual accounts');
      }
      
      const data = await response.json();
      setAccounts(data.accounts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load virtual accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVirtualAccounts();
    setRefreshing(false);
  };

  const toggleBalanceVisibility = () => {
    setShowBalance(!showBalance);
  };

  const formatBalance = (balance: string, currency: string) => {
    if (!showBalance) return '••••••';
    return formatCurrency(parseFloat(balance), currency);
  };

  const getTotalBalance = () => {
    return accounts.reduce((total, account) => total + parseFloat(account.balance), 0);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                <div className="flex space-x-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Error loading virtual accounts</p>
              <p className="text-sm text-red-500">{error}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchVirtualAccounts}
            className="mt-3"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No virtual accounts found</p>
            <p className="text-sm text-gray-500">
              Virtual accounts will be created automatically when you list a property
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Balance</p>
              <p className="text-2xl font-bold text-green-600">
                {formatBalance(getTotalBalance().toString(), 'NGN')}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleBalanceVisibility}
              >
                {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-blue-900">Virtual Account Summary</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleBalanceVisibility}
                className="text-blue-700 hover:bg-blue-100"
              >
                {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="text-blue-700 hover:bg-blue-100"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-blue-700">Total Balance</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatBalance(getTotalBalance().toString(), 'NGN')}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Active Accounts</p>
              <p className="text-2xl font-bold text-blue-900">
                {accounts.filter(acc => acc.isActive).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Total Accounts</p>
              <p className="text-2xl font-bold text-blue-900">{accounts.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Account Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {accounts.map((account) => (
          <Card key={account.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-medium">
                    {account.accountName}
                  </CardTitle>
                  {showPropertyDetails && account.property && (
                    <p className="text-sm text-gray-600 mt-1">
                      {account.property.title}
                    </p>
                  )}
                </div>
                <Badge variant={account.isActive ? 'default' : 'secondary'}>
                  {account.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {/* Balance */}
                <div>
                  <p className="text-sm text-gray-600">Current Balance</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatBalance(account.balance, account.currency)}
                  </p>
                </div>

                {/* Account Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Account Number</p>
                    <p className="font-mono font-medium">{account.accountNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Bank Code</p>
                    <p className="font-medium">{account.bankCode}</p>
                  </div>
                </div>

                {/* Transaction Summary */}
                {variant === 'detailed' && (
                  <div className="pt-3 border-t">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-gray-600">Total Received</p>
                          <p className="font-medium text-green-600">
                            {formatBalance(account.totalReceived, account.currency)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-gray-600">Total Withdrawn</p>
                          <p className="font-medium text-blue-600">
                            {formatBalance(account.totalWithdrawn, account.currency)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {account.lastTransactionDate && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-500">
                          Last transaction: {new Date(account.lastTransactionDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}