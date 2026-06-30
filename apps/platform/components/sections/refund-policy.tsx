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
  FRAUD_ROWS,
  REFUND_CONTACT,
} from "@/lib/refund-data";

const CLAUSES = [
  { icon: "scale", title: "Binding arbitration", body: "All cancellation and refund disputes are resolved by confidential individual arbitration — in lieu of class-action litigation — under the Nigerian Arbitration and Conciliation Act." },
  { icon: "file-pen", title: "Statutory waiver", body: "You waive statutory rights to the extent permitted under Nigerian law, in exchange for the platform-managed refund protections set out here." },
  { icon: "timer", title: "Cancellation deadlines", body: "You agree to adhere to platform-specific cancellation deadlines and refund conditions. Requests outside these windows are honoured only in documented force-majeure cases." },
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
          This policy governs every monetary transaction on Newcondo — rent, commission, third-party service payments,
          subscriptions, listing fees, and processing costs — and sets out exactly what is refundable, when, and how.
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
          <B>At a glance.</B> Rent, deposits, and commission are fully refundable within <B>48 hours</B> of payment (excluding service and
          transaction fees). After that window, refunds apply only in documented force-majeure cases.
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
        <P>The following fees are non-refundable under any circumstances unless a refund is required by law:</P>
        <DocTable
          head={["Fee", "Applies to", "What it covers"]}
          rows={NON_REFUNDABLE.map((f) => [f.title, f.who, f.body])}
        />
        <Callout tone="note" icon="info">
          All fees are considered final except in cases of a proven VAT calculation error or another mandatory legal adjustment.
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
        <Callout tone="note" icon="clock">
          Refunds requested outside this window may only be honoured in documented <DocLink href="#force-majeure">force-majeure</DocLink> cases.
        </Callout>
        <H3>Owners &amp; Agents</H3>
        <Bullets
          items={[
            <><B>Payout hold —</B> the platform holds rent and commission payouts for <B>72 hours</B> after the renter pays, to allow a dispute window.</>,
            <><B>If a renter cancels within 48 hours —</B> the Owner / Agent forfeits the payout, and the platform retains its service and transaction fees.</>,
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
            <><B>Cancelling a renter post-payment —</B> the renter receives a full refund (rent + commission) within <B>24 hours</B> of payout receipt.</>,
            <><B>Subscription cancellation —</B> non-prorated; access continues until the end of the current billing cycle.</>,
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
          Submit requests through your user dashboard within <B>48 hours</B> of payment (<B>72 hours</B> for force-majeure cases).
        </P>
        <H3>Required documentation</H3>
        <Bullets
          items={[
            "Payment receipts for the transaction in question.",
            <>Official proof of force majeure where applicable (e.g. NEMA orders, government lockdown directives).</>,
          ]}
        />
        <H3>Resolution timelines</H3>
        <DocTable head={["Request type", "Processing time", "Refund method"]} rows={TIMELINE_ROWS.map(([t, p, m]) => [t, p, m])} />
        <Callout tone="green" icon="undo-2">
          Approved refunds are always returned to your <B>original payment method</B> — we never redirect funds to a different account.
        </Callout>
      </DocSection>

      {/* 06 */}
      <DocSection id="force-majeure" label="06 Force majeure">
        <SecHead n="06">Force majeure exceptions</SecHead>
        <P>Refunds outside the standard window may be granted only for genuinely uncontrollable events:</P>
        <Bullets
          items={[
            <><B>Natural disasters —</B> such as floods or earthquakes.</>,
            <><B>Government actions —</B> such as lockdowns or evacuations. Proof must be provided from a credible source (e.g. NEMA or the State Government).</>,
          ]}
        />
        <Callout tone="warn" icon="circle-x">
          <B>Non-qualifying.</B> Transport strikes, poor weather forecasts, and similar foreseeable disruptions do not qualify for an out-of-window refund.
        </Callout>
      </DocSection>

      {/* 07 */}
      <DocSection id="fraud" label="07 Fraud">
        <SecHead n="07">Fraudulent disputes &amp; consequences</SecHead>
        <P>Attempts to abuse the refund system carry strict, enforceable consequences:</P>
        <DocTable head={["Violation", "Consequence"]} rows={FRAUD_ROWS.map(([v, c]) => [v, html(c)])} />
        <Callout tone="warn" icon="gavel">
          Newcondo reserves the right to take legal action against any individual who submits false documents or fraudulent refund claims.
        </Callout>
      </DocSection>

      {/* 08 */}
      <DocSection id="arbitration" label="08 Arbitration">
        <SecHead n="08">Dispute resolution &amp; arbitration</SecHead>
        <P>All disputes arising from this Policy are resolved through binding arbitration under the Nigerian Arbitration and Conciliation Act.</P>
        <Bullets
          items={[
            <><B>Venue —</B> Owerri, Imo State, Nigeria.</>,
            <><B>Process —</B> confidential, individual arbitration.</>,
            <><B>Class-action waiver —</B> users permanently waive rights to class or representative actions.</>,
          ]}
        />
      </DocSection>

      {/* 09 */}
      <DocSection id="updates" label="09 Updates">
        <SecHead n="09">Policy updates &amp; amendments</SecHead>
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

      {/* 10 */}
      <DocSection id="contact" label="10 Contact">
        <SecHead n="10">Contact &amp; legal protection</SecHead>
        <P>Questions about a charge, cancellation, or refund? Reach our payments team.</P>
        <ContactCard items={REFUND_CONTACT} />
        <Callout tone="note" icon="copyright" className="mt-6">
          This Cancellation &amp; Refund Policy is the intellectual property of Newcondo Ltd, protected under the Nigerian Copyright Act Cap C28 LFN 2004. No reproduction, redistribution, or reuse is permitted without express written consent; violators face prosecution under both civil and criminal provisions.
        </Callout>
      </DocSection>
    </LegalDoc>
  );
}
