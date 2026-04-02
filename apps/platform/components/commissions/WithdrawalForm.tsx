// apps/platform/components/commissions/WithdrawalForm.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Button } from '@newcondo/ui/components/button';
import { Input } from '@newcondo/ui/components/input';
import { Label } from '@newcondo/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@newcondo/ui/components/select';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';
import { toast } from '@newcondo/ui'
import {
  Wallet,
  AlertCircle,
  Info,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

interface BankAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
}

interface WithdrawalFormProps {
  availableBalance: number;
  bankAccounts: BankAccount[];
  minWithdrawal?: number;
  maxWithdrawal?: number;
  currency?: string;
  onSubmit: (data: {
    amount: number;
    bankAccountId: string;
  }) => Promise<void>;
  onAddBankAccount?: () => void;
}

export function WithdrawalForm({
  availableBalance,
  bankAccounts,
  minWithdrawal = 1000,
  maxWithdrawal = 1000000,
  currency = 'NGN',
  onSubmit,
  onAddBankAccount,
}: WithdrawalFormProps) {
  const [amount, setAmount] = useState('');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(value);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const numAmount = parseFloat(amount);

    if (!amount || isNaN(numAmount)) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (numAmount < minWithdrawal) {
      newErrors.amount = `Minimum withdrawal is ${formatCurrency(minWithdrawal)}`;
    } else if (numAmount > maxWithdrawal) {
      newErrors.amount = `Maximum withdrawal is ${formatCurrency(maxWithdrawal)}`;
    } else if (numAmount > availableBalance) {
      newErrors.amount = 'Insufficient balance';
    }

    if (!selectedBankId) {
      newErrors.bank = 'Please select a bank account';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        amount: parseFloat(amount),
        bankAccountId: selectedBankId,
      });

      toast.success('Withdrawal initiated', {
        description: 'Your withdrawal request has been submitted successfully',
      });

      // Reset form
      setAmount('');
      setSelectedBankId('');
    } catch (error) {
      console.error('Withdrawal error:', error);

      toast.error('Withdrawal failed', {
        description: 'Failed to process withdrawal request',
      });

    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAmount = (percentage: number) => {
    const quickAmount = (availableBalance * percentage) / 100;
    setAmount(quickAmount.toString());
  };

  const selectedBank = bankAccounts.find((b) => b.id === selectedBankId);
  const withdrawalAmount = parseFloat(amount) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Withdraw Earnings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Available Balance */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Available balance: <strong>{formatCurrency(availableBalance)}</strong>
            </AlertDescription>
          </Alert>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Withdrawal Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={minWithdrawal}
              max={Math.min(availableBalance, maxWithdrawal)}
              step="100"
            />
            {errors.amount && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.amount}
              </p>
            )}

            {/* Quick Amount Buttons */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickAmount(25)}
              >
                25%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickAmount(50)}
              >
                50%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickAmount(75)}
              >
                75%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickAmount(100)}
              >
                All
              </Button>
            </div>
          </div>

          {/* Bank Account Selection */}
          <div className="space-y-2">
            <Label htmlFor="bank">Select Bank Account</Label>
            {bankAccounts.length > 0 ? (
              <Select value={selectedBankId} onValueChange={setSelectedBankId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bank account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.bankName} - {account.accountNumber} (
                      {account.accountName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No bank account found.{' '}
                  {onAddBankAccount && (
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0"
                      onClick={onAddBankAccount}
                    >
                      Add bank account
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}
            {errors.bank && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.bank}
              </p>
            )}
          </div>

          {/* Summary */}
          {withdrawalAmount > 0 && selectedBank && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="space-y-1">
                  <p className="font-semibold">Withdrawal Summary</p>
                  <p className="text-sm">
                    Amount: {formatCurrency(withdrawalAmount)}
                  </p>
                  <p className="text-sm">
                    To: {selectedBank.bankName} - {selectedBank.accountNumber}
                  </p>
                  <p className="text-sm">
                    Account: {selectedBank.accountName}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={
              isSubmitting ||
              !amount ||
              !selectedBankId ||
              availableBalance === 0
            }
          >
            {isSubmitting ? (
              'Processing...'
            ) : (
              <>
                Withdraw {withdrawalAmount > 0 && formatCurrency(withdrawalAmount)}
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>

          {/* Info */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Withdrawals are processed within 24-48 hours. You will receive a
              confirmation email once the transfer is complete.
            </AlertDescription>
          </Alert>
        </form>
      </CardContent>
    </Card>
  );
}