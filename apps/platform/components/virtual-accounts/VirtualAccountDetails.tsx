// apps/platform/components/virtual-accounts/VirtualAccountDetails.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { cn } from '@/lib/utils/helpers';
import { Copy, Check, Eye, FileText, Home, AlertCircle } from 'lucide-react';

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
    status: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface VirtualAccountDetailsProps {
  virtualAccount: VirtualAccount;
  showTransactionButton?: boolean;
  showStatementButton?: boolean;
  className?: string;
}

export function VirtualAccountDetails({ 
  virtualAccount,
  showTransactionButton = true,
  showStatementButton = true,
  className 
}: VirtualAccountDetailsProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Active' : 'Inactive';
  };

  const getBankName = (bankCode: string) => {
    // This would typically come from a bank codes mapping
    const bankNames: Record<string, string> = {
      '044': 'Access Bank',
      '014': 'Afribank',
      '023': 'Citi Bank',
      '050': 'Ecobank',
      '011': 'First Bank',
      '214': 'First City Monument Bank',
      '070': 'Fidelity Bank',
      '058': 'Guaranty Trust Bank',
      '030': 'Heritage Bank',
      '301': 'Jaiz Bank',
      '082': 'Keystone Bank',
      '221': 'Stanbic IBTC Bank',
      '068': 'Standard Chartered',
      '232': 'Sterling Bank',
      '032': 'Union Bank',
      '033': 'United Bank for Africa',
      '215': 'Unity Bank',
      '035': 'Wema Bank',
      '057': 'Zenith Bank',
    };
    
    return bankNames[bankCode] || `Bank (${bankCode})`;
  };

  return (
    <div className={cn("bg-white rounded-lg border", className)}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {virtualAccount.accountName}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Virtual Account Details
            </p>
          </div>
          <span className={cn(
            "px-3 py-1 text-sm font-medium rounded-full border",
            getStatusColor(virtualAccount.isActive)
          )}>
            {getStatusText(virtualAccount.isActive)}
          </span>
        </div>
      </div>

      {/* Account Information */}
      <div className="p-6 space-y-4">
        {/* Balance */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 mb-2">Current Balance</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(virtualAccount.balance, virtualAccount.currency)}
            </p>
          </div>
        </div>

        {/* Account Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-gray-700">Account Number</span>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm text-gray-900">
                {virtualAccount.accountNumber}
              </span>
              <button
                onClick={() => handleCopyToClipboard(virtualAccount.accountNumber, 'account')}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                title="Copy account number"
              >
                {copied === 'account' ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-gray-700">Bank</span>
            <span className="text-sm text-gray-900">{getBankName(virtualAccount.bankCode)}</span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-gray-700">Bank Code</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-900">{virtualAccount.bankCode}</span>
              <button
                onClick={() => handleCopyToClipboard(virtualAccount.bankCode, 'bank')}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                title="Copy bank code"
              >
                {copied === 'bank' ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-gray-700">Account Owner</span>
            <span className="text-sm text-gray-900">{virtualAccount.user.name}</span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-gray-700">Created</span>
            <span className="text-sm text-gray-900">
              {formatDate(virtualAccount.createdAt)}
            </span>
          </div>

          {virtualAccount.flutterwaveAccountId && (
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-gray-700">Provider Account ID</span>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm text-gray-900">{virtualAccount.flutterwaveAccountId}</span>
                <button
                  onClick={() => handleCopyToClipboard(virtualAccount.flutterwaveAccountId!, 'flutterwaveId')}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  title="Copy provider ID"
                >
                  {copied === 'flutterwaveId' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Associated Property */}
        {virtualAccount.property && (
          <>
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Home className="h-5 w-5 text-gray-600" />
                Associated Property
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-gray-700">Property Title</span>
                <span className="text-sm text-gray-900">{virtualAccount.property.title}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-gray-700">Address</span>
                <span className="text-sm text-gray-900">{virtualAccount.property.address}, {virtualAccount.property.city}, {virtualAccount.property.state}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-gray-700">Status</span>
                <Badge variant={virtualAccount.property.status === 'Occupied' ? 'default' : 'secondary'}>{virtualAccount.property.status}</Badge>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      {(showTransactionButton || showStatementButton) && (
        <div className="p-6 flex items-center gap-4 border-t">
          {showTransactionButton && (
            <Link href={`/virtual-accounts/${virtualAccount.id}/transactions`} passHref>
              <Button variant="outline" className="w-full sm:w-auto">
                <Eye className="h-4 w-4 mr-2" />
                View Transactions
              </Button>
            </Link>
          )}
          {showStatementButton && (
            <Link href={`/virtual-accounts/${virtualAccount.id}/statements`} passHref>
              <Button variant="outline" className="w-full sm:w-auto">
                <FileText className="h-4 w-4 mr-2" />
                View Statements
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}