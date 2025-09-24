// apps/platform/components/virtual-accounts/VirtualAccountCard.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/helpers';

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
  user: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface VirtualAccountCardProps {
  virtualAccount: VirtualAccount;
  showActions?: boolean;
  className?: string;
}

export function VirtualAccountCard({ 
  virtualAccount, 
  showActions = true,
  className 
}: VirtualAccountCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(virtualAccount.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy account number:', error);
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Active' : 'Inactive';
  };

  return (
    <div className={cn(
      "bg-white rounded-lg border hover:shadow-md transition-shadow duration-200",
      className
    )}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {virtualAccount.accountName}
              </h3>
              <span className={cn(
                "px-2 py-1 text-xs font-medium rounded-full",
                getStatusColor(virtualAccount.isActive)
              )}>
                {getStatusText(virtualAccount.isActive)}
              </span>
            </div>
            {virtualAccount.property && (
              <p className="text-sm text-gray-600 mt-1 truncate">
                {virtualAccount.property.title}
              </p>
            )}
          </div>

          {showActions && (
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                  <div className="py-1">
                    <Link
                      href={`/virtual-accounts/${virtualAccount.id}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      View Details
                    </Link>
                    <Link
                      href={`/virtual-accounts/${virtualAccount.id}/transactions`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      View Transactions
                    </Link>
                    <Link
                      href={`/virtual-accounts/${virtualAccount.id}/statements`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Generate Statement
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Account Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Account Number</span>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm text-gray-900">
                {virtualAccount.accountNumber}
              </span>
              <button
                onClick={handleCopyAccountNumber}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                title="Copy account number"
              >
                {copied ? (
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Bank Code</span>
            <span className="text-sm text-gray-900">{virtualAccount.bankCode}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Current Balance</span>
            <span className="text-lg font-semibold text-gray-900">
              {formatCurrency(virtualAccount.balance, virtualAccount.currency)}
            </span>
          </div>
        </div>

        {/* Property Link */}
        {virtualAccount.property && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Link
              href={`/properties/${virtualAccount.property.id}`}
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              View Property
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        {showActions && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex space-x-3">
              <Link
                href={`/virtual-accounts/${virtualAccount.id}/transactions`}
                className="flex-1 text-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Transactions
              </Link>
              <Link
                href={`/virtual-accounts/${virtualAccount.id}/statements`}
                className="flex-1 text-center px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Statement
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Click overlay for mobile */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-5"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  );
}