"use client";

/* ============================================================
   GoogleOneTap

   Renders nothing — it loads Google Identity Services and shows the
   automatic One Tap prompt while the user is on the email step of
   onboarding. When the user accepts, Google returns an ID-token
   credential which we hand to NextAuth.

   >>> REQUIREMENT: "only for users who have already registered with
       their Gmail." <<<
   One Tap itself can't read our database, so this is enforced on the
   BACKEND: the `googleOneTap` provider below must verify the Google
   ID token and ONLY establish a session for an email that already
   exists as a user. For an unrecognised email it should do nothing,
   so a brand-new visitor just continues filling in the form. (New
   social sign-UPS go through the explicit Google button instead.)

   On success the SessionProvider updates → OnboardingFlow's session
   effect fires → the flow jumps straight to the plan step.

   Setup:
     • NEXT_PUBLIC_GOOGLE_CLIENT_ID must be set.
     • A NextAuth provider with id "googleOneTap" that accepts a
       `credential` (the ID token) and authenticates existing users only.
   ============================================================ */

import { useEffect, useRef } from "react";
import { signIn } from "@newcondo/auth/client";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: Record<string, unknown>) => void;
          prompt: (cb?: (notification: unknown) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

const GIS_SRC = "https://accounts.google.com/gsi/client";

export default function GoogleOneTap({
  role,
  enabled = true,
  onStarted,
}: {
  /** Role slug ("owner" | "renter" | "agent") to carry into the sign-in. */
  role?: string;
  /** Turn the prompt off (e.g. once the flow has moved past the email step). */
  enabled?: boolean;
  /** Fired the moment a credential comes back, before the network round-trip. */
  onStarted?: () => void;
}) {
  const inited = useRef(false);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!enabled || !clientId || inited.current) return;
    inited.current = true;

    const init = () => {
      const id = window.google?.accounts?.id;
      if (!id) return;

      id.initialize({
        client_id: clientId,
        context: "signin",
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true,
        callback: async (resp: { credential?: string }) => {
          if (!resp?.credential) return;
          onStarted?.();
          try {
            // Backend (`googleOneTap` provider) authenticates ONLY existing users.
            await signIn("googleOneTap", {
              credential: resp.credential,
              role,
              redirect: false,
            });
            // No manual navigation here — OnboardingFlow reacts to the new session.
          } catch (err) {
            console.error("Google One Tap sign-in failed", err);
          }
        },
      });

      id.prompt((notification: any) => {
        if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
          console.warn(
            "[GoogleOneTap] not shown:",
            notification.getNotDisplayedReason?.() ?? notification.getSkippedReason?.()
          );
        }
      });
    };

    if (window.google?.accounts?.id) {
      init();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", init);
      return () => existing.removeEventListener("load", init);
    }

    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = init;
    document.head.appendChild(script);
  }, [enabled, role, onStarted]);

  // Close the prompt when this step unmounts so it doesn't linger.
  useEffect(() => {
    return () => {
      try {
        window.google?.accounts?.id?.cancel();
      } catch {
        /* noop */
      }
    };
  }, []);

  return null;
}
