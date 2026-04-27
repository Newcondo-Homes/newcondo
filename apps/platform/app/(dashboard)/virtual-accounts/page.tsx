'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Button } from '@newcondo/ui/components/button';
import { Badge } from '@newcondo/ui/components/badge';
import { Separator } from '@newcondo/ui/components/separator';
import { LoadingSpinner } from '@/components/shared/feedback/LoadingSpinner';
import { ErrorBoundary } from '@/components/shared/feedback/ErrorBoundary';
import { 
  CreditCard, 
  Building2, 
  Plus, 
  Eye, 
  Download,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api  from '@/lib/api/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface VirtualAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  balance: number;
  currency: string;
  isActive: boolean;
  property?: {
    id: string;
    title: string;
    address: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface AccountStats {
  totalBalance: number;
  totalAccounts: number;
  activeAccounts: number;
  monthlyInflow: number;
  monthlyOutflow: number;
}

export default function VirtualAccountsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [accounts, setAccounts] = useState<VirtualAccount[]>([]);
  const [stats, setStats] = useState<AccountStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchVirtualAccounts();
      fetchAccountStats();
    }
  }, [user]);

  const fetchVirtualAccounts = async () => {
    try {
      const response = await api.get('/virtual-accounts');
      setAccounts(response.data as any);
    } catch (error) {
      console.error('Error fetching virtual accounts:', error);
      toast.error('Failed to load virtual accounts');
    }
  };

  const fetchAccountStats = async () => {
    try {
      const response = await api.get('/virtual-accounts/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching account stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyAccountNumber = async (accountNumber: string) => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopiedAccount(accountNumber);
      toast.success('Account number copied to clipboard');
      
      setTimeout(() => {
        setCopiedAccount(null);
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy account number');
    }
  };

  const downloadStatement = async (accountId: string) => {
    try {
      const response = await api.get(`/virtual-accounts/${accountId}/statement`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `statement-${accountId}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Statement downloaded successfully');
    } catch (error) {
      console.error('Error downloading statement:', error);
      toast.error('Failed to download statement');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Virtual Accounts</h1>
            <p className="text-gray-600">Manage your property virtual accounts and track transactions</p>
          </div>
          <Button 
            onClick={() => router.push('/properties/create')}
            className="sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Property Account
          </Button>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Wallet className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Balance</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalBalance)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Accounts</p>
                    <p className="text-xl font-bold text-gray-900">{stats.totalAccounts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Active Accounts</p>
                    <p className="text-xl font-bold text-gray-900">{stats.activeAccounts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-sm text-gray-600">Monthly Inflow</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.monthlyInflow)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-600">Monthly Outflow</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.monthlyOutflow)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Virtual Accounts List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Virtual Accounts</h2>
          
          {accounts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">No Virtual Accounts</h3>
                    <p className="text-gray-600 mt-1">
                      Create your first property listing to automatically generate a virtual account
                    </p>
                  </div>
                  <Button 
                    onClick={() => router.push('/properties/create')}
                    className="mt-4"
                  >
                    Create Property Listing
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {accounts.map((account) => (
                <Card key={account.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-blue-600" />
                          {account.property?.title || 'General Account'}
                        </CardTitle>
                        {account.property?.address && (
                          <CardDescription className="mt-1">
                            {account.property.address}
                          </CardDescription>
                        )}
                      </div>
                      <Badge 
                        variant={account.isActive ? 'default' : 'secondary'}
                        className={account.isActive ? 'bg-green-100 text-green-800' : ''}
                      >
                        {account.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Account Details */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-600">Account Name</p>
                          <p className="font-medium text-gray-900">{account.accountName}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-600">Account Number</p>
                          <p className="font-mono text-lg font-bold text-gray-900">{account.accountNumber}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyAccountNumber(account.accountNumber)}
                          className="h-8 w-8 p-0"
                        >
                          {copiedAccount === account.accountNumber ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-600">Bank Code</p>
                          <p className="font-medium text-gray-900">{account.bankCode}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Balance */}
                    <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Current Balance</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {formatCurrency(account.balance)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/virtual-accounts/${account.id}`)}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadStatement(account.id)}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Statement
                      </Button>
                    </div>

                    {/* Account Info */}
                    <div className="text-xs text-gray-500 pt-2 border-t">
                      Created {format(new Date(account.createdAt), 'MMM dd, yyyy')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Information Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">About Virtual Accounts</h3>
                <p className="text-blue-700 text-sm mt-1">
                  Virtual accounts are automatically created when you list a property. They allow tenants to pay rent 
                  directly to your dedicated account, making rent collection seamless and transparent. All transactions 
                  are tracked and reconciled automatically.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}