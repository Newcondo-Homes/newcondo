"use client";

/* ============================================================
   Trust & Safety — content only. Chrome lives in <LegalDoc>.
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
} from "@/components/ui/legal-doc";
import {
  TRUST_TOC,
  TRUST_META,
  PILLARS,
  VERIFY_ROWS,
  MONITORING,
  INSPECTION_TIPS,
  REPORT_STEPS,
  RED_FLAGS,
  TRUST_CONTACT,
} from "@/lib/trust-data";

export function TrustSafety() {
  return (
    <LegalDoc
      eyebrow="Legal · Trust & Safety"
      crumb="Trust & Safety"
      title="Trust & Safety"
      meta={TRUST_META}
      toc={TRUST_TOC}
      lead={
        <>
          Renting a home should never be a gamble. Here&apos;s how Newcondo verifies who you&apos;re dealing with, protects your
          money in escrow, and steps in fast when something isn&apos;t right.
        </>
      }
    >
      {/* 01 */}
      <DocSection id="commitment" label="01 Commitment">
        <SecHead n="01">Our safety commitment</SecHead>
        <P>
          Newcondo was built to take the fear out of renting in Nigeria — fake landlords, cash that disappears, and listings
          that don&apos;t exist. Our entire model rests on four promises that work together to keep the marketplace honest.
        </P>
        <Group stagger={0.08} className="mt-2 grid grid-cols-2 gap-3.5 max-[560px]:grid-cols-1">
          {PILLARS.map((p) => (
            <Item key={p.title} variants={vFade} className="rounded-[16px] border border-border-hair bg-surface p-[22px]">
              <span className="mb-3.5 grid h-11 w-11 place-items-center rounded-[12px] bg-green-wash text-green-dark">
                <Icon name={p.icon} size={22} />
              </span>
              <h4 className="mb-1.5 text-[17px] font-semibold tracking-[-0.01em] text-text-primary">{p.title}</h4>
              <p className="m-0 text-[14.5px] leading-[1.55] text-text-secondary">{p.body}</p>
            </Item>
          ))}
        </Group>
      </DocSection>

      {/* 02 */}
      <DocSection id="verification" label="02 Verification">
        <SecHead n="02">Verified identities &amp; real owners</SecHead>
        <P>
          Trust starts with knowing exactly who is on the other side of a deal. Before anyone can transact, we confirm their
          identity — and before a property goes live, we check it against genuine ownership records.
        </P>
        <DocTable head={["Who", "What we verify"]} rows={VERIFY_ROWS.map(([a, b]) => [a, b])} />
        <Callout tone="green" icon="badge-check">
          A verified badge means a user&apos;s ID has been confirmed. How that data is stored and protected is set out in our{" "}
          <DocLink href="/privacy">Privacy Policy</DocLink>.
        </Callout>
      </DocSection>

      {/* 03 */}
      <DocSection id="escrow" label="03 Rent">
        <SecHead n="03">Your money is held securely</SecHead>
        <P>
          On Newcondo, rent is never paid to an agent in cash. It is collected into a secure virtual account operated by our
          licensed, PCI-DSS-compliant payment partner and held until the deal is protected — so your money is safe even if
          something goes wrong.
        </P>
        <Bullets
          items={[
            <><B>Held, not handed over —</B> funds sit with our regulated payment partner, not with an individual. Newcondo is not a bank and does not itself hold your funds.</>,
            <><B>A dispute window —</B> payouts are held for 72 hours so a cancellation or refund claim can be raised.</>,
            <><B>Released fairly —</B> the balance is released to the owner only once the window closes with no valid dispute.</>,
          ]}
        />
        <Callout tone="note" icon="info">
          The full mechanics of holds, releases, and refunds live in our <DocLink href="/refund">Cancellation &amp; Refund Policy</DocLink>.
        </Callout>
      </DocSection>

      {/* 04 */}
      <DocSection id="monitoring" label="04 Monitoring">
        <SecHead n="04">Round-the-clock fraud monitoring</SecHead>
        <P>Automated systems and human review work together to catch bad actors before they reach you. We watch for signals like:</P>
        <Bullets items={MONITORING} />
        <Callout tone="warn" icon="scan-eye">
          When our systems flag a risk, we can freeze a payout, hide a listing, or lock an account while we investigate — protecting other users in the meantime.
        </Callout>
      </DocSection>

      {/* 05 */}
      <DocSection id="inspections" label="05 Inspections">
        <SecHead n="05">Staying safe at inspections</SecHead>
        <P>Meeting in person is part of renting. A few simple habits keep viewings safe for everyone.</P>
        <Group stagger={0.07} className="mt-2 grid grid-cols-2 gap-3.5 max-[560px]:grid-cols-1">
          {INSPECTION_TIPS.map((t) => (
            <Item key={t.title} variants={vFade} className="flex items-start gap-3.5 rounded-[16px] border border-border-hair bg-surface p-[20px]">
              <span className="grid h-10 w-10 flex-none place-items-center rounded-[11px] bg-surface-sunken text-ink">
                <Icon name={t.icon} size={20} />
              </span>
              <div>
                <h4 className="mb-1 mt-0.5 text-[15.5px] font-semibold tracking-[-0.01em] text-text-primary">{t.title}</h4>
                <p className="m-0 text-[14px] leading-[1.5] text-text-secondary">{t.body}</p>
              </div>
            </Item>
          ))}
        </Group>
      </DocSection>

      {/* 06 */}
      <DocSection id="reporting" label="06 Reporting">
        <SecHead n="06">Reporting &amp; how we respond</SecHead>
        <P>
          If something feels wrong, tell us — every report is reviewed by a real person. Reporting is confidential, and you
          never need a reason to play it safe.
        </P>
        <Group stagger={0.08} className="mt-2 grid gap-3">
          {REPORT_STEPS.map((s) => (
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
        <Callout tone="note" icon="flag" className="mt-[22px]">
          Enforcement actions for confirmed violations are defined in our <DocLink href="/terms">Terms of Service</DocLink>.
        </Callout>
      </DocSection>

      {/* 07 */}
      <DocSection id="data" label="07 Data">
        <SecHead n="07">Data &amp; account security</SecHead>
        <P>Keeping the platform safe also means keeping your information and your account secure.</P>
        <Bullets
          items={[
            <><B>Encryption —</B> data is protected with AES-256 at rest and TLS 1.3 in transit.</>,
            <><B>Sensitive data minimised —</B> IDs are hashed and bank details tokenized after processing.</>,
            <><B>Card details never touch our servers —</B> card numbers and CVVs are captured directly by our PCI-DSS-compliant payment partner. Newcondo does not collect or store full cardholder data, and we undertake never to violate the privacy of any cardholder who transacts through the platform.</>,
            <><B>Your part —</B> never share your password or one-time code — Newcondo will never ask for them.</>,
          ]}
        />
        <Callout tone="green" icon="shield-check">
          Full detail on how we collect, protect, and retain your data is in our <DocLink href="/privacy">Privacy Policy</DocLink>.
        </Callout>
      </DocSection>

      {/* 08 */}
      <DocSection id="red-flags" label="08 Red flags">
        <SecHead n="08">Spotting red flags</SecHead>
        <P>Most scams share the same warning signs. If you notice any of these, stop and report it before paying anything:</P>
        <Bullets items={RED_FLAGS} />
        <Callout tone="warn" icon="octagon-alert">
          The golden rule: if someone wants to take the deal <B>off Newcondo</B> — off-app payments, off-app chat, cash on site — treat it as a red flag and report it.
        </Callout>
      </DocSection>

      {/* 09 */}
      <DocSection id="contact" label="09 Contact">
        <SecHead n="09">Get help</SecHead>
        <P>Spotted something, or need a hand? Our Trust &amp; Safety team is here.</P>
        <ContactCard items={TRUST_CONTACT} />
        <Callout tone="note" icon="life-buoy" className="mt-6">
          If you or someone else is in immediate danger, contact the emergency services first on <B>112</B> — then report the incident to us so we can act on the account.
        </Callout>
      </DocSection>
    </LegalDoc>
  );
}
