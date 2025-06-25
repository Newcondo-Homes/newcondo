"use client";

import { useState } from "react";
import { signIn, getSession } from "@newcondo/auth/client";
import { Button } from "@newcondo/ui/";
import { useRouter } from "next/navigation";
// import { useAuthStore } from "../../store/authStore";
import { Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaFacebookF } from "react-icons/fa";

interface SocialLoginProps {
  redirectTo?: string;
  disabled?: boolean;
}

export function SocialLogin({
  redirectTo = "/dashboard",
  disabled = false,
}: SocialLoginProps) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  // const { setUser, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const handleSocialLogin = async (provider: "google" | "facebook") => {
    try {
      const setLoading =
        provider === "google" ? setIsGoogleLoading : setIsFacebookLoading;
      setLoading(true);

      const result = await signIn(provider, {
        redirect: false,
        callbackUrl: redirectTo,
      });

      if (result?.error) {
        console.error(`${provider} login error:`, result.error);
        // Handle error - you might want to show a toast notification here
        return;
      }

      if (result?.ok) {
        // Get the updated session
        const session = await getSession();
        if (session?.user) {
          // setUser(session.user);
          router.push(redirectTo);
        }
      }
    } catch (error) {
      console.error(`${provider} login error:`, error);
    } finally {
      const setLoading =
        provider === "google" ? setIsGoogleLoading : setIsFacebookLoading;
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={() => handleSocialLogin("google")}
          disabled={disabled || isGoogleLoading || isFacebookLoading}
          className="w-full"
        >
          {isGoogleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FcGoogle className="mr-2 h-4 w-4" />
          )}
          Google
        </Button>

        <Button
          variant="outline"
          onClick={() => handleSocialLogin("facebook")}
          disabled={disabled || isGoogleLoading || isFacebookLoading}
          className="w-full"
        >
          {isFacebookLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FaFacebookF className="mr-2 h-4 w-4" />
          )}
          Facebook
        </Button>
      </div>
    </div>
  );
}
