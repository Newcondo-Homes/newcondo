// apps/platform/components/referrals/InviteViaEmail.tsx

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@newcondo/ui/components/button';
import { Input } from '@newcondo/ui/components/input';
import { Textarea } from '@newcondo/ui/components/textarea';
import { useInviteViaEmail } from '@/hooks/useReferrals';
import { inviteViaEmailSchema, type InviteViaEmailInput } from '@/lib/validations/referral';
import { Loader2, Mail } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@newcondo/ui/components/form';

export function InviteViaEmail() {
  const inviteMutation = useInviteViaEmail();

  const form = useForm<InviteViaEmailInput>({
    resolver: zodResolver(inviteViaEmailSchema),
    defaultValues: {
      email: '',
      message: '',
    },
  });

  const onSubmit = async (data: InviteViaEmailInput) => {
    await inviteMutation.mutateAsync(data);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input
                  placeholder="friend@example.com"
                  type="email"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Enter your friend's email address
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
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Personalize your invitation message
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
              <Mail className="mr-2 h-4 w-4" />
              Send Invitation
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}