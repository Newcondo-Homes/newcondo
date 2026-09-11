"use client";

/* ============================================================
   Privacy Policy — content only. Chrome (TOC, scrollspy,
   header, nav/footer) lives in <LegalDoc>.

   Section order MUST match PRIVACY_TOC in lib/privacy-data.ts.
   ============================================================ */

import { Icon } from "@/components/ui/icon";
import { Group, Item, vFade, vRow } from "@/components/motion";
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
  NUTRITION_ROWS,
  SUBPROCESSOR_ROWS,
  META_PLATFORM_ROWS,
  AUTHORITY_POLICIES,
  COOKIE_ROWS,
  RETENTION_ROWS,
  SAFEGUARD_ROWS,
  ACKNOWLEDGMENTS,
  CONTACT_ITEMS,
} from "@/lib/privacy-data";

/* icon + title + body card, reused for clauses and policy grids */
function CardGrid({ items }: { items: { icon: string; title: string; body: string }[] }) {
  return (
    <Group stagger={0.08} className="mt-2 grid gap-3.5">
      {items.map((c) => (
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
  );
}

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
          This Privacy Policy governs the collection, use, and protection of data by <B>Newcondo Ltd</B> (&quot;Newcondo&quot;,
          &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) across our platform. It applies to all user classes — Renters, Property Owners,
          Agents, and Visitors. By accessing or using the platform, you agree to the following legally binding clauses.
        </P>
        <Callout tone="note" icon="building-2">
          <B>Data controller:</B> Newcondo Ltd (RC8445849), 6 Blessing Val Street, Umuagu Umuguma, Owerri-West, Imo State,
          Nigeria. Newcondo Ltd determines the purposes and means of processing personal data on the platform, and is
          responsible for all data described in this policy.
        </Callout>
        <CardGrid items={CLAUSES} />
      </DocSection>

      {/* 02 */}
      <DocSection id="collect" label="02 Collect">
        <SecHead n="02">Information we collect</SecHead>
        <P>
          We collect only what each user class needs to verify identity, prove ownership, process payments, and keep listings
          honest. We collect data in three ways: information <B>you give us</B>, information collected <B>automatically</B> when
          you use the platform, and information from <B>authorized third parties</B> (government verification APIs, payment
          processors, and social login providers).
        </P>

        <H3>Categories of data we collect</H3>
        <P>This summary &quot;label&quot; sets out, at a glance, the categories of personal data we process and why.</P>
        <DocTable head={["Category", "Examples", "Purpose"]} rows={NUTRITION_ROWS.map(([a, b, c]) => [a, b, c])} />
        <Callout tone="note" icon="image">
          Property media — exterior, interior, and compound photos, plus videos and uploaded documents — is treated as personal data and processed only for listings, verification, and platform security.
        </Callout>

        <H3>Data collected, by user class</H3>
        <DocTable head={["User class", "What we collect"]} rows={COLLECT_ROWS.map(([a, b]) => [a, b])} />

        <H3>Information collected automatically</H3>
        <P>
          When you use the platform we automatically record device and usage information — IP address, browser and device type,
          pages viewed, and the links you arrive from (including an agent&apos;s tracked promotion link). This supports security,
          fraud detection, and attribution of which agent introduced a paying tenant. See{" "}
          <DocLink href="#cookies">Cookies &amp; tracking</DocLink> for detail.
        </P>

        <H3>Technical safeguards applied at collection</H3>
        <Bullets
          items={[
            <><B>Hashing —</B> personally identifiable information such as names and IDs is irreversibly converted into SHA-256 hash strings within 72 hours of collection.</>,
            <><B>Tokenization —</B> bank details are replaced with obfuscated tokens (e.g. <Mono>TXT-XXXX</Mono>) post-transaction to prevent reuse or replay attacks.</>,
            <><B>Geo-generalization —</B> where appropriate, location data is generalized to a wider radius to reduce the risk of tracing an individual property.</>,
            <><B>Backup scrubbing —</B> raw user data is erased from system backups within 30 days, as part of our data-retention controls.</>,
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
            "Account creation, authentication, and transactional communication.",
          ]}
        />
        <H3>Explicit prohibitions</H3>
        <Bullets
          items={[
            "No use of personal data for marketing without your explicit opt-in.",
            "No sharing of your data with marketplace service providers.",
            "No sale of personal data, ever.",
          ]}
        />
        <Callout tone="green" icon="lock">
          We never sell your personal data. Verification and payment partners receive only the minimum data needed to perform their specific task, under a binding agreement.
        </Callout>
      </DocSection>

      {/* 04 */}
      <DocSection id="ai" label="04 AI">
        <SecHead n="04">AI &amp; automated systems</SecHead>
        <P>
          Newcondo may use artificial intelligence technologies provided by third-party providers — including OpenAI, Google
          Gemini, and similar systems — to assist with customer support, listing moderation, document review, fraud detection,
          recommendation systems, search functionality, and platform improvement.
        </P>
        <P>
          Information submitted to AI-powered features may be processed by these providers solely for the purpose of providing
          the requested services. AI-generated outputs may contain inaccuracies and should not be relied upon as legal,
          financial, surveying, valuation, engineering, or professional advice.
        </P>
        <H3>Automated systems</H3>
        <P>
          Certain platform decisions may be assisted by automated systems — including fraud detection, listing verification,
          recommendation systems, spam detection, abuse prevention, and risk monitoring. Significant enforcement actions may be
          subject to human review where appropriate.
        </P>
      </DocSection>

      {/* 05 */}
      <DocSection id="share" label="05 Share">
        <SecHead n="05">How we share information</SecHead>
        <P>
          We share data only where it is necessary to deliver the platform and only with the categories of recipient below. Each
          receives the minimum data required for a defined purpose, under a Data Processing Agreement.
        </P>
        <Bullets
          items={[
            <><B>Government verification APIs —</B> to confirm identity and proof of ownership (e.g. e-GIS, NIN/BVN checks).</>,
            <><B>Payment processors —</B> see <DocLink href="#payments">Payment &amp; cardholder data</DocLink>.</>,
            <><B>Service providers —</B> see <DocLink href="#processors">Service providers &amp; processors</DocLink> for our full sub-processor list.</>,
            <><B>AI providers —</B> see <DocLink href="#ai">AI &amp; automated systems</DocLink>.</>,
            <><B>Regulators &amp; law enforcement —</B> only where legally compelled. See <DocLink href="#authorities">Government &amp; legal requests</DocLink>.</>,
          ]}
        />
        <Callout tone="note" icon="info">
          Between platform users, only the information needed to complete a rental is shared — for example, an owner sees a tenant&apos;s verification status, not their underlying ID documents.
        </Callout>
      </DocSection>

      {/* 06 */}
      <DocSection id="processors" label="06 Processors">
        <SecHead n="06">Service providers &amp; processors</SecHead>
        <P>
          We use the service providers below to operate the platform. Each acts on our behalf as a data processor, receives only
          the data needed for its defined function, and is bound by a data processing agreement or equivalent contractual terms.
        </P>
        <DocTable head={["Provider", "Role", "Location"]} rows={SUBPROCESSOR_ROWS.map(([a, b, c]) => [a, b, c])} />
        <Callout tone="note" icon="info">
          This list may change as our infrastructure evolves. We maintain an internal sub-processor register and update this page when material changes occur.
        </Callout>
      </DocSection>

      {/* 07 */}
      <DocSection id="social-login" label="07 Social login">
        <SecHead n="07">Facebook &amp; social login</SecHead>
        <P>
          If you choose to sign in with a third-party account — such as <B>Facebook Login</B> or Google — we receive a limited
          set of data from that platform in order to create and authenticate your Newcondo account.
        </P>
        <DocTable head={["Data received", "Why we need it"]} rows={META_PLATFORM_ROWS.map(([a, b]) => [a, b])} />
        <H3>What we do not do</H3>
        <Bullets
          items={[
            "We do not post anything to your social account or act on your behalf.",
            "We do not use social login data for advertising or ad targeting.",
            "We do not sell social login data, or share it beyond the processors listed above.",
            "We do not request permissions beyond basic profile and email.",
          ]}
        />
        <Callout tone="green" icon="unlink">
          You can disconnect a linked social account at any time from your account settings, or request deletion of the data we received — see <DocLink href="#deletion">Delete your data</DocLink>.
        </Callout>
      </DocSection>

      {/* 08 */}
      <DocSection id="payments" label="08 Payments">
        <SecHead n="08">Payment &amp; cardholder data</SecHead>
        <P>
          Newcondo uses regulated third-party payment providers, including <B>Flutterwave Technology Solutions Limited</B>, to
          facilitate payments, virtual account creation, refunds, payouts, fraud prevention, transaction verification, and
          compliance obligations. Information necessary to complete a transaction may be shared with such providers.
        </P>
        <Callout tone="green" icon="credit-card">
          Newcondo does <B>not</B> collect, process, or store card numbers, CVVs, or full cardholder data on its own systems. Card details are captured directly by our PCI-DSS-compliant payment partner.
        </Callout>
        <H3>Our cardholder commitments</H3>
        <Bullets
          items={[
            <><B>Cardholder privacy undertaking —</B> we undertake to protect the security of cardholder information and not to violate the privacy of any cardholder who transacts through the platform.</>,
            <><B>Strong authentication —</B> card transactions are subject to the additional authentication steps required by the applicable payment scheme, including 3D-Secure where available.</>,
            <><B>Incident notification —</B> we promptly notify our payment partner of any suspected security breach, misuse, irregularity, or suspected fraudulent transaction.</>,
            <><B>Record keeping —</B> transaction records are retained as required by law and by our payment partner&apos;s regulatory obligations, even after account closure.</>,
          ]}
        />
      </DocSection>

      {/* 09 */}
      <DocSection id="location" label="09 Location">
        <SecHead n="09">Location &amp; mapping data</SecHead>
        <H3>Property geospatial data</H3>
        <P>Newcondo may collect, generate, process, and store property geospatial information, including:</P>
        <Bullets
          items={[
            "GPS coordinates",
            "Property boundaries and polygons",
            "Satellite mapping information",
            "Location metadata",
            "Geospatial verification records",
          ]}
        />
        <P>
          Such information is used for property verification, duplicate-listing prevention, fraud prevention,
          property-management functionality, navigation, and platform security.
        </P>
        <H3>Mapping &amp; location services</H3>
        <P>
          Certain location-based features — property locations, navigation, address verification, and property-boundary
          visualization — are provided through the <B>Google Maps Platform</B> and related Google services. Your use of these
          features may also be subject to Google&apos;s applicable terms and privacy policies.
        </P>
      </DocSection>

      {/* 10 */}
      <DocSection id="cookies" label="10 Cookies">
        <SecHead n="10">Cookies &amp; tracking technologies</SecHead>
        <P>
          We use cookies and similar technologies to keep you signed in, remember your preferences, measure performance, and —
          critically — attribute which agent&apos;s tracked link brought a paying tenant. We group them as follows.
        </P>
        <DocTable head={["Category", "Purpose"]} rows={COOKIE_ROWS.map(([a, b]) => [a, b])} />
        <P>
          You can control non-essential cookies through your browser settings or our in-app cookie controls. Disabling strictly
          necessary cookies may stop core features — including sign-in and payments — from working. Full detail is in our{" "}
          <DocLink href="/cookies">Cookie Policy</DocLink>.
        </P>
      </DocSection>

      {/* 11 */}
      <DocSection id="security" label="11 Security">
        <SecHead n="11">Security framework &amp; breach response</SecHead>
        <Bullets
          items={[
            <><B>Encryption —</B> AES-256 for data at rest, and TLS 1.3 for all transmission channels.</>,
            <><B>Access management —</B> role-based access, granted on a need-to-know basis, with periodic audits and automatic expiry of dormant privileges.</>,
            <><B>Logging —</B> access and administrative actions are logged for audit purposes.</>,
          ]}
        />
        <H3>Breach notification process</H3>
        <Bullets
          items={[
            <>Notify the <B>NDPC</B> within 48 hours of a verified breach.</>,
            "Initiate a forensic audit within 72 hours.",
            "Directly notify affected users for high-risk incidents.",
            <>Promptly notify our <B>payment partner</B> of any suspected security breach, misuse, irregularity, or suspected fraudulent transaction that may involve payment data.</>,
          ]}
        />
        <Callout tone="warn" icon="triangle-alert">
          No method of transmission or storage is ever 100% secure. We protect your data with industry-standard controls, but cannot guarantee absolute security against every possible threat.
        </Callout>
      </DocSection>

      {/* 12 */}
      <DocSection id="retention" label="12 Retention">
        <SecHead n="12">Data retention</SecHead>
        <P>We keep each type of data only for as long as it serves a verified purpose, then sanitize it on the schedule below.</P>
        <DocTable
          head={["Data type", "Retention", "After retention"]}
          rows={RETENTION_ROWS.map(([a, b, c]) => [a, <Mono>{b}</Mono>, html(c)])}
        />
        <Callout tone="note" icon="file-check">
          All deletions follow <B>NIST SP 800-88 Rev. 1</B> data sanitization guidelines.
        </Callout>
      </DocSection>

      {/* 13 */}
      <DocSection id="deletion" label="13 Deletion">
        <SecHead n="13">Delete your data</SecHead>
        <P>
          You can ask us to delete your account and the personal data associated with it at any time. There are two ways to do
          this:
        </P>
        <Bullets
          items={[
            <><B>In the app —</B> open your account settings and choose to delete your account.</>,
            <><B>By email —</B> write to <DocLink href="mailto:info@newcondo.homes">info@newcondo.homes</DocLink> from the address on your account, with the subject &quot;Data deletion request&quot;.</>,
          ]}
        />
        <H3>What happens next</H3>
        <Bullets
          items={[
            "We verify the request came from you, to protect your account.",
            <>We delete or de-identify your personal data within <B>30 days</B>, including any data received through social login.</>,
            "We confirm completion by email.",
          ]}
        />
        <Callout tone="note" icon="archive">
          Some records must be retained after deletion where law, tax, accounting, anti-money-laundering, or fraud-prevention obligations require it — including transaction records our payment partner is legally required to keep. These are isolated from active systems and deleted at the end of their statutory period.
        </Callout>
      </DocSection>

      {/* 14 */}
      <DocSection id="transfers" label="14 Transfers">
        <SecHead n="14">International data transfers</SecHead>
        <P>
          Newcondo is operated from Nigeria and your data is primarily stored and processed here. Some of our verification,
          payment, hosting, and infrastructure partners may process data outside Nigeria — as noted in the{" "}
          <DocLink href="#processors">sub-processor table</DocLink>. Where that happens, we only transfer data to providers that
          offer an adequate level of protection, and we put contractual safeguards in place as required by the{" "}
          <B>Nigeria Data Protection Act (NDPA)</B> and NDPC guidance.
        </P>
        <P>
          By using the platform, you understand that your data may be processed in another jurisdiction strictly for the
          purposes described in this policy.
        </P>
      </DocSection>

      {/* 15 */}
      <DocSection id="rights" label="15 Rights">
        <SecHead n="15">Your rights &amp; choices</SecHead>
        <P>Under the Nigeria Data Protection Act (NDPA), you may invoke the following rights:</P>
        <Bullets
          items={[
            <><B>Access, correction, and erasure</B> of your data.</>,
            <><B>Objection</B> to non-essential data processing.</>,
            <><B>Withdrawal of consent</B> for marketing or other optional processing, at any time.</>,
            <><B>Data portability</B> — a copy of the data you provided, in a usable format.</>,
          ]}
        />
        <H3>How to exercise your rights</H3>
        <P>
          Submit a request to <DocLink href="mailto:info@newcondo.homes">info@newcondo.homes</DocLink>. We acknowledge enquiries
          within <B>one business day</B> and respond substantively within <B>30 days</B>. We may first need to verify your
          identity to protect your account, and some data must be retained where the law or fraud-prevention requires it.
        </P>
        <Callout tone="note" icon="info">
          To protect your account, we may decline requests that are clearly frivolous, malicious, or fraudulent, or ask you to verify your identity before we act.
        </Callout>
      </DocSection>

      {/* 16 */}
      <DocSection id="authorities" label="16 Authorities">
        <SecHead n="16">Government &amp; legal requests</SecHead>
        <P>
          We may receive requests for user data from courts, regulators, or law enforcement. We treat every such request as
          exceptional and apply the following standing policy before any data is disclosed.
        </P>
        <CardGrid items={AUTHORITY_POLICIES} />
        <H3>User notification</H3>
        <P>
          Where we are legally permitted to do so, we notify affected users of a request for their data before disclosure, so
          they have an opportunity to seek their own legal advice. We will not notify a user where we are prohibited by a court
          order or judicial gag order, or where doing so would create a risk to life or to an active investigation.
        </P>
        <Callout tone="note" icon="scale">
          Newcondo has <B>not</B> disclosed user personal data to public authorities in response to national security requests.
        </Callout>
      </DocSection>

      {/* 17 */}
      <DocSection id="children" label="17 Children">
        <SecHead n="17">Children&apos;s privacy</SecHead>
        <P>
          Newcondo is a financial and property platform intended only for adults aged <B>18 and over</B>. We do not knowingly
          collect personal data from anyone under 18. If you believe a minor has provided us with personal data, contact{" "}
          <DocLink href="mailto:info@newcondo.homes">info@newcondo.homes</DocLink> and we will delete it promptly.
        </P>
      </DocSection>

      {/* 18 */}
      <DocSection id="safeguards" label="18 Safeguards">
        <SecHead n="18">Risk mitigation &amp; safeguards</SecHead>
        <P>We map the most common ways data is misused in the rental market to a specific, enforceable countermeasure.</P>
        <DocTable head={["Risk / loophole", "Mitigation strategy"]} rows={SAFEGUARD_ROWS.map(([a, b]) => [a, html(b)])} />
      </DocSection>

      {/* 19 */}
      <DocSection id="governance" label="19 Governance">
        <SecHead n="19">Governance, audits &amp; policy updates</SecHead>
        <Bullets
          items={[
            <><B>Security reviews —</B> we carry out regular internal security and data-protection reviews of our systems and partners.</>,
            <><B>Recognised standards —</B> our controls are designed around recognised security frameworks, with formal certifications pursued as we scale.</>,
            <><B>DPAs &amp; legal assurance —</B> enforceable Data Processing Agreements with all financial and hosting partners.</>,
            <><B>Dispute resolution —</B> all user disputes are resolved via confidential arbitration seated in Owerri, Imo State.</>,
          ]}
        />
        <H3>Changes to this policy</H3>
        <P>
          We communicate all changes at least <B>3 days in advance</B> via platform banners or email. Continued use of the
          platform after an update takes effect constitutes acceptance of the revised policy. We encourage you to review this
          page periodically.
        </P>
      </DocSection>

      {/* 20 */}
      <DocSection id="acknowledgments" label="20 Acknowledgments">
        <SecHead n="20">Your acknowledgments</SecHead>
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

      {/* 21 */}
      <DocSection id="contact" label="21 Contact">
        <SecHead n="21">Contact us</SecHead>
        <P>Questions about this policy, or want to exercise a data right? Reach our data protection team.</P>
        <ContactCard items={CONTACT_ITEMS} />
        <Callout tone="note" icon="copyright" className="mt-6">
          This Privacy Policy is the intellectual property of Newcondo Ltd, protected under the Nigerian Copyright Act Cap C28 LFN 2004. No reproduction, redistribution, or reuse is permitted without express written consent.
        </Callout>
      </DocSection>
    </LegalDoc>
  );
}
