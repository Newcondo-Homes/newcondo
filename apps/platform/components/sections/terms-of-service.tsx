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
          collected and released, what conduct is prohibited, and what happens when the rules are broken.
        </>
      }
    >
      {/* 01 */}
      <DocSection id="acceptance" label="01 Acceptance">
        <SecHead n="01">Acceptance &amp; eligibility</SecHead>
        <P>
          These Terms of Service (&quot;Terms&quot;) form a binding agreement between you and <B>Newcondo Ltd</B> (&quot;Newcondo&quot;,
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
          Verification keeps the marketplace honest. How that data is stored and protected is set out in our{" "}
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

      {/* 04 — Secure rent collection (renamed from Escrow) */}
      <DocSection id="rent" label="04 Rent">
        <SecHead n="04">Secure rent collection &amp; payouts</SecHead>
        <P>
          All rent is collected and held by a licensed payment partner, then released to the owner or agent once a dispute
          window has passed. Paying or collecting rent outside the platform defeats this protection and is strictly prohibited.
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
        <Callout tone="note" icon="landmark" className="mt-[22px]">
          Newcondo is not a bank and does not itself hold customer funds. Rent is held in secure virtual accounts operated by our regulated, licensed payment partner (see <DocLink href="/privacy">Privacy Policy</DocLink>). Holds, releases, and refunds are governed by our <DocLink href="/refund">Cancellation &amp; Refund Policy</DocLink>.
        </Callout>
      </DocSection>

      {/* 05 */}
      <DocSection id="fees" label="05 Fees">
        <SecHead n="05">Fees &amp; billing</SecHead>
        <P>Using certain features of the platform incurs fees. By transacting, you authorise us to charge the applicable amounts.</P>
        <Bullets
          items={[
            <><B>Platform service fees —</B> charged per transaction for maintenance, security, and secure-payment handling.</>,
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
          We may investigate suspected violations and cooperate with law enforcement. Prohibited conduct can lead to immediate suspension, removal of listings, and referral to the authorities.
        </Callout>
      </DocSection>

      {/* 07 — Listings, content & IP (+ copyright complaints + repeat infringer) */}
      <DocSection id="content" label="07 Content">
        <SecHead n="07">Listings, content &amp; intellectual property</SecHead>
        <P>
          You retain ownership of the content you upload — listing details, descriptions, photographs, and videos. By posting
          it, you grant Newcondo a worldwide, non-exclusive, royalty-free licence to host, display, and promote that content
          for the purpose of operating and marketing the platform.
        </P>
        <Bullets
          items={[
            <><B>Your warranty —</B> you confirm you own or have the rights to all content you upload, and that it does not infringe any third party&apos;s rights.</>,
            <><B>Accuracy —</B> listings must be truthful, current, and represent a genuine, available property.</>,
            <><B>Our marks —</B> the Newcondo name, logo, and platform design are our intellectual property and may not be used without written consent.</>,
          ]}
        />
        <H3>Copyright complaints</H3>
        <P>
          We respect intellectual property rights and expect users to do the same. If you believe content on the platform
          infringes your copyright or other rights, send a notice to{" "}
          <DocLink href="mailto:info@newcondo.homes">info@newcondo.homes</DocLink> identifying the work, the infringing material
          and its location on the platform, your contact details, and a statement that you have a good-faith belief the use is
          unauthorised. We will review and, where appropriate, remove the material.
        </P>
        <H3>Repeat-infringer policy</H3>
        <P>
          We may, in appropriate circumstances and at our discretion, remove infringing content and disable or terminate the
          accounts of users who repeatedly infringe the intellectual property rights of others.
        </P>
        <Callout tone="note" icon="image">
          We may remove any listing or content that breaches these Terms, is reported as fraudulent or infringing, or is required to be removed by law — without prior notice where necessary.
        </Callout>
      </DocSection>

      {/* 08 — AI & automated systems */}
      <DocSection id="ai" label="08 AI">
        <SecHead n="08">Artificial intelligence &amp; automated systems</SecHead>
        <P>
          The platform may incorporate artificial intelligence features powered by third-party providers (including OpenAI,
          Google Gemini, and similar systems) to assist with support, listing moderation, document review, fraud detection,
          recommendations, and search.
        </P>
        <Bullets
          items={[
            <><B>No reliance —</B> AI outputs may be inaccurate or incomplete and are provided for convenience only. They are not legal, financial, valuation, surveying, engineering, or professional advice.</>,
            <><B>Your inputs —</B> do not submit confidential information you would not want processed by a third-party AI provider. How AI inputs are handled is described in our <DocLink href="/privacy">Privacy Policy</DocLink>.</>,
            <><B>Automated decisions —</B> some platform actions (fraud detection, spam and abuse prevention, risk scoring) may be automated; significant enforcement actions may be subject to human review where appropriate.</>,
          ]}
        />
      </DocSection>

      {/* 09 — Maps & location */}
      <DocSection id="maps" label="09 Maps">
        <SecHead n="09">Maps &amp; location services</SecHead>
        <P>
          Location-based features — property locations, navigation, address verification, and boundary visualization — are
          provided in part through the <B>Google Maps Platform</B>. By using these features, you agree to be bound by Google&apos;s
          applicable terms of service, and you acknowledge that Google&apos;s privacy policy governs Google&apos;s handling of data.
        </P>
        <P>
          Mapping, geospatial, and satellite information is provided for general guidance only and may be inaccurate or out of
          date. It must not be relied upon as a substitute for a professional survey, physical inspection, or legal
          confirmation of boundaries or title.
        </P>
      </DocSection>

      {/* 10 — No professional advice */}
      <DocSection id="no-advice" label="10 No advice">
        <SecHead n="10">No professional advice</SecHead>
        <P>
          Newcondo provides a technology platform, not professional services. Nothing on the platform — including listings,
          verification badges, valuations, mapping data, AI outputs, or support responses — constitutes legal, financial,
          tax, surveying, valuation, engineering, or other professional advice.
        </P>
        <P>
          You are responsible for conducting your own due diligence and, where appropriate, obtaining independent professional
          advice before entering into any tenancy, payment, or property transaction.
        </P>
      </DocSection>

      {/* 11 — Property disclaimer */}
      <DocSection id="property" label="11 Property">
        <SecHead n="11">Property &amp; listing disclaimer</SecHead>
        <P>
          Listings are created by Owners and Agents, not by Newcondo. While we verify identities and ownership documents to the
          best of our ability, we do not independently guarantee the condition, legality, habitability, valuation, measurements,
          or availability of any property.
        </P>
        <Bullets
          items={[
            "Always inspect a property in person before paying.",
            "Confirm the terms of any tenancy directly with the owner or agent.",
            "Treat any request to transact off-platform as a red flag and report it.",
          ]}
        />
        <Callout tone="warn" icon="triangle-alert">
          Newcondo is not responsible for disputes about a property&apos;s condition or suitability between a renter and an owner or agent. Our role is to facilitate verified, secure transactions — not to act as landlord, agent, surveyor, or valuer.
        </Callout>
      </DocSection>

      {/* 12 */}
      <DocSection id="fraud" label="12 Fraud">
        <SecHead n="12">Verification, fraud &amp; enforcement</SecHead>
        <P>
          Newcondo operates a zero-tolerance approach to fraud. Breaches carry defined, enforceable consequences under the
          Cybercrimes Act and the Nigeria Data Protection Act (NDPA).
        </P>
        <DocTable head={["Breach", "Consequence"]} rows={ENFORCEMENT_ROWS.map(([b, c]) => [b, html(c)])} />
        <Callout tone="warn" icon="gavel">
          Newcondo reserves the right to pursue civil and criminal action against any user who submits forged documents, commits fraud, or attempts to defraud another user.
        </Callout>
      </DocSection>

      {/* 13 */}
      <DocSection id="termination" label="13 Termination">
        <SecHead n="13">Termination &amp; suspension</SecHead>
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
          Closing your account does not automatically resolve an active dispute — any ongoing matter remains in effect until it is properly settled.
        </Callout>
      </DocSection>

      {/* 14 */}
      <DocSection id="indemnity" label="14 Indemnification">
        <SecHead n="14">Indemnification</SecHead>
        <P>
          You agree to indemnify and hold harmless Newcondo, its directors, employees, and partners from any claim, loss,
          liability, or expense (including reasonable legal fees) arising out of:
        </P>
        <Bullets
          items={[
            "Your breach of these Terms or any applicable law.",
            "Content you upload, or a property you list, let, or rent.",
            "A dispute between you and another user of the platform.",
            "Your misuse of the platform, the secure-payment system, or another user's data.",
          ]}
        />
      </DocSection>

      {/* 15 */}
      <DocSection id="liability" label="15 Liability">
        <SecHead n="15">Disclaimers &amp; limitation of liability</SecHead>
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

      {/* 16 — Dispute resolution & arbitration (90-day negotiation + waivers) */}
      <DocSection id="arbitration" label="16 Arbitration">
        <SecHead n="16">Dispute resolution &amp; arbitration</SecHead>
        <H3>Informal resolution first</H3>
        <P>
          Before starting formal proceedings, you agree to first contact us at{" "}
          <DocLink href="mailto:info@newcondo.homes">info@newcondo.homes</DocLink> and attempt to resolve the dispute informally
          and in good faith for a period of at least <B>90 days</B> from the date written notice is received.
        </P>
        <H3>Binding arbitration</H3>
        <P>
          If the dispute is not resolved within that period, it shall be finally settled by confidential, individual
          arbitration under the Nigerian Arbitration and Conciliation Act.
        </P>
        <Bullets
          items={[
            <><B>Venue —</B> Owerri, Imo State, Nigeria.</>,
            <><B>Class-action waiver —</B> you and Newcondo agree to bring claims only in an individual capacity, and waive any right to bring or participate in class or representative actions.</>,
            <><B>Jury-trial waiver —</B> to the extent any claim proceeds in a court rather than arbitration, you and Newcondo each waive any right to a trial by jury.</>,
          ]}
        />
        <Callout tone="note" icon="scale">
          These Terms, and any dispute arising from them, are governed by the laws of the Federal Republic of Nigeria.
        </Callout>
      </DocSection>

      {/* 17 */}
      <DocSection id="changes" label="17 Changes">
        <SecHead n="17">Changes to these terms &amp; contact</SecHead>
        <P>
          We may update these Terms from time to time. We will communicate material changes at least <B>3 days in advance</B> via
          platform notifications or email, with a revised effective date. Continued use of the platform after a change takes effect
          constitutes acceptance of the updated Terms.
        </P>
        <ContactCard items={TERMS_CONTACT} />
        <Callout tone="note" icon="copyright" className="mt-6">
          These Terms of Service are the intellectual property of Newcondo Ltd, protected under the Nigerian Copyright Act Cap C28 LFN 2004. No reproduction, redistribution, or reuse is permitted without express written consent.
        </Callout>
      </DocSection>
    </LegalDoc>
  );
}
