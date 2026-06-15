"use client";

/* ============================================================
   Terms of Service — content only. Chrome lives in <LegalDoc>.
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
  TERMS_TOC,
  TERMS_META,
  ROLE_CARDS,
  ESCROW_STEPS,
  PROHIBITED,
  ENFORCEMENT_ROWS,
  TERMS_CONTACT,
} from "@/lib/terms-data";

export function TermsOfService() {
  return (
    <LegalDoc
      eyebrow="Legal · Platform terms"
      crumb="Terms of Service"
      title="Terms of Service"
      meta={TERMS_META}
      toc={TERMS_TOC}
      lead={
        <>
          These terms are the agreement between you and Newcondo. They set out who can use the platform, how rent is
          collected and released through escrow, what conduct is prohibited, and what happens when the rules are broken.
        </>
      }
    >
      {/* 01 */}
      <DocSection id="acceptance" label="01 Acceptance">
        <SecHead n="01">Acceptance &amp; eligibility</SecHead>
        <P>
          These Terms of Service (&quot;Terms&quot;) form a binding agreement between you and <B>NewCondo Ltd</B> (&quot;Newcondo&quot;,
          &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). By creating an account, listing a property, or otherwise using the platform, you
          confirm that you have read, understood, and agree to be bound by these Terms, our{" "}
          <DocLink href="/privacy">Privacy Policy</DocLink>, and our <DocLink href="/refund">Cancellation &amp; Refund Policy</DocLink>.
        </P>
        <Bullets
          items={[
            <><B>Age —</B> you must be at least <B>18 years old</B> to use Newcondo. The platform is not intended for minors.</>,
            <><B>Capacity —</B> you must have the legal capacity to enter a binding contract under Nigerian law.</>,
            <><B>Authority —</B> if you use the platform on behalf of a company or agency, you confirm you are authorised to bind that entity to these Terms.</>,
          ]}
        />
        <Callout tone="note" icon="info">
          If you do not agree with any part of these Terms, you must not access or use the platform.
        </Callout>
      </DocSection>

      {/* 02 */}
      <DocSection id="accounts" label="02 Accounts">
        <SecHead n="02">Account registration &amp; verification</SecHead>
        <P>
          To transact on Newcondo you must register an account and complete identity verification. You agree to provide
          accurate, current, and complete information, and to keep it up to date.
        </P>
        <Bullets
          items={[
            <><B>Identity verification —</B> all users submit a government ID (e.g. NIN, driver&apos;s licence, or passport), verified through authorized government APIs.</>,
            <><B>Ownership &amp; agency proof —</B> Owners must prove ownership; Agents must provide valid certification and the owner&apos;s signed consent before listing.</>,
            <><B>Account security —</B> you are responsible for safeguarding your login credentials and for all activity under your account.</>,
            <><B>One account —</B> you may not maintain duplicate or impersonating accounts, or transfer your account to another person.</>,
          ]}
        />
        <Callout tone="green" icon="shield-check">
          Verification keeps the marketplace honest. How your verification data is stored and protected is set out in our{" "}
          <DocLink href="/privacy">Privacy Policy</DocLink>.
        </Callout>
      </DocSection>

      {/* 03 */}
      <DocSection id="roles" label="03 Roles">
        <SecHead n="03">Roles &amp; responsibilities</SecHead>
        <P>Newcondo serves three user classes. Each accepts specific obligations when they use the platform.</P>
        <Group stagger={0.08} className="mt-2 grid gap-3.5">
          {ROLE_CARDS.map((c) => (
            <Item key={c.role} variants={vFade} className="flex items-start gap-4 rounded-[16px] border border-border-hair bg-surface p-[22px]">
              <span className="grid h-10 w-10 flex-none place-items-center rounded-[11px] bg-surface-sunken text-ink">
                <Icon name={c.icon} size={20} />
              </span>
              <div>
                <h4 className="mb-1.5 mt-px text-[16px] font-semibold tracking-[-0.01em] text-text-primary">{c.role}</h4>
                <p className="m-0 text-[14.5px] leading-[1.55] text-text-secondary">{c.body}</p>
              </div>
            </Item>
          ))}
        </Group>
        <Callout tone="note" icon="handshake" className="mt-[22px]">
          Newcondo is a technology platform that facilitates rentals between users. We are not a party to the tenancy agreement itself, and we do not own, manage, or let any of the listed properties.
        </Callout>
      </DocSection>

      {/* 04 */}
      <DocSection id="escrow" label="04 Escrow">
        <SecHead n="04">Escrow rent collection &amp; payouts</SecHead>
        <P>
          All rent is collected and held in escrow, then released to the owner or agent once a dispute window has passed.
          Paying or collecting rent outside the platform defeats this protection and is strictly prohibited.
        </P>
        <Group stagger={0.08} className="mt-2 grid gap-3">
          {ESCROW_STEPS.map((s) => (
            <Item key={s.n} variants={vFade} className="flex items-start gap-4 rounded-[16px] border border-border-hair bg-surface p-[22px]">
              <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-green-wash font-mono text-[15px] font-semibold text-green-dark">
                {s.n}
              </span>
              <div>
                <h4 className="mb-1.5 mt-px text-[16px] font-semibold tracking-[-0.01em] text-text-primary">{s.title}</h4>
                <p className="m-0 text-[14.5px] leading-[1.55] text-text-secondary">{s.body}</p>
              </div>
            </Item>
          ))}
        </Group>
        <Callout tone="warn" icon="triangle-alert" className="mt-[22px]">
          Releases, holds, and refunds from escrow are governed by our <DocLink href="/refund">Cancellation &amp; Refund Policy</DocLink>. Attempting to settle rent off-platform may result in suspension and forfeiture of pending payouts.
        </Callout>
      </DocSection>

      {/* 05 */}
      <DocSection id="fees" label="05 Fees">
        <SecHead n="05">Fees &amp; billing</SecHead>
        <P>Using certain features of the platform incurs fees. By transacting, you authorise us to charge the applicable amounts.</P>
        <Bullets
          items={[
            <><B>Platform service fees —</B> charged per transaction for maintenance, security, and escrow handling.</>,
            <><B>Transaction charges —</B> reflect the payment gateway&apos;s processing cost on each transaction.</>,
            <><B>Subscriptions —</B> Owners and Agents may subscribe for advanced tools; subscriptions renew until cancelled and are billed per cycle.</>,
            <><B>Inspection fees —</B> where applicable, paid by Renters directly to Owners or Agents.</>,
          ]}
        />
        <Callout tone="note" icon="receipt">
          Which fees are refundable, and the windows that apply, are defined in full in our <DocLink href="/refund">Cancellation &amp; Refund Policy</DocLink>. Service and transaction fees are non-refundable except where required by law.
        </Callout>
      </DocSection>

      {/* 06 */}
      <DocSection id="acceptable-use" label="06 Acceptable use">
        <SecHead n="06">Acceptable use &amp; prohibited conduct</SecHead>
        <P>You agree to use Newcondo lawfully and in good faith. The following conduct is strictly prohibited:</P>
        <Bullets items={PROHIBITED} />
        <Callout tone="warn" icon="ban">
          We may investigate suspected violations and cooperate with law enforcement. Prohibited conduct can lead to immediate suspension, removal of listings, financial penalties, and referral to the authorities.
        </Callout>
      </DocSection>

      {/* 07 */}
      <DocSection id="content" label="07 Content">
        <SecHead n="07">Listings &amp; content ownership</SecHead>
        <P>
          You retain ownership of the content you upload — listing details, descriptions, and photographs. By posting it,
          you grant Newcondo a worldwide, non-exclusive, royalty-free licence to host, display, and promote that content for
          the purpose of operating and marketing the platform.
        </P>
        <Bullets
          items={[
            <><B>Your warranty —</B> you confirm you own or have the rights to all content you upload, and that it does not infringe any third party&apos;s rights.</>,
            <><B>Accuracy —</B> listings must be truthful, current, and represent a genuine, available property.</>,
            <><B>Our marks —</B> the Newcondo name, logo, and platform design are our intellectual property and may not be used without written consent.</>,
          ]}
        />
        <Callout tone="note" icon="image">
          We may remove any listing or content that breaches these Terms, is reported as fraudulent, or is required to be removed by law — without prior notice where necessary.
        </Callout>
      </DocSection>

      {/* 08 */}
      <DocSection id="fraud" label="08 Fraud">
        <SecHead n="08">Verification, fraud &amp; enforcement</SecHead>
        <P>
          Newcondo operates a zero-tolerance approach to fraud. Breaches carry defined, enforceable consequences under the
          Cybercrimes Act and the Nigeria Data Protection Act (NDPA).
        </P>
        <DocTable head={["Breach", "Consequence"]} rows={ENFORCEMENT_ROWS.map(([b, c]) => [b, html(c)])} />
        <Callout tone="warn" icon="gavel">
          Newcondo reserves the right to pursue civil and criminal action against any user who submits forged documents, commits fraud, or attempts to defraud another user.
        </Callout>
      </DocSection>

      {/* 09 */}
      <DocSection id="termination" label="09 Termination">
        <SecHead n="09">Termination &amp; suspension</SecHead>
        <P>
          You may stop using the platform and close your account at any time. We may suspend or terminate your access where
          you breach these Terms, create risk for other users, or where required by law.
        </P>
        <Bullets
          items={[
            <><B>By you —</B> you can request account closure from your dashboard; some data is retained where the law or fraud-prevention requires it, as described in our <DocLink href="/privacy">Privacy Policy</DocLink>.</>,
            <><B>By us —</B> we may suspend immediately and without notice for fraud, forged documents, off-platform circumvention, or unlawful use.</>,
            <><B>Effect —</B> on termination, active listings are removed and pending obligations (including outstanding fees or payouts under dispute) survive closure.</>,
          ]}
        />
        <Callout tone="warn" icon="user-x">
          Closing your account to evade a debt, penalty, or active dispute does not extinguish it — outstanding amounts remain due and may be referred to collections or the authorities.
        </Callout>
      </DocSection>

      {/* 10 */}
      <DocSection id="indemnity" label="10 Indemnification">
        <SecHead n="10">Indemnification</SecHead>
        <P>
          You agree to indemnify and hold harmless Newcondo, its directors, employees, and partners from any claim, loss,
          liability, or expense (including reasonable legal fees) arising out of:
        </P>
        <Bullets
          items={[
            "Your breach of these Terms or any applicable law.",
            "Content you upload, or a property you list, let, or rent.",
            "A dispute between you and another user of the platform.",
            "Your misuse of the platform, escrow system, or another user's data.",
          ]}
        />
      </DocSection>

      {/* 11 */}
      <DocSection id="liability" label="11 Liability">
        <SecHead n="11">Disclaimers &amp; limitation of liability</SecHead>
        <P>
          The platform is provided on an <B>&quot;as is&quot;</B> and <B>&quot;as available&quot;</B> basis. While we verify identities and
          ownership documents to the best of our ability, Newcondo is a facilitator and does not guarantee the conduct of any
          user or the condition of any property.
        </P>
        <Bullets
          items={[
            <><B>No warranty —</B> we do not warrant that the platform will be uninterrupted, error-free, or completely secure.</>,
            <><B>User conduct —</B> we are not liable for the acts or omissions of Renters, Owners, or Agents, or for any off-platform arrangement between them.</>,
            <><B>Liability cap —</B> to the maximum extent permitted by law, our total liability to you is capped at six months&apos; worth of the platform fees you have paid.</>,
            <><B>Force majeure —</B> we are not liable for failures caused by events beyond our reasonable control, as further described in our <DocLink href="/refund">Refund Policy</DocLink>.</>,
          ]}
        />
        <Callout tone="note" icon="shield">
          Nothing in these Terms excludes liability that cannot be excluded under Nigerian law.
        </Callout>
      </DocSection>

      {/* 12 */}
      <DocSection id="changes" label="12 Changes">
        <SecHead n="12">Changes to these terms &amp; contact</SecHead>
        <P>
          We may update these Terms from time to time. We will communicate material changes at least <B>3 days in advance</B> via
          platform notifications or email, with a revised effective date. Continued use of the platform after a change takes effect
          constitutes acceptance of the updated Terms.
        </P>
        <P>
          These Terms are governed by the laws of the <B>Federal Republic of Nigeria</B>. Disputes are resolved by confidential,
          individual arbitration seated in <B>Owerri, Imo State</B>, and users waive any right to class or representative actions.
        </P>
        <ContactCard items={TERMS_CONTACT} />
        <Callout tone="note" icon="copyright" className="mt-6">
          These Terms of Service are the intellectual property of NewCondo Ltd, protected under the Nigerian Copyright Act Cap C28 LFN 2004. No reproduction, redistribution, or reuse is permitted without express written consent.
        </Callout>
      </DocSection>
    </LegalDoc>
  );
}
