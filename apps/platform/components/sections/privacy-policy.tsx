"use client";

/* ============================================================
   Privacy Policy — content only. Chrome (TOC, scrollspy,
   header, nav/footer) lives in <LegalDoc>.
   ============================================================ */

import { Icon } from "@/components/ui/icon";
import { Reveal, Group, Item, vFade, vRow } from "@/components/motion";
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
  Mono,
  Callout,
  ContactCard,
  html,
} from "@/components/ui/legal-doc";
import {
  PRIVACY_TOC,
  META_CHIPS,
  CLAUSES,
  COLLECT_ROWS,
  COOKIE_ROWS,
  RETENTION_ROWS,
  SAFEGUARD_ROWS,
  ACKNOWLEDGMENTS,
  CONTACT_ITEMS,
} from "@/lib/privacy-data";

export function PrivacyPolicy() {
  return (
    <LegalDoc
      eyebrow="Legal · Data protection"
      crumb="Privacy Policy"
      title="Privacy Policy"
      meta={META_CHIPS}
      toc={PRIVACY_TOC}
      lead={
        <>
          This policy explains what personal data Newcondo collects, why we collect it, how we protect it, and the
          rights you have over it — for every renter, property owner, agent, and visitor on the platform.
        </>
      }
    >
      {/* 01 */}
      <DocSection id="scope" label="01 Scope">
        <SecHead n="01">Scope &amp; legal terms</SecHead>
        <P>
          This Privacy Policy governs the collection, use, and protection of data by <B>NewCondo Ltd</B>{" "}
          (&quot;NewCondo&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) across our platform. It applies to all user classes — Renters,
          Property Owners, Agents, and Visitors. By accessing or using the platform, you agree to the following legally binding clauses.
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
      </DocSection>

      {/* 02 */}
      <DocSection id="collect" label="02 Collect">
        <SecHead n="02">Information we collect</SecHead>
        <P>
          We collect only what each user class needs to verify identity, prove ownership, process payments, and keep listings honest.
          We collect data in three ways: information <B>you give us</B>, information collected <B>automatically</B> when you use the
          platform, and information from <B>authorized third parties</B> (government verification APIs, payment processors).
        </P>
        <H3>Data collected, by user class</H3>
        <DocTable head={["User class", "What we collect"]} rows={COLLECT_ROWS.map(([a, b]) => [a, b])} />
        <H3>Information collected automatically</H3>
        <P>
          When you use the platform we automatically record device and usage information — IP address, browser and device type, pages
          viewed, and the links you arrive from (including an agent&apos;s tracked promotion link). This supports security, fraud detection,
          and attribution of which agent introduced a paying tenant. See <DocLink href="#cookies">Cookies &amp; tracking</DocLink> for detail.
        </P>
        <H3>Technical safeguards applied at collection</H3>
        <Bullets
          items={[
            <><B>Hashing —</B> personally identifiable information such as names and IDs is irreversibly converted into SHA-256 hash strings within 72 hours of collection.</>,
            <><B>Tokenization —</B> bank details are replaced with obfuscated tokens (e.g. <Mono>TXT-XXXX</Mono>) post-transaction to prevent reuse or replay attacks.</>,
            <><B>k-Anonymity (geo) —</B> location data is generalized to a 1-kilometre radius to prevent individual property tracing.</>,
            <><B>Backup scrubbing —</B> raw user data is erased from system backups within 30 days, validated by external auditors (PwC Nigeria).</>,
          ]}
        />
      </DocSection>

      {/* 03 */}
      <DocSection id="use" label="03 Use">
        <SecHead n="03">How we use your information</SecHead>
        <H3>Permitted uses</H3>
        <Bullets
          items={[
            "Identity and property verification via authorized government APIs (e.g. e-GIS portals).",
            "Financial processing via secure, PCI-DSS-compliant payment providers (e.g. Flutterwave).",
            "Pattern-based fraud detection through event tracking and behavioural analytics.",
          ]}
        />
        <H3>Explicit prohibitions</H3>
        <Bullets
          items={[
            "No use of personal data for marketing without your explicit opt-in.",
            "No sharing of your data with marketplace service providers.",
          ]}
        />
        <Callout tone="green" icon="lock">
          We never sell your personal data. Verification and payment partners receive only the minimum data needed to perform their specific task, under a binding agreement.
        </Callout>
      </DocSection>

      {/* 04 */}
      <DocSection id="share" label="04 Share">
        <SecHead n="04">How we share information</SecHead>
        <P>
          We share data only where it is necessary to deliver the platform and only with the categories of recipient below. Each receives the
          minimum data required for a defined purpose, under a Data Processing Agreement.
        </P>
        <Bullets
          items={[
            <><B>Government verification APIs —</B> to confirm identity and proof of ownership (e.g. e-GIS, NIN/BVN checks).</>,
            <><B>Payment processors —</B> PCI-DSS-compliant providers such as Flutterwave, to collect rent into virtual accounts and process payouts and refunds.</>,
            <><B>Professional auditors —</B> PwC Nigeria and KPMG, for backup scrubbing validation and SOC 2 audits, under confidentiality.</>,
            <><B>Regulators &amp; law enforcement —</B> only where legally compelled. See <DocLink href="#safeguards">Forced data disclosure</DocLink> below.</>,
          ]}
        />
        <Callout tone="note" icon="info">
          Between platform users, only the information needed to complete a rental is shared — for example, an owner sees a tenant&apos;s verification status, not their underlying ID documents.
        </Callout>
      </DocSection>

      {/* 05 */}
      <DocSection id="cookies" label="05 Cookies">
        <SecHead n="05">Cookies &amp; tracking technologies</SecHead>
        <P>
          We use cookies and similar technologies to keep you signed in, remember your preferences, measure performance, and — critically —
          attribute which agent&apos;s tracked link brought a paying tenant. We group them as follows.
        </P>
        <DocTable head={["Category", "Purpose"]} rows={COOKIE_ROWS.map(([a, b]) => [a, b])} />
        <P>
          You can control non-essential cookies through your browser settings or our in-app cookie controls. Disabling strictly necessary
          cookies may stop core features — including sign-in and payments — from working.
        </P>
      </DocSection>

      {/* 06 */}
      <DocSection id="security" label="06 Security">
        <SecHead n="06">Security framework &amp; breach response</SecHead>
        <Bullets
          items={[
            <><B>Encryption —</B> AES-256 for data at rest, and TLS 1.3 for all transmission channels.</>,
            <><B>Access management —</B> role-based access with periodic audits and automatic expiry of dormant privileges.</>,
          ]}
        />
        <H3>Breach notification process</H3>
        <Bullets
          items={[
            <>Notify the <B>NDPC</B> within 48 hours of a verified breach.</>,
            "Initiate a forensic audit within 72 hours.",
            "Directly notify affected users for high-risk incidents.",
          ]}
        />
        <Callout tone="warn" icon="triangle-alert">
          No method of transmission or storage is ever 100% secure. We protect your data with industry-standard controls, but cannot guarantee absolute security against every possible threat.
        </Callout>
      </DocSection>

      {/* 07 */}
      <DocSection id="retention" label="07 Retention">
        <SecHead n="07">Data retention &amp; deletion</SecHead>
        <P>We keep each type of data only for as long as it serves a verified purpose, then sanitize it on the schedule below.</P>
        <DocTable
          head={["Data type", "Retention", "After retention"]}
          rows={RETENTION_ROWS.map(([a, b, c]) => [a, <Mono>{b}</Mono>, html(c)])}
        />
        <Callout tone="note" icon="file-check">
          All deletions follow <B>NIST SP 800-88 Rev. 1</B> data sanitization guidelines.
        </Callout>
      </DocSection>

      {/* 08 */}
      <DocSection id="transfers" label="08 Transfers">
        <SecHead n="08">International data transfers</SecHead>
        <P>
          Newcondo is operated from Nigeria and your data is primarily stored and processed here. Some of our verification, payment, and
          infrastructure partners may process data outside Nigeria. Where that happens, we only transfer data to providers that offer an
          adequate level of protection, and we put contractual safeguards in place as required by the <B>Nigeria Data Protection Act (NDPA)</B> and NDPC guidance.
        </P>
        <P>By using the platform, you understand that your data may be processed in another jurisdiction strictly for the purposes described in this policy.</P>
      </DocSection>

      {/* 09 */}
      <DocSection id="rights" label="09 Rights">
        <SecHead n="09">Your rights &amp; choices</SecHead>
        <P>Under the Nigeria Data Protection Act (NDPA), you may invoke the following rights:</P>
        <Bullets
          items={[
            <><B>Access, correction, and erasure</B> of your data.</>,
            <><B>Objection</B> to non-essential data processing.</>,
            <><B>Withdrawal of consent</B> for marketing or other optional processing, at any time.</>,
          ]}
        />
        <H3>How to exercise your rights</H3>
        <P>
          Submit a request to <DocLink href="mailto:info@newcondo.homes">info@newcondo.homes</DocLink>. We respond within <B>30 days</B>.
          We may first need to verify your identity to protect your account, and some data must be retained where the law or fraud-prevention requires it.
        </P>
        <Callout tone="note" icon="info">
          To protect your account, we may decline requests that are clearly frivolous, malicious, or fraudulent, or ask you to verify your identity before we act.
        </Callout>
      </DocSection>

      {/* 10 */}
      <DocSection id="children" label="10 Children">
        <SecHead n="10">Children&apos;s privacy</SecHead>
        <P>
          Newcondo is a financial and property platform intended only for adults aged <B>18 and over</B>. We do not knowingly collect personal
          data from anyone under 18. If you believe a minor has provided us with personal data, contact{" "}
          <DocLink href="mailto:info@newcondo.homes">info@newcondo.homes</DocLink> and we will delete it promptly.
        </P>
      </DocSection>

      {/* 11 */}
      <DocSection id="safeguards" label="11 Safeguards">
        <SecHead n="11">Risk mitigation &amp; safeguards</SecHead>
        <P>We map the most common ways data is misused in the rental market to a specific, enforceable countermeasure.</P>
        <DocTable head={["Risk / loophole", "Mitigation strategy"]} rows={SAFEGUARD_ROWS.map(([a, b]) => [a, html(b)])} />
      </DocSection>

      {/* 12 */}
      <DocSection id="governance" label="12 Governance">
        <SecHead n="12">Governance, audits &amp; policy updates</SecHead>
        <Bullets
          items={[
            <><B>Third-party certifications —</B> annual SOC 2 Type II by KPMG.</>,
            <><B>ISO 27001 —</B> implementation targeted for Q4 2026.</>,
            <><B>DPAs &amp; legal assurance —</B> enforceable Data Processing Agreements with all financial and hosting partners.</>,
            <><B>Dispute resolution —</B> all user disputes are resolved via confidential arbitration seated in Owerri, Imo State.</>,
          ]}
        />
        <H3>Changes to this policy</H3>
        <P>
          We communicate all changes at least <B>3 days in advance</B> via platform banners or email. Continued use of the platform after an
          update takes effect constitutes acceptance of the revised policy. We encourage you to review this page periodically.
        </P>
      </DocSection>

      {/* 13 */}
      <DocSection id="acknowledgments" label="13 Acknowledgments">
        <SecHead n="13">Your acknowledgments</SecHead>
        <P>Upon account registration or use, all users affirm the following declarations:</P>
        <Group stagger={0.07} className="mt-2 grid gap-3">
          {ACKNOWLEDGMENTS.map((a, i) => (
            <Item key={i} variants={vRow} className="flex items-center gap-3.5 rounded-[16px] border border-border-hair bg-surface px-[22px] py-[18px]">
              <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-full bg-green-wash text-green-dark">
                <Icon name="check" size={17} />
              </span>
              <p className="m-0 text-[15.5px] font-medium leading-[1.5] text-text-primary">{a}</p>
            </Item>
          ))}
        </Group>
      </DocSection>

      {/* 14 */}
      <DocSection id="contact" label="14 Contact">
        <SecHead n="14">Contact us</SecHead>
        <P>Questions about this policy, or want to exercise a data right? Reach our data protection team.</P>
        <ContactCard items={CONTACT_ITEMS} />
        <Callout tone="note" icon="copyright" className="mt-6">
          This Privacy Policy is the intellectual property of NewCondo Ltd, protected under the Nigerian Copyright Act Cap C28 LFN 2004. No reproduction, redistribution, or reuse is permitted without express written consent.
        </Callout>
      </DocSection>
    </LegalDoc>
  );
}
