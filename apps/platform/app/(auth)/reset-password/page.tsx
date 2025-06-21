"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@newcondo/ui";
import { Button } from "@newcondo/ui";
import { Input } from "@newcondo/ui";
import { Label } from "@newcondo/ui";
import { Alert, AlertDescription } from "@newcondo/ui";
import { Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export const metadata = {
  title: "Reset Password - NewCondo",
  description: "Reset your NewCondo account password",
};

export default function ResetPasswordPage() {
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { requestPasswordReset, resetPassword } = useAuth();

  // Check if token is in URL (direct reset link)
  useEffect(() => {
    const token = searchParams.get("token");
    const emailParam = searchParams.get("email");

    if (token && emailParam) {
      setStep("reset");
      setEmail(emailParam);
    }
  }, [searchParams]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      await requestPasswordReset(email);
      setSuccess("Password reset instructions have been sent to your email.");
      setStep("reset");
      setTimeLeft(60); // 1 minute cooldown
    } catch (err: any) {
      setError(err.message || "Failed to send password reset email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!otp || otp.length < 6) {
      setError("Please enter the 6-digit code from your email");
      return;
    }

    setIsLoading(true);

    try {
      const token = searchParams.get("token");
      await resetPassword({
        email,
        otp,
        password,
        token: token || undefined,
      });

      setSuccess("Password reset successfully! Redirecting to login...");

      setTimeout(() => {
        router.push("/login?message=Password reset successfully");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (timeLeft > 0) return;

    setError("");
    setIsLoading(true);

    try {
      await requestPasswordReset(email);
      setSuccess("New reset code sent to your email");
      setTimeLeft(60);
    } catch (err: any) {
      setError(err.message || "Failed to resend code");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "request") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">
                Reset Password
              </CardTitle>
              <CardDescription>
                Enter your email address and we'll send you instructions to
                reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRequestReset} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      {success}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !email}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Instructions...
                    </>
                  ) : (
                    "Send Reset Instructions"
                  )}
                </Button>

                <div className="text-center">
                  <Link
                    href="/login"
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    Back to Login
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              Set New Password
            </CardTitle>
            <CardDescription>
              Enter the code sent to {email} and your new password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="otp">Reset Code</Label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  required
                  disabled={isLoading}
                />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Code sent to your email</span>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={timeLeft > 0 || isLoading}
                    className="text-blue-600 hover:text-blue-500 disabled:text-gray-400"
                  >
                    {timeLeft > 0 ? `Resend in ${timeLeft}s` : "Resend Code"}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    minLength={8}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Password must be at least 8 characters long
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    minLength={8}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !otp || !password || !confirmPassword}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Back to Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
