'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@newcondo/ui/card';
import { Button } from '@newcondo/ui/button';
import { Switch } from '@newcondo/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@newcondo/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@newcondo/ui/select';
import { Input } from '@newcondo/ui/input';
import { useToast } from '@newcondo/ui/use-toast';
import { Loader2, Save, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@newcondo/ui/alert';

const autoTransferSchema = z.object({
  enabled: z.boolean(),
  frequency: z.enum(['IMMEDIATE', 'DAILY', 'WEEKLY', 'MONTHLY']),
  minimumBalance: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount'),
  bankAccountNumber: z.string().min(10, 'Invalid account number').max(10),
  bankCode: z.string().min(1, 'Bank is required'),
  accountName: z.string().min(1, 'Account name is required'),
});

type AutoTransferFormData = z.infer<typeof autoTransferSchema>;

interface AutoTransferSettingsProps {
  currentSettings?: Partial<AutoTransferFormData>;
  onSave: (data: AutoTransferFormData) => Promise<void>;
}

const NIGERIAN_BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '063', name: 'Diamond Bank' },
  { code: '050', name: 'Ecobank Nigeria' },
  { code: '214', name: 'First City Monument Bank' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '058', name: 'Guaranty Trust Bank' },
  { code: '030', name: 'Heritage Bank' },
  { code: '301', name: 'Jaiz Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '526', name: 'Parallex Bank' },
  { code: '076', name: 'Polaris Bank' },
  { code: '101', name: 'Providus Bank' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '068', name: 'Standard Chartered Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '100', name: 'Suntrust Bank' },
  { code: '032', name: 'Union Bank of Nigeria' },
  { code: '033', name: 'United Bank For Africa' },
  { code: '215', name: 'Unity Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '057', name: 'Zenith Bank' },
];

export function AutoTransferSettings({
  currentSettings,
  onSave,
}: AutoTransferSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<AutoTransferFormData>({
    resolver: zodResolver(autoTransferSchema),
    defaultValues: {
      enabled: currentSettings?.enabled ?? false,
      frequency: currentSettings?.frequency ?? 'IMMEDIATE',
      minimumBalance: currentSettings?.minimumBalance ?? '0',
      bankAccountNumber: currentSettings?.bankAccountNumber ?? '',
      bankCode: currentSettings?.bankCode ?? '',
      accountName: currentSettings?.accountName ?? '',
    },
  });

  const isEnabled = form.watch('enabled');

  const handleSubmit = async (data: AutoTransferFormData) => {
    setIsLoading(true);
    try {
      await onSave(data);
      toast({
        title: 'Settings saved',
        description: 'Your auto-transfer settings have been updated successfully.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to save settings. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auto Transfer Settings</CardTitle>
        <CardDescription>
          Configure automatic transfers from your virtual account to your bank
          account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Enable Auto Transfer */}
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Enable Auto Transfer
                    </FormLabel>
                    <FormDescription>
                      Automatically transfer funds to your bank account
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {isEnabled && (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Transfers will only occur after the 24-hour confirmation
                    period for each payment has passed.
                  </AlertDescription>
                </Alert>

                {/* Transfer Frequency */}
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transfer Frequency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="IMMEDIATE">
                            Immediate (after confirmation period)
                          </SelectItem>
                          <SelectItem value="DAILY">Daily</SelectItem>
                          <SelectItem value="WEEKLY">Weekly</SelectItem>
                          <SelectItem value="MONTHLY">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How often should funds be transferred
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Minimum Balance */}
                <FormField
                  control={form.control}
                  name="minimumBalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Balance (NGN)</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Only transfer if balance exceeds this amount
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4 rounded-lg border p-4">
                  <h3 className="font-medium">Bank Account Details</h3>

                  {/* Bank Selection */}
                  <FormField
                    control={form.control}
                    name="bankCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your bank" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {NIGERIAN_BANKS.map((bank) => (
                              <SelectItem key={bank.code} value={bank.code}>
                                {bank.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Account Number */}
                  <FormField
                    control={form.control}
                    name="bankAccountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="0123456789"
                            maxLength={10}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Account Name */}
                  <FormField
                    control={form.control}
                    name="accountName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Name</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="John Doe"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Verify this matches your bank account name
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}