"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Check, ArrowRight, Gift, Copy, CheckCheck } from "lucide-react";
import { cx } from "@/lib/cx";
import { UserType } from "@/types/api";
import type { OnboardingProfile, Plan, PaymentResult } from "@/types/api";

/* ============================================================
   PaymentSuccess

   Confirmation screen. Auto-advances to the dashboard after a short
   countdown, and also offers an explicit Continue button so the user
   doesn't have to wait. Shows a recap of who they are + their plan,
   and a dual-sided referral prompt (both parties earn credit).
   ============================================================ */
const naira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

const ROLE_LABEL: Record<UserType, string> = {
    [UserType.OWNER]: "Property owner",
    [UserType.RENTER]: "Renter",
    [UserType.AGENT]: "Agent",
    [UserType.PROPERTY_MANAGER]: "Property manager",
    [UserType.ADMIN]: "Admin",
};

const REFERRAL_CREDIT = 5000; // ₦ — both referrer and referee earn this.

export default function PaymentSuccess({
    profile,
    plan,
    payment,
    onContinue,
    redirectSeconds = 7,
}: {
    profile: OnboardingProfile;
    plan: Plan;
    payment?: PaymentResult;
    onContinue: () => void;
    redirectSeconds?: number;
}) {
    const [seconds, setSeconds] = useState(redirectSeconds);
    const [copied, setCopied] = useState(false);

    // Build a referral link from the user's email (replace with the real code from the API).
    const referralCode =
        profile.email.split("@")[0].replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase() || "NEWCONDO";

    // TODO: create referral code page
    const referralLink = `https://newcondo.homes/r/${referralCode}`;

    const firedRef = useRef(false);

    useEffect(() => {
        if (seconds <= 0) {
            if (!firedRef.current) {
                firedRef.current = true;
                onContinue();
            }
            return;
        }
        const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
        return () => clearTimeout(t);
    }, [seconds, onContinue]);

    const copyLink = useCallback(() => {
        navigator.clipboard?.writeText(referralLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [referralLink]);

    const firstName = profile.name.trim().split(/\s+/)[0] || "there";

    return (
        <div className="flex w-full flex-col items-center text-center">
            {/* success badge */}
            <span className="grid h-[60px] w-[60px] place-items-center rounded-full bg-green-wash text-green-dark">
                <Check size={32} strokeWidth={2.4} />
            </span>

            <p className="mt-4 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-green-dark">
                {plan.price === 0 ? "Account ready" : "Payment confirmed"}
            </p>
            <h1 className="mt-2 text-[clamp(25px,3vw,36px)] font-bold leading-[1.02] tracking-[-0.04em] text-text-primary">
                You&apos;re all set, {firstName}.
            </h1>
            <p className="mt-2.5 max-w-[50ch] text-[14.5px] leading-[1.5] text-text-secondary">
                Your {ROLE_LABEL[profile.role].toLowerCase()} account is live on the{" "}
                <strong className="text-text-primary">{plan.name}</strong> plan. Taking you to your dashboard now.
            </p>

            {/* recap card */}
            <div className="mt-5 grid w-full grid-cols-2 gap-x-6 gap-y-4 rounded-card border border-border-hair bg-surface px-[22px] py-[18px] text-left shadow-card max-[480px]:grid-cols-1 max-[480px]:gap-y-3.5 max-[480px]:px-4 max-[480px]:py-4">
                <Stat label="Account" value={profile.name} />
                <Stat label="Email" value={profile.email} muted />
                <Stat label="Account type" value={ROLE_LABEL[profile.role]} />
                <Stat
                    label="Plan"
                    value={`${plan.name} · ${plan.price === 0 ? "Free" : `${naira(plan.price)}/mo`}`}
                />
                {payment && plan.price > 0 && (
                    <div className="col-span-2">
                        <Stat label="Reference" value={payment.reference} mono />
                    </div>
                )}
            </div>

            {/* referral */}
            <div className="mt-3.5 w-full overflow-hidden rounded-card bg-ink px-[22px] py-[18px] text-left text-cream max-[480px]:px-4 max-[480px]:py-4">
                <div className="flex items-start gap-3.5">
                    <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-[rgba(0,208,132,0.16)] text-green-bright">
                        <Gift size={21} strokeWidth={1.9} />
                    </span>
                    <div className="min-w-0">
                        <h3 className="m-0 text-[15.5px] font-bold tracking-[-0.02em] text-cream max-[480px]:text-[15px]">
                            Refer a friend — you both earn {naira(REFERRAL_CREDIT)}
                        </h3>
                        <p className="m-0 mt-1 text-[12.5px] leading-[1.45] text-text-on-dark-2">
                            When someone joins with your link and subscribes, {naira(REFERRAL_CREDIT)} in credit lands in
                            both your accounts.
                        </p>
                    </div>
                </div>

                <div className="mt-3 flex items-center gap-2 rounded-full border border-[rgba(249,249,239,0.16)] bg-[rgba(249,249,239,0.06)] py-1.5 pl-4 pr-1.5 max-[480px]:pl-3.5">
                    <span className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-text-on-dark max-[480px]:text-[11.5px]">{referralLink}</span>
                    <button
                        type="button"
                        onClick={copyLink}
                        className={cx(
                            "inline-flex flex-none items-center gap-2 rounded-full px-4 py-2 text-[13.5px] font-semibold transition-colors duration-200 ease-nc",
                            copied ? "bg-green-bright text-ink" : "bg-cream text-ink hover:bg-white"
                        )}
                    >
                        {copied ? <CheckCheck size={15} strokeWidth={2.2} /> : <Copy size={15} strokeWidth={2.1} />}
                        {copied ? "Copied" : "Copy"}
                    </button>
                </div>
            </div>

            {/* continue */}
            <button
                type="button"
                onClick={onContinue}
                className="group mt-5 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-ink px-8 py-[14px] text-[16px] font-semibold leading-none text-cream transition-[transform,background,box-shadow] duration-200 ease-nc hover:bg-black hover:shadow-card active:scale-[0.97] max-[480px]:py-[13px] max-[480px]:text-[15px]"
            >
                Go to dashboard
                <ArrowRight size={18} strokeWidth={2} className="transition-transform duration-200 ease-nc group-hover:translate-x-1" />
            </button>
            <p className="mt-2.5 text-[13px] text-text-tertiary">
                Redirecting automatically in {seconds}s…
            </p>
        </div>
    );
}

function Stat({
    label,
    value,
    muted = false,
    mono = false,
}: {
    label: string;
    value: string;
    muted?: boolean;
    mono?: boolean;
}) {
    return (
        <div className="flex min-w-0 flex-col gap-[3px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-text-tertiary">{label}</span>
            <span
                className={cx(
                    "truncate text-[14.5px] font-semibold",
                    muted ? "text-text-tertiary" : "text-text-primary",
                    mono && "font-mono text-[12.5px] font-medium text-text-secondary"
                )}
            >
                {value}
            </span>
        </div>
    );
}
