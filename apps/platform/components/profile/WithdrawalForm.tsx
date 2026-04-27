'use client';

import { useState } from 'react';
import { Button } from '@newcondo/ui';
import { Input } from '@newcondo/ui';
import { Label } from '@newcondo/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@newcondo/ui';
import type { VirtualAccountWithProperty } from '@/types/wallet';

interface WithdrawalFormProps {
  virtualAccounts: VirtualAccountWithProperty[];
  totalBalance: number;
}

interface BankDetails {
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

const NIGERIAN_BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '023', name: 'Citibank' },
  { code: '050', name: 'EcoBank' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '011', name: 'First Bank' },
  { code: '214', name: 'First City Monument Bank' },
  { code: '058', name: 'Guaranty Trust Bank' },
  { code: '030', name: 'Heritage Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '057', name: 'Zenith Bank' },
  { code: '033', name: 'United Bank for Africa' },
  { code: '032', name: 'Union Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '035A', name: 'ALAT by Wema' },
  { code: '305', name: 'Paycom (Opay)' },
  { code: '090405', name: 'Moniepoint' },
  { code: '999992', name: 'PalmPay' },
  { code: '100004', name: 'Kuda Bank' },
];

function formatCurrency(amount: number, currency = 'NGN') {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function WithdrawalForm({ virtualAccounts, totalBalance }: WithdrawalFormProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    bankCode: '',
    accountNumber: '',
    accountName: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const activeAccounts = virtualAccounts.filter((a) => a.isActive);
  const selectedAccount = activeAccounts.find((a) => a.id === selectedAccountId);
  const maxAmount = selectedAccount ? Number(selectedAccount.balance) : totalBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (numericAmount > maxAmount) {
      setError('Amount exceeds available balance.');
      return;
    }
    if (!bankDetails.bankCode || !bankDetails.accountNumber) {
      setError('Please provide your bank details.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          virtualAccountId: selectedAccountId || activeAccounts[0]?.id,
          amount: numericAmount,
          bankCode: bankDetails.bankCode,
          accountNumber: bankDetails.accountNumber,
          accountName: bankDetails.accountName,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Withdrawal failed.');
      }

      setSuccess(true);
      setAmount('');
      setBankDetails({ bankCode: '', accountNumber: '', accountName: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (activeAccounts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No active virtual accounts found. Please contact support.
      </p>
    );
  }

  if (success) {
    return (
      <div className="text-center py-6 space-y-2">
        <p className="text-green-600 font-medium">Withdrawal request submitted!</p>
        <p className="text-sm text-muted-foreground">
          Your funds will be transferred within 1–2 business days.
        </p>
        <Button variant="outline" onClick={() => setSuccess(false)} className="mt-2">
          Make another withdrawal
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Source account */}
      {activeAccounts.length > 1 && (
        <div className="space-y-1.5">
          <Label htmlFor="account">Source Account</Label>
          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger id="account">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {activeAccounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.accountName} — {formatCurrency(Number(acc.balance), acc.currency)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Amount */}
      <div className="space-y-1.5">
        <Label htmlFor="amount">
          Amount{' '}
          <span className="text-muted-foreground font-normal">
            (max {formatCurrency(maxAmount)})
          </span>
        </Label>
        <Input
          id="amount"
          type="number"
          min="100"
          max={maxAmount}
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      {/* Bank */}
      <div className="space-y-1.5">
        <Label htmlFor="bank">Bank</Label>
        <Select
          value={bankDetails.bankCode}
          onValueChange={(val) => setBankDetails((prev) => ({ ...prev, bankCode: val }))}
        >
          <SelectTrigger id="bank">
            <SelectValue placeholder="Select bank" />
          </SelectTrigger>
          <SelectContent>
            {NIGERIAN_BANKS.map((bank) => (
              <SelectItem key={bank.code} value={bank.code}>
                {bank.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Account number */}
      <div className="space-y-1.5">
        <Label htmlFor="accountNumber">Account Number</Label>
        <Input
          id="accountNumber"
          type="text"
          maxLength={10}
          placeholder="0123456789"
          value={bankDetails.accountNumber}
          onChange={(e) =>
            setBankDetails((prev) => ({ ...prev, accountNumber: e.target.value }))
          }
          required
        />
      </div>

      {/* Account name */}
      <div className="space-y-1.5">
        <Label htmlFor="accountName">Account Name</Label>
        <Input
          id="accountName"
          type="text"
          placeholder="John Doe"
          value={bankDetails.accountName}
          onChange={(e) =>
            setBankDetails((prev) => ({ ...prev, accountName: e.target.value }))
          }
          required
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Processing…' : 'Withdraw Funds'}
      </Button>
    </form>
  );
}