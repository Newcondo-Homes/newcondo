import type { Metadata } from "next";
import Link from "next/link";
import { XCircle } from "lucide-react";
import { RButton } from "@/components/ui/button";
import { Footer } from "@/components/sections/footer";
import {
  ReferralInvitation,
  type ReferralData,
} from "@/components/referral/referral-invitation";

interface Props {
  params: Promise<{ code: string }>;
}

const LOGO_DARK = "/assets/logo-mark-dark.png";

/** Public, unauthenticated lookup of a referral code on the API. */
async function getReferralData(code: string): Promise<ReferralData | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/referrals/public/${code}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return (await res.json()) as ReferralData;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const data = await getReferralData(code);


  if (!data?.valid) {
    return { title: "Invalid referral | NewCondo" };
  }

  const rewardLine = data.reward
    ? `claim ₦${data.reward.amount.toLocaleString()} in service credit`
    : "claim your welcome reward";

  return {
    title: `Join NewCondo — invited by ${data.referrer.name}`,
    description: `Join ${data.referrer.name} on NewCondo and ${rewardLine}. Verified properties, no double-booking, protected payments.`,
  };
}

export default async function ReferralLandingPage({ params }: Props) {
  const { code } = await params;
  // const data = await getReferralData(code);
  // const valid = Boolean(data?.valid);

  const data = { valid: true, 
    referrer: { name: "emeka", role: "AGENT" as "OWNER" | "AGENT" | "RENTER" }, reward: { amount: 7500, description: "pay them" } }
  const valid = true

  // TODO: the description for the data should be something like "NewCondo service credit, applied after your first subscription or rent payment."

  return (
    <div
      className={`bg-background ${valid ? "min-h-dvh" : "h-dvh overflow-hidden"}`}
      data-screen-label="Referral invitation"
    >
      {/* ============ NAV — single action: create account ============ */}
      <nav className="sticky top-0 z-50 border-b border-border-hair bg-[rgba(247,246,239,0.8)] backdrop-blur-[18px]">
        <div className="mx-auto flex max-w-[1080px] items-center gap-6 px-[var(--gutter)] py-3.5">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-[20px] font-bold tracking-[-0.04em] text-ink no-underline"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_DARK} alt="Newcondo" className="h-auto w-[29px]" />
            <span>newcondo</span>
          </Link>
          <div className="ml-auto">
            <RButton as="a" href={`/onboarding?ref=${code}`} variant="dark" size="sm">
              Create account
            </RButton>
          </div>
        </div>
      </nav>

      {valid && data ? (
        <>
          <ReferralInvitation data={data} code={code} />
          <Footer />
        </>
      ) : (
        <InvalidInvitation />
      )}
    </div>
  );
}

/** Static fallback for an expired / unknown code. */
function InvalidInvitation() {
  return (
    <div className="flex min-h-[calc(100dvh-64px)] items-center justify-center px-[var(--gutter)] py-10">
      <div className="w-full max-w-[440px] rounded-card border border-border-hair bg-surface px-9 py-11 text-center shadow-card">
        <span className="mx-auto mb-[22px] grid h-[60px] w-[60px] place-items-center rounded-full bg-[#fbeae8] text-[#c0392b]">
          <XCircle size={30} strokeWidth={1.85} />
        </span>
        <h2 className="m-0 text-[26px] font-bold tracking-[-0.035em] text-text-primary">
          Invalid referral code
        </h2>
        <p className="mx-auto mb-[26px] mt-3 max-w-[34ch] text-[15px] leading-[1.5] text-text-secondary">
          This invitation link is no longer valid or has expired. You can still join NewCondo and
          get started.
        </p>
        <RButton as="a" href="/onboarding" variant="dark" size="sm" icon="arrow-right">
          Sign up anyway
        </RButton>
      </div>
    </div>
  );
}
