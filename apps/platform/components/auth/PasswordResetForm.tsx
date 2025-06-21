'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@newcondo/ui/';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@newcondo/ui/';
import { Input } from '@newcondo/ui/';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/ui/card';
import { Alert, AlertDescription } from '@newcondo/ui/';
import { Icons } from '@newcondo/ui/';
import { resetPasswordSchema, newPasswordSchema } from '../../lib/validations/auth';
import { useAuth } from '../../hooks/useAuth';

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
type NewPasswordFormData = z.infer<typeof newPasswordSchema>;

interface PasswordResetFormProps {
  token?: string;
  mode?: 'request' | 'reset';
}

export function PasswordResetForm({ token, mode = 'request' }: PasswordResetFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { requestPasswordReset, resetPassword } = useAuth();

  // Form for requesting password reset
  const requestForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  // Form for setting new password
  const resetForm = useForm<NewPasswordFormData>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onRequestSubmit = async (data: ResetPasswordFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await requestPasswordReset(data.email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onResetSubmit = async (data: NewPasswordFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!token) {
        throw new Error('Invalid reset token');
      }

      await resetPassword(token, data.password);
      setSuccess(true);
      
      // Redirect to login after successful reset
      setTimeout(() => {
        router.push('/login?message=Password reset successful');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success && mode === 'request') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Check Your Email</CardTitle>
          <CardDescription className="text-center">
            We've sent a password reset link to your email address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Icons.mail className="h-4 w-4" />
            <AlertDescription>
              Please check your email and click the reset link to set a new password.
              The link will expire in 15 minutes.
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => router.push('/login')}
          >
            Back to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (success && mode === 'reset') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Password Reset Successful</CardTitle>
          <CardDescription className="text-center">
            Your password has been successfully reset.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Icons.checkCircle className="h-4 w-4" />
            <AlertDescription>
              You can now log in with your new password.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          {mode === 'request' ? 'Reset Password' : 'Set New Password'}
        </CardTitle>
        <CardDescription className="text-center">
          {mode === 'request' 
            ? 'Enter your email address and we\'ll send you a reset link'
            : 'Enter your new password below'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <Icons.alertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {mode === 'request' ? (
          <Form {...requestForm}>
            <form onSubmit={requestForm.handleSubmit(onRequestSubmit)} className="space-y-4">
              <FormField
                control={requestForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email address"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.push('/login')}
                disabled={isLoading}
              >
                Back to Login
              </Button>
            </form>
          </Form>
        ) : (
          <Form {...resetForm}>
            <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
              <FormField
                control={resetForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter new password"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={resetForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm new password"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                Reset Password
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}