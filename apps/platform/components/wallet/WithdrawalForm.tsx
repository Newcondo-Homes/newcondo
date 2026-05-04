'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@newcondo/ui/components/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@newcondo/ui/components/form';
import { Input } from '@newcondo/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@newcondo/ui/components/select';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';
import { formatCurrency } from '@/lib/utils/format';
import { withdrawalsApi } from '@/lib/api/withdrawals';
import { toast } from 'sonner';

interface BankAccount {
  id?: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  bankCode: string;
  isDefault?: boolean;
}

const withdrawalSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  bankAccountId: z.string().min(1, 'Please select a bank account'),
  narration: z.string().optional(),
});

type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

interface WithdrawalFormProps {
  availableBalance: number;
  currency: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function WithdrawalForm({
  availableBalance,
  currency,
  onSuccess,
  onCancel,
}: WithdrawalFormProps) {
  const queryClient = useQueryClient();
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);

  const form = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: '',
      bankAccountId: '',
      narration: '',
    },
  });

  // Fetch user's saved bank accounts
  const { data: bankAccounts, isLoading: loadingAccounts } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: () => withdrawalsApi.getBankAccounts(),
  });

  const withdrawalMutation = useMutation({
    mutationFn: (data: WithdrawalFormData) => withdrawalsApi.createWithdrawal({
      accountNumber: selectedAccount?.accountNumber as string,
      bankCode: selectedAccount?.bankCode as string,
      amount: parseFloat(data.amount),
      narration: data.narration,
    }),

    onSuccess: () => {
      toast.success('Withdrawal initiated successfully');
      queryClient.invalidateQueries({ queryKey: ['virtual-account-balance'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-history'] });
      form.reset();
      onSuccess?.();
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to process withdrawal');
    },
  });

  const handleSubmit = (data: WithdrawalFormData) => {
    const amount = parseFloat(data.amount);

    if (amount <= 0) {
      form.setError('amount', { message: 'Amount must be greater than zero' });
      return;
    }

    if (amount > availableBalance) {
      form.setError('amount', { message: 'Insufficient balance' });
      return;
    }

    // Minimum withdrawal amount (e.g., ₦100)
    if (amount < 100) {
      form.setError('amount', { message: 'Minimum withdrawal amount is ₦100' });
      return;
    }

    withdrawalMutation.mutate(data);
  };

  const watchedAmount = form.watch('amount');
  const amount = parseFloat(watchedAmount) || 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">Available Balance</p>
          <p className="text-2xl font-bold mt-1">
            {formatCurrency(availableBalance, currency)}
          </p>
        </div>

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Withdrawal Amount</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    ₦
                  </span>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="pl-8"
                  />
                </div>
              </FormControl>
              <FormDescription>
                Minimum withdrawal: ₦100.00
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bankAccountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bank Account</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  const account = bankAccounts?.find((acc: BankAccount) => acc.id === value);
                  setSelectedAccount(account as BankAccount);
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank account" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {loadingAccounts ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Loading accounts...
                    </div>
                  ) : bankAccounts && bankAccounts.length > 0 ? (
                    bankAccounts.map((account: BankAccount) => (
                      <SelectItem key={account.id} value={account.id as string}>
                        {account.bankName} - {account.accountNumber}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No bank accounts found. Add one in settings.
                    </div>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedAccount && (
          <div className="p-3 bg-muted/50 rounded-lg space-y-1">
            <p className="text-sm font-medium">{selectedAccount.accountName}</p>
            <p className="text-xs text-muted-foreground">
              {selectedAccount.bankName} - {selectedAccount.accountNumber}
            </p>
          </div>
        )}

        <FormField
          control={form.control}
          name="narration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Narration (Optional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., Rent withdrawal" />
              </FormControl>
              <FormDescription>
                Add a note for this withdrawal
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {amount > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium">Transaction Summary</p>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Withdrawal Amount:</span>
                  <span>{formatCurrency(amount, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Processing Fee:</span>
                  <span>{formatCurrency(0, currency)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                  <span>Total:</span>
                  <span>{formatCurrency(amount, currency)}</span>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3 pt-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={withdrawalMutation.isPending}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            className="flex-1"
            disabled={withdrawalMutation.isPending || !bankAccounts || bankAccounts.length === 0}
          >
            {withdrawalMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Withdraw Funds
          </Button>
        </div>

        {bankAccounts && bankAccounts.length === 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need to add a bank account before making withdrawals. Go to Settings to add one.
            </AlertDescription>
          </Alert>
        )}
      </form>
    </Form>
  );
}