"use client";

/* ============================================================
   Cancellation & Refund Policy — content only.
   Chrome lives in <LegalDoc>.
   ============================================================ */

import { Icon } from "@/components/ui/icon";
import { Group, Item, vFade } from "@/components/motion";
import {
  LegalDoc,
  DocSection,
  SecHead,
  P,
  H3,
  B,
  DocLink,
  Bullets,
  DocTable,
  Callout,
  ContactCard,
  html,
} from "@/components/ui/legal-doc";
import {
  REFUND_TOC,
  REFUND_META,
  NON_REFUNDABLE,
  RENTER_REFUND_ROWS,
  TIMELINE_ROWS,
  CHARGEBACK_ROWS,
  FRAUD_ROWS,
  REFUND_CONTACT,
} from "@/lib/refund-data";
import { refundBreakdown } from "@/lib/constants/business";
import { ngn } from "@/lib/dashboard/format";

/* Worked example — computed from the same function the backend refunds with,
   so the policy can never quote a different figure. */
const EXAMPLE = refundBreakdown(1_000_000);

const CLAUSES = [
  { icon: "scale", title: "Binding arbitration", body: "All cancellation and refund disputes are resolved by confidential individual arbitration — in lieu of class-action litigation — under the Nigerian Arbitration and Conciliation Act." },
  { icon: "file-pen", title: "Statutory waiver", body: "You waive statutory rights to the extent permitted under Nigerian law, in exchange for the platform-managed refund protections set out here." },
  { icon: "timer", title: "Cancellation deadlines", body: "You agree that rent is refundable only through a dispute raised inside the 24-hour confirmation window, and that every other fee is final. Requests outside the window are not honoured." },
];

