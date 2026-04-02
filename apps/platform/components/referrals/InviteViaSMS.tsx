// apps/platform/components/referrals/InviteViaSMS.tsx

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@newcondo/ui/components/input';
import { Textarea } from '@newcondo/ui/components/textarea';
import { useInviteViaSMS } from '@/hooks/useReferrals';
import { inviteViaSMSSchema, type InviteViaSMSInput } from '@/lib/validations/referral';
import { Loader2, MessageSquare } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@newcondo/ui/components/form';

export function InviteViaSMS() {
  const inviteMutation = useInviteViaSMS();

  const form = useForm<InviteViaSMSInput>({
    resolver: zodResolver(inviteViaSMSSchema),
    defaultValues: {
      phone: '',
      message: '',
    },
  });

  const onSubmit = async (data: InviteViaSMSInput) => {
    await inviteMutation.mutateAsync(data);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input
                  placeholder="080XXXXXXXX"
                  type="tel"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Enter Nigerian phone number (e.g., 08012345678)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custom Message (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add a personal message..."
                  rows={3}
                  maxLength={160}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Max 160 characters for SMS
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={inviteMutation.isLoading}
        >
          {inviteMutation.isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <MessageSquare className="mr-2 h-4 w-4" />
              Send SMS
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}