// apps/platform/components/referrals/RewardRedemptionModal.tsx

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useReferralStore } from '@/store/referralStore';
import { useRedeemReward, useCheckRedemptionEligibility } from '@/hooks/useRewards';
import { rewardRedemptionSchema, type RewardRedemptionInput } from '@/lib/validations/reward';
import { formatRewardAmount, getRewardTypeDisplay } from '@/lib/utils/rewardFormatters';
import { REWARD_REDEMPTION_OPTIONS } from '@/lib/constants/rewardTypes';
import { Loader2, AlertCircle, CheckCircle, Wallet, CreditCard, Gift } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

export function RewardRedemptionModal() {
  const { isRedemptionModalOpen, toggleRedemptionModal, selectedReward } = useReferralStore();
  const redeemMutation = useRedeemReward();
  const [selectedMethod, setSelectedMethod] = useState<'bank_transfer' | 'wallet_credit' | 'service_credit'>('wallet_credit');

  const { eligible, reason, minAmount } = useCheckRedemptionEligibility(selectedReward?.id || '');

  const form = useForm<RewardRedemptionInput>({
    resolver: zodResolver(rewardRedemptionSchema),
    defaultValues: {
      rewardId: selectedReward?.id || '',
      method: 'wallet_credit',
      bankDetails: undefined,
    },
  });

  const onSubmit = async (data: RewardRedemptionInput) => {
    await redeemMutation.mutateAsync(data);
    form.reset();
    toggleRedemptionModal();
  };

  if (!selectedReward) {
    return null;
  }

  const typeInfo = getRewardTypeDisplay(selectedReward.rewardType);
  const canRedeem = selectedReward.status === 'APPROVED' && !selectedReward.isRedeemed;

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return <CreditCard className="h-5 w-5" />;
      case 'wallet_credit':
        return <Wallet className="h-5 w-5" />;
      case 'service_credit':
        return <Gift className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isRedemptionModalOpen} onOpenChange={toggleRedemptionModal}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Redeem Reward</DialogTitle>
          <DialogDescription>
            Choose how you'd like to receive your reward
          </DialogDescription>
        </DialogHeader>

        {/* Reward Summary */}
        <div className="bg-muted rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{typeInfo.icon}</span>
              <span className="font-medium">{typeInfo.name}</span>
            </div>
            <span className="text-2xl font-bold text-green-600">
              {formatRewardAmount(selectedReward.amount)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {selectedReward.description}
          </p>
        </div>

        {/* Eligibility Check */}
        {!canRedeem && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This reward cannot be redeemed. {selectedReward.isRedeemed ? 'Already redeemed.' : 'Status: ' + selectedReward.status}
            </AlertDescription>
          </Alert>
        )}

        {eligible === false && reason && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{reason}</AlertDescription>
          </Alert>
        )}

        {canRedeem && eligible && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Redemption Method */}
              <div className="space-y-3">
                <Label>Redemption Method</Label>
                <RadioGroup
                  value={selectedMethod}
                  onValueChange={(v: any) => {
                    setSelectedMethod(v);
                    form.setValue('method', v);
                  }}
                  className="space-y-3"
                >
                  {REWARD_REDEMPTION_OPTIONS.filter(opt => opt.isAvailable).map((option) => (
                    <div
                      key={option.id}
                      className={`flex items-start space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedMethod === option.type ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => {
                        setSelectedMethod(option.type);
                        form.setValue('method', option.type);
                      }}
                    >
                      <RadioGroupItem value={option.type} id={option.id} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getMethodIcon(option.type)}
                          <Label htmlFor={option.id} className="font-medium cursor-pointer">
                            {option.name}
                          </Label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {option.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Processing: {option.processingTime}
                        </p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Bank Details (only for bank_transfer) */}
              {selectedMethod === 'bank_transfer' && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <h4 className="font-medium">Bank Account Details</h4>
                  
                  <FormField
                    control={form.control}
                    name="bankDetails.accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0123456789"
                            maxLength={10}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>10-digit account number</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bankDetails.accountName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bankDetails.bankCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Code</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="058"
                            maxLength={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          3-digit bank code (e.g., GTBank: 058, Access: 044)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Info Alert */}
              {selectedMethod === 'service_credit' && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    This credit will be instantly applied to your NewCondo account and can be used for services.
                  </AlertDescription>
                </Alert>
              )}

              {selectedMethod === 'wallet_credit' && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    This amount will be instantly added to your wallet balance.
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={toggleRedemptionModal}
                  className="flex-1"
                  disabled={redeemMutation.isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={redeemMutation.isLoading}
                >
                  {redeemMutation.isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Confirm Redemption'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}