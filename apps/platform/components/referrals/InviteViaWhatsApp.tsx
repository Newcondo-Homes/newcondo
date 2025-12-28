// apps/platform/components/referrals/InviteViaWhatsApp.tsx

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useInviteViaWhatsApp } from '@/hooks/useReferrals';
import { inviteViaWhatsAppSchema, type InviteViaWhatsAppInput } from '@/lib/validations/referral';
import { Loader2, Phone } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

export function InviteViaWhatsApp() {
  const inviteMutation = useInviteViaWhatsApp();

  const form = useForm<InviteViaWhatsAppInput>({
    resolver: zodResolver(inviteViaWhatsAppSchema),
    defaultValues: {
      phone: '',
      message: '',
    },
  });

  const onSubmit = async (data: InviteViaWhatsAppInput) => {
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
              <FormLabel>WhatsApp Number (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="080XXXXXXXX"
                  type="tel"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Leave blank to open WhatsApp web without a specific contact
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
                Customize your WhatsApp message
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700"
          disabled={inviteMutation.isLoading}
        >
          {inviteMutation.isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Opening...
            </>
          ) : (
            <>
              <Phone className="mr-2 h-4 w-4" />
              Open WhatsApp
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}