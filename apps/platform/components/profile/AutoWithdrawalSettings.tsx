'use client';

import { useState } from 'react';
import { Button } from '@newcondo/ui';
import { Input } from '@newcondo/ui';
import { Label } from '@newcondo/ui';
import { Switch } from '@newcondo/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@newcondo/ui';
import type { VirtualAccountWithProperty } from '@/types/wallet';

interface AutoWithdrawalSettingsProps {
  userId: string;
  virtualAccounts: VirtualAccountWithProperty[];
}

interface Settings {
  enabled: boolean;
  threshold: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

const NIGERIAN_BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '011', name: 'First Bank' },
  { code: '058', name: 'Guaranty Trust Bank' },
  { code: '057', name: 'Zenith Bank' },
  { code: '033', name: 'United Bank for Africa' },
  { code: '035', name: 'Wema Bank' },
  { code: '100004', name: 'Kuda Bank' },
  { code: '305', name: 'Paycom (Opay)' },
  { code: '090405', name: 'Moniepoint' },
  { code: '999992', name: 'PalmPay' },
];

export function AutoWithdrawalSettings({
  userId,
  virtualAccounts,
}: AutoWithdrawalSettingsProps) {
  const [settings, setSettings] = useState<Settings>({
    enabled: false,
    threshold: '10000',
    frequency: 'WEEKLY',
    bankCode: '',
    accountNumber: '',
    accountName: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeAccounts = virtualAccounts.filter((a) => a.isActive);

  const handleSave = async () => {
    setError(null);
    if (settings.enabled && (!settings.bankCode || !settings.accountNumber)) {
      setError('Please provide bank details to enable auto-withdrawal.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/wallet/auto-withdrawal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...settings }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to save settings.');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSaving(false);
    }
  };

  if (activeAccounts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No active virtual accounts. Auto-withdrawal requires at least one active account.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enable toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Enable Auto-Withdrawal</p>
          <p className="text-xs text-muted-foreground">
            Automatically transfer funds to your bank account
          </p>
        </div>
        <Switch
          checked={settings.enabled}
          onCheckedChange={(val) =>
            setSettings((prev) => ({ ...prev, enabled: val }))
          }
        />
      </div>

      {settings.enabled && (
        <>
          {/* Threshold */}
          <div className="space-y-1.5">
            <Label htmlFor="threshold">Minimum Balance Threshold (₦)</Label>
            <Input
              id="threshold"
              type="number"
              min="1000"
              step="1000"
              value={settings.threshold}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, threshold: e.target.value }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Auto-withdraw when balance exceeds this amount
            </p>
          </div>

          {/* Frequency */}
          <div className="space-y-1.5">
            <Label htmlFor="frequency">Frequency</Label>
            <Select
              value={settings.frequency}
              onValueChange={(val) =>
                setSettings((prev) => ({
                  ...prev,
                  frequency: val as Settings['frequency'],
                }))
              }
            >
              <SelectTrigger id="frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAILY">Daily</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bank */}
          <div className="space-y-1.5">
            <Label htmlFor="auto-bank">Destination Bank</Label>
            <Select
              value={settings.bankCode}
              onValueChange={(val) =>
                setSettings((prev) => ({ ...prev, bankCode: val }))
              }
            >
              <SelectTrigger id="auto-bank">
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
            <Label htmlFor="auto-account-number">Account Number</Label>
            <Input
              id="auto-account-number"
              type="text"
              maxLength={10}
              placeholder="0123456789"
              value={settings.accountNumber}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, accountNumber: e.target.value }))
              }
            />
          </div>

          {/* Account name */}
          <div className="space-y-1.5">
            <Label htmlFor="auto-account-name">Account Name</Label>
            <Input
              id="auto-account-name"
              type="text"
              placeholder="John Doe"
              value={settings.accountName}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, accountName: e.target.value }))
              }
            />
          </div>
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && (
        <p className="text-sm text-green-600">Settings saved successfully.</p>
      )}

      <Button onClick={handleSave} disabled={isSaving} className="w-full">
        {isSaving ? 'Saving…' : 'Save Settings'}
      </Button>
    </div>
  );
}