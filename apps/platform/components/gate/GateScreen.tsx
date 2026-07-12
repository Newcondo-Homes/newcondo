"use client";

import { Icon } from "@/components/ui/icon";

export type GatePhase = "idle" | "requesting" | "denied" | "restricted" | "unsupported" | "error";
export type Audience = "owner" | "agent" | "renter";

/** Light, audience-specific problem copy shown only on the gate's idle/requesting screen. */
const AUDIENCE_PROBLEMS: Record<Audience, { icon: string; text: string }[]> = {
  owner: [
    { icon: "user-x", text: "Agents collect rent from your tenant, then go quiet." },
    { icon: "map-pin-off", text: "Multiple agents market the same house — double bookings." },
    { icon: "eye-off", text: "You're abroad or across town with zero visibility on your own property." },
  ],
  agent: [
    { icon: "link-2", text: "You bring the tenant, but there's no record it was your lead." },
    { icon: "users", text: "Another agent markets the same house — you lose the deal." },
    { icon: "wallet", text: "Commission is a conversation, not a guarantee." },
  ],
  renter: [
    { icon: "image-off", text: "Photos look nothing like the house you show up to." },
    { icon: "shield-alert", text: "You pay an agent, and the listing was never even real." },
    { icon: "file-x", text: "No agreement, no receipt, no proof if something goes wrong." },
  ],
};

const COPY: Record<GatePhase, { eyebrow: string; title: string; lead: string }> = {
  idle: {
    eyebrow: "Before you continue",
    title: "Newcondo is currently only available in select Nigerian cities.",
    lead: "Share your location so we can confirm you're in a serviced area — it takes one tap.",
  },
  requesting: {
    eyebrow: "Confirming your location",
    title: "Checking if Newcondo is available near you…",
    lead: "Your browser is asking permission to share your location. Please allow it to continue.",
  },
  denied: {
    eyebrow: "Location needed",
    title: "We need your location to let you in.",
    lead: "You dismissed or blocked the location request. Enable location for this site in your browser's address-bar/site settings, then try again.",
  },
  restricted: {
    eyebrow: "Not in your area yet",
    title: "Newcondo isn't available where you are yet.",
    lead: "",
  },
  unsupported: {
    eyebrow: "Unsupported browser",
    title: "Your browser can't share your location.",
    lead: "Try again from a modern mobile or desktop browser with location services enabled.",
  },
  error: {
    eyebrow: "Something went wrong",
    title: "We couldn't confirm your location.",
    lead: "Check your device's location/GPS is turned on, then try again.",
  },
};

export function GateScreen({
  phase,
  audience = "owner",
  allowedAreasText,
  onRequest,
}: {
  phase: GatePhase;
  audience?: Audience;
  allowedAreasText: string;
  onRequest: () => void;
}) {
  const copy = COPY[phase];
  const busy = phase === "requesting";
  const showProblems = phase === "idle" || phase === "requesting";
  const showRetry = phase === "denied" || phase === "restricted" || phase === "unsupported" || phase === "error";
  const problems = AUDIENCE_PROBLEMS[audience];

  return (
    <div
      className="fixed inset-0 z-[999] flex h-[100dvh] w-screen flex-col overflow-hidden bg-ink"
      data-screen-label="Location Gate"
    >
      <div className="mx-auto flex h-full w-full max-w-[560px] flex-1 flex-col items-center justify-center gap-[clamp(20px,4vh,36px)] px-[clamp(20px,6vw,40px)] py-[clamp(16px,4vh,32px)] text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo-mark-cream.png" alt="Newcondo" className="h-auto w-[34px]" />

        <div className="flex flex-col items-center gap-[14px]">
          <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-green-bright">
            {copy.eyebrow}
          </span>
          <h1 className="m-0 max-w-[20ch] text-[clamp(24px,4.4vw,38px)] font-bold leading-[1.05] tracking-[-0.03em] text-cream text-wrap-balance">
            {copy.title}
          </h1>
          {phase === "restricted" ? (
            <p className="m-0 max-w-[38ch] text-[15px] leading-[1.5] text-text-on-dark-2">
              Right now that&apos;s {allowedAreasText || "a small set of pilot cities"}. We&apos;re expanding
              soon — check back, or contact us if you&apos;d like early access in your city.
            </p>
          ) : (
            <p className="m-0 max-w-[36ch] text-[15px] leading-[1.5] text-text-on-dark-2">{copy.lead}</p>
          )}
        </div>

        {showProblems && (
          <ul className="m-0 flex w-full max-w-[420px] list-none flex-col gap-2.5 p-0">
            {problems.map((p) => (
              <li
                key={p.text}
                className="flex items-center gap-3 rounded-[16px] border border-[rgba(249,249,239,0.1)] bg-[rgba(249,249,239,0.04)] px-4 py-3 text-left"
              >
                <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-[rgba(249,249,239,0.08)] text-green-bright">
                  <Icon name={p.icon} size={16} />
                </span>
                <span className="text-[13.5px] leading-[1.35] text-text-on-dark-2">{p.text}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex w-full max-w-[360px] flex-col items-center gap-3">
          <button
            type="button"
            onClick={onRequest}
            disabled={busy}
            className={`group inline-flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full border border-transparent bg-cream px-7 py-[16px] text-[15.5px] font-semibold leading-none text-ink no-underline transition-[transform,background,box-shadow] duration-200 ease-nc hover:bg-white hover:shadow-[0_14px_40px_rgba(0,0,0,0.28)] active:scale-[0.97] disabled:cursor-wait disabled:opacity-70${busy ? "" : " gate-cta-pulse"}`}
          >
            <Icon
              name={busy ? "loader-2" : "map-pin"}
              size={17}
              className={busy ? "animate-spin" : "transition-transform duration-200 ease-nc group-hover:scale-110"}
            />
            {busy ? (
              <span className="inline-flex items-baseline">
                Requesting access
                <span className="ml-px inline-flex">
                  <span className="gate-dot">.</span>
                  <span className="gate-dot">.</span>
                  <span className="gate-dot">.</span>
                </span>
              </span>
            ) : showRetry ? (
              "Try again"
            ) : (
              "Allow location access"
            )}
          </button>
          <p className="m-0 text-[12.5px] leading-[1.4] text-text-on-dark-2/80">
            Used only to confirm your city. Saved on this device — never sent to our servers.
          </p>
        </div>
      </div>
    </div>
  );
}