export function RefundPolicy() {
  return (
    <LegalDoc
      eyebrow="Legal · Payments & cancellations"
      crumb="Refund Policy"
      title="Cancellation & Refund Policy"
      meta={REFUND_META}
      toc={REFUND_TOC}
      lead={
        <>
          This policy governs every monetary transaction on Newcondo — rent, subscriptions, property plans, marking, vendor
          services, and processing costs. In short: the only thing Newcondo refunds is rent, after a valid dispute inside the
          24-hour confirmation window. Every fee is final.
        </>
      }
    >
      {/* 01 */}
      <DocSection id="scope" label="01 Scope">
        <SecHead n="01">Scope &amp; legally binding agreement</SecHead>
        <P>
          This Cancellation and Refund Policy (&quot;Policy&quot;) governs all monetary transactions and user engagements on the Newcondo platform
          — including rental payments, commission disbursements, third-party service payments, subscription fees, listing fees, and
          transaction processing costs.
        </P>
        <Callout tone="green" icon="circle-check">
          <B>At a glance.</B> Newcondo refunds <B>rent only</B>. A renter who raises a reasonable dispute within the <B>24-hour confirmation
          window</B>, and has it upheld, gets their rent back less what Flutterwave charges to reverse and send it. <B>Subscriptions, property
          plans, marking fees, vendor and service fees, the renter service fee, and payment-processing and transfer fees are never refunded.</B>
        </Callout>
        <P>
          By using the platform, all users — Renters, Property Owners, Agents, and Third-Party Service Providers — expressly agree to the
          following binding terms:
        </P>
        <Group stagger={0.08} className="mt-2 grid gap-3.5">
          {CLAUSES.map((c) => (
            <Item key={c.title} variants={vFade} className="flex items-start gap-4 rounded-[16px] border border-border-hair bg-surface p-[22px]">
              <span className="grid h-10 w-10 flex-none place-items-center rounded-[11px] bg-surface-sunken text-ink">
                <Icon name={c.icon} size={20} />
              </span>
              <div>
                <h4 className="mb-1.5 mt-px text-[16px] font-semibold tracking-[-0.01em] text-text-primary">{c.title}</h4>
                <p className="m-0 text-[14.5px] leading-[1.55] text-text-secondary">{c.body}</p>
              </div>
            </Item>
          ))}
        </Group>
        <P className="mt-[22px]">
          This Policy is legally binding and enforceable under the <B>Nigerian Arbitration and Conciliation Act</B> and the{" "}
          <B>Nigeria Data Protection Act (NDPA)</B>.
        </P>
      </DocSection>

      {/* 02 */}
      <DocSection id="non-refundable" label="02 Non-refundable">
        <SecHead n="02">Non-refundable fees</SecHead>
        <P>The following are non-refundable in all circumstances, including cancellation, account closure, or a change of mind, unless a refund is required by law:</P>
        <DocTable
          head={["Fee", "Applies to", "What it covers"]}
          rows={NON_REFUNDABLE.map((f) => [f.title, f.who, f.body])}
        />
        <Callout tone="note" icon="info">
          All fees are final. The only exceptions are a proven billing error by Newcondo (for example, charging you twice for the same thing), which we correct, or a refund that Nigerian law requires.
        </Callout>
      </DocSection>

      {/* 03 */}
      <DocSection id="refundable" label="03 Refundable">
        <SecHead n="03">Refundable transactions &amp; deadlines</SecHead>
        <H3>Renters</H3>
        <DocTable
          head={["Transaction", "Refund window", "Amount", "Conditions"]}
          rows={RENTER_REFUND_ROWS.map(([t, w, a, c]) => [t, w, <B>{a}</B>, c])}
        />
        <H3>How a rent refund is calculated</H3>
        <P>
          Flutterwave does not return its transaction fee when a payment is refunded, and charges Newcondo again to reverse and
          send the money back. That cost is deducted from the refund and rounded up to the next naira:
        </P>
        <Bullets
          items={[
            <><B>Reversal fee —</B> Flutterwave&apos;s transaction cost on the refunded rent (2% plus 7.5% VAT, plus ₦50 stamp duty on ₦10,000 or more).</>,
            <><B>Transfer fee —</B> Flutterwave&apos;s fee for sending money out of Newcondo (₦11, ₦27 or ₦54 depending on the amount, VAT included).</>,
          ]}
        />
        <DocTable
          head={["Example", "Amount"]}
          rows={[
            ["Rent paid", ngn(EXAMPLE.rentNaira)],
            ["Reversal fee", `− ${ngn(EXAMPLE.reversalFeeNaira)}`],
            ["Transfer fee", `− ${ngn(EXAMPLE.transferFeeNaira)}`],
            [<B key="r">Refunded to you</B>, <B key="v">{ngn(EXAMPLE.refundNaira)}</B>],
          ]}
        />
        <Callout tone="note" icon="clock">
          The service fee and payment-processing fee you paid with the rent are not refunded. Once the confirmation window closes, rent is
          released to the owner and cannot be refunded through Newcondo.
        </Callout>
        <H3>Owners &amp; Agents</H3>
        <Bullets
          items={[
            <><B>Payout hold —</B> rent is held in escrow for the <B>24-hour</B> confirmation window after the renter pays, so a dispute can be raised.</>,
            <><B>If a renter&apos;s dispute is upheld —</B> the rent is refunded to the renter and the Owner, listing agent and sub-agent receive no payout or commission on it. Newcondo keeps its service and processing fees.</>,
            <><B>Your own fees are final —</B> subscriptions, property plans, marking and vendor fees you have paid are not refunded, whatever happens to a tenancy.</>,
          ]}
        />
      </DocSection>

      {/* 04 */}
      <DocSection id="cancellation" label="04 Cancellation">
        <SecHead n="04">Cancellation protocols</SecHead>
        <H3>Renters</H3>
        <Bullets
          items={[
            <><B>Inspection no-shows —</B> non-refundable; rescheduling is subject to Owner / Agent discretion.</>,
            <><B>Account deletion —</B> active refund rights are forfeited unless the request is made before deletion.</>,
          ]}
        />
        <H3>Owners &amp; Agents</H3>
        <Bullets
          items={[
            <><B>Cancelling a renter post-payment —</B> if it happens inside the confirmation window, the renter&apos;s rent is refunded on the same basis as an upheld dispute (rent less the refund cost).</>,
            <><B>Subscription cancellation —</B> stops the next renewal. Nothing already paid is refunded or prorated, and access continues until the end of the current billing period.</>,
            <><B>Stopping a property&apos;s monthly service —</B> takes effect at the end of the paid period. The property stays in your account; nothing already paid is refunded.</>,
          ]}
        />
        <Callout tone="warn" icon="triangle-alert">
          Cancelling a paid renter may lead to account suspension and property delisting.
        </Callout>
      </DocSection>

      {/* 05 */}
      <DocSection id="workflow" label="05 Workflow">
        <SecHead n="05">Refund request workflow</SecHead>
        <P>
          Raise a dispute from your dashboard <B>before the 24-hour confirmation window closes</B>. Tell us what is wrong (for example, the
          property doesn&apos;t match the listing, or you were denied access) and attach evidence. Disputes raised after the window closes are not accepted.
        </P>
        <H3>Required documentation</H3>
        <Bullets
          items={[
            "Payment receipts for the transaction in question.",
            <>Evidence for the dispute — photos, videos, messages, or anything showing the problem.</>,
          ]}
        />
        <H3>Resolution timelines</H3>
        <DocTable head={["Request type", "Processing time", "Refund method"]} rows={TIMELINE_ROWS.map(([t, p, m]) => [t, p, m])} />
        <Callout tone="green" icon="undo-2">
          Approved refunds are always returned to your <B>original payment method</B> — we never redirect funds to a different account.
        </Callout>
        <Callout tone="note" icon="clock">
          Timelines above are the periods within which we <B>initiate</B> a refund. The time for funds to appear in your account also depends on your bank, card issuer, and our payment partner&apos;s processing times, which are outside our control.
        </Callout>
      </DocSection>

      {/* 06 — Chargebacks */}
      <DocSection id="chargebacks" label="06 Chargebacks">
        <SecHead n="06">Chargebacks</SecHead>
        <P>
          A chargeback is a reversal of a card payment initiated through your bank or card issuer. If something has gone
          wrong with a payment, please <B>raise it with us first</B> — we respond within <B>one business day</B> and can
          usually resolve it faster than a bank dispute.
        </P>
        <DocTable head={["Stage", "What happens"]} rows={CHARGEBACK_ROWS.map(([a, b]) => [a, b])} />
        <Callout tone="warn" icon="triangle-alert">
          Chargeback decisions are made by your card issuer or the payment scheme, not by Newcondo, and their determination is final. Please do not file a chargeback for a transaction you authorised and received the benefit of, or where a refund is available under this Policy.
        </Callout>
      </DocSection>

      {/* 07 */}
      <DocSection id="force-majeure" label="07 Force majeure">
        <SecHead n="07">Force majeure exceptions</SecHead>
        <P>
          Events outside anyone&apos;s control — such as floods, other natural disasters, or government lockdowns and evacuations — do not
          create a right to a refund. They do not extend the confirmation window, and they do not make any fee refundable.
        </P>
        <Callout tone="warn" icon="circle-x">
          <B>Rent still in escrow.</B> If such an event stops you inspecting the property, raise a dispute inside the window as usual. It is
          reviewed and, if upheld, refunded on the same basis as any other dispute.
        </Callout>
      </DocSection>

      {/* 08 */}
      <DocSection id="fraud" label="08 Fraud">
        <SecHead n="08">Fraudulent disputes &amp; consequences</SecHead>
        <P>Attempts to abuse the refund system carry strict, enforceable consequences:</P>
        <DocTable head={["Violation", "Consequence"]} rows={FRAUD_ROWS.map(([v, c]) => [v, html(c)])} />
        <Callout tone="warn" icon="gavel">
          Newcondo reserves the right to take legal action against any individual who submits false documents or fraudulent refund claims.
        </Callout>
      </DocSection>

      {/* 09 */}
      <DocSection id="arbitration" label="09 Arbitration">
        <SecHead n="09">Dispute resolution &amp; arbitration</SecHead>
        <P>All disputes arising from this Policy are resolved through binding arbitration under the Nigerian Arbitration and Conciliation Act.</P>
        <Bullets
          items={[
            <><B>Venue —</B> Owerri, Imo State, Nigeria.</>,
            <><B>Process —</B> confidential, individual arbitration.</>,
            <><B>Class-action waiver —</B> users permanently waive rights to class or representative actions.</>,
          ]}
        />
      </DocSection>

      {/* 10 */}
      <DocSection id="updates" label="10 Updates">
        <SecHead n="10">Policy updates &amp; amendments</SecHead>
        <P>Newcondo reserves the right to modify this Policy at any time. Changes are communicated via:</P>
        <Bullets
          items={[
            "Platform notifications.",
            "Email notifications to registered users.",
            "An updated policy posting with a revised effective date.",
          ]}
        />
        <P>Continued use of the platform after an update takes effect constitutes acceptance of the revised terms.</P>
      </DocSection>

      {/* 11 */}
      <DocSection id="contact" label="11 Contact">
        <SecHead n="11">Contact &amp; legal protection</SecHead>
        <P>Questions about a charge, cancellation, or refund? Reach our payments team.</P>
        <ContactCard items={REFUND_CONTACT} />
        <Callout tone="note" icon="copyright" className="mt-6">
          This Cancellation &amp; Refund Policy is the intellectual property of Newcondo Ltd, protected under the Nigerian Copyright Act Cap C28 LFN 2004. No reproduction, redistribution, or reuse is permitted without express written consent; violators face prosecution under both civil and criminal provisions.
        </Callout>
      </DocSection>
    </LegalDoc>
  );
}
