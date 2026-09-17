"use client";

/* ============================================================
   Data Handling Policy — content only. Chrome lives in <LegalDoc>.

   Sub-processors, Meta platform data, and the authority-request
   policy are imported from lib/privacy-data.ts so this page and
   the Privacy Policy can never contradict each other.
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
import { DH_TOC, DH_META, MINIMIZATION, DH_SECURITY, DH_CONTACT } from "@/lib/data-handling-data";
import { SUBPROCESSOR_ROWS, META_PLATFORM_ROWS, AUTHORITY_POLICIES } from "@/lib/privacy-data";

export function DataHandling() {
  return (
    <LegalDoc
      eyebrow="Legal · Data handling"
      crumb="Data Handling"
      title="Data Handling Policy"
      meta={DH_META}
      toc={DH_TOC}
      lead={
        <>
          This policy documents how Newcondo handles personal data as a data controller — who our sub-processors are,
          how we minimize what we collect, and the process we follow when a public authority requests user data. It
          summarises and supplements our <DocLink href="/privacy">Privacy Policy</DocLink>.
        </>
      }
    >
      {/* 01 */}
      <DocSection id="controller" label="01 Controller">
        <SecHead n="01">Data controller</SecHead>
        <P>
          <B>Newcondo Ltd</B> (RC8445849), a company registered in Nigeria with its registered office at 6 Blessing Val
          Street, Umuagu Umuguma, Owerri-West, Imo State, Nigeria, is the entity responsible for determining the purposes
          and means of processing personal data on the platform. In some jurisdictions this role is called the{" "}
          <B>data controller</B>.
        </P>
        <P>
          Newcondo Ltd is responsible for all personal data received from third-party platforms — including any data
          received through social login — and for the data handling practices described in this policy.
        </P>
        <Callout tone="note" icon="building-2">
          <B>Controller:</B> Newcondo Ltd · <B>Country:</B> Nigeria · <B>Contact:</B>{" "}
          <DocLink href="mailto:info@newcondo.homes">info@newcondo.homes</DocLink>
        </Callout>
      </DocSection>

      {/* 02 */}
      <DocSection id="processors" label="02 Processors">
        <SecHead n="02">Sub-processors &amp; service providers</SecHead>
        <P>
          We use the service providers below to operate the platform. Each acts on our behalf, receives only the data
          needed for its defined function, and is bound by a data processing agreement or equivalent contractual terms.
        </P>
        <DocTable head={["Provider", "Role", "Location"]} rows={SUBPROCESSOR_ROWS.map(([a, b, c]) => [a, b, c])} />
        <Callout tone="note" icon="info">
          This list may change as our infrastructure evolves. We maintain an internal register of sub-processors and update this page when material changes occur.
        </Callout>
      </DocSection>

      {/* 03 */}
      <DocSection id="platform-data" label="03 Platform data">
        <SecHead n="03">Social platform data</SecHead>
        <P>
          Where you choose to sign in using a third-party account — such as <B>Facebook Login</B> — we receive a limited
          set of data from that platform in order to create and authenticate your Newcondo account.
        </P>
        <DocTable head={["Data received", "Why we need it"]} rows={META_PLATFORM_ROWS.map(([a, b]) => [a, b])} />
        <H3>How we use it</H3>
        <Bullets
          items={[
            <><B>Account creation and login —</B> to register you and authenticate future sign-ins.</>,
            <><B>Account security —</B> to detect duplicate or fraudulent account creation.</>,
            <><B>Service communication —</B> to send transactional messages about your account and transactions.</>,
          ]}
        />
        <Callout tone="green" icon="lock">
          We do not use social platform data for advertising, we do not sell it, and we do not share it with third parties except the infrastructure sub-processors listed above. You can disconnect a linked social account or request deletion at any time.
        </Callout>
      </DocSection>

      {/* 04 */}
      <DocSection id="minimization" label="04 Minimization">
        <SecHead n="04">Data minimization</SecHead>
        <P>We collect the least data necessary for each feature to function. In practice this means:</P>
        <Bullets items={MINIMIZATION} />
      </DocSection>

      {/* 05 */}
      <DocSection id="authority-requests" label="05 Authority requests">
        <SecHead n="05">Requests from public authorities</SecHead>
        <P>
          We may receive requests for user data from courts, regulators, or law enforcement. We treat every such request
          as exceptional and apply the following standing policy before any data is disclosed.
        </P>
        <Group stagger={0.08} className="mt-2 grid gap-3.5">
          {AUTHORITY_POLICIES.map((c) => (
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
        <H3>User notification</H3>
        <P>
          Where we are legally permitted to do so, we notify affected users of a request for their data before
          disclosure, so they have an opportunity to seek their own legal advice. We will not notify a user where we are
          prohibited by a court order or where doing so would create a risk to life or an active investigation.
        </P>
        <Callout tone="note" icon="scale">
          Newcondo has <B>not</B> disclosed user personal data to public authorities in response to national security requests.
        </Callout>
      </DocSection>

      {/* 06 */}
      <DocSection id="security" label="06 Security">
        <SecHead n="06">Security controls</SecHead>
        <P>We protect personal data with the following technical and organisational controls:</P>
        <Bullets items={DH_SECURITY} />
        <Callout tone="warn" icon="triangle-alert">
          No method of transmission or storage is completely secure. We apply industry-standard controls but cannot guarantee absolute security against every possible threat.
        </Callout>
      </DocSection>

      {/* 07 */}
      <DocSection id="retention" label="07 Retention">
        <SecHead n="07">Retention &amp; deletion</SecHead>
        <P>
          We retain personal data only for as long as it serves a documented purpose, then delete or de-identify it.
          Retention periods for each data type are set out in our <DocLink href="/privacy#retention">Privacy Policy</DocLink>.
        </P>
        <H3>Deletion requests</H3>
        <P>
          You may request deletion of your account and associated personal data from your account settings, or by writing to{" "}
          <DocLink href="mailto:info@newcondo.homes">info@newcondo.homes</DocLink>. Your account is closed and signed out
          immediately; personal data is erased after a <B>21-day</B> recovery window, and in every case within{" "}
          <B>30 days</B> of a verified request. Certain records must be retained where law, tax, accounting,
          anti-money-laundering, or fraud-prevention obligations require it — including transaction records our payment
          partner is required to keep. Full detail is in <DocLink href="/privacy#deletion">Delete your data</DocLink>.
        </P>
      </DocSection>

      {/* 08 */}
      <DocSection id="cardholder" label="08 Cardholder data">
        <SecHead n="08">Cardholder data &amp; payment security</SecHead>
        <P>
          Newcondo <B>does not collect, process, or store card numbers, CVVs, or full cardholder data</B> on its own
          systems. All card payments are captured and processed directly by our regulated, PCI-DSS-compliant payment
          partner.
        </P>
        <Bullets
          items={[
            <><B>Cardholder privacy undertaking —</B> we undertake to protect the security of cardholder information and not to violate the privacy of any cardholder who transacts through the platform.</>,
            <><B>Strong authentication —</B> card transactions are subject to the additional authentication steps required by the applicable payment scheme, including 3D-Secure where available.</>,
            <><B>Incident notification —</B> we promptly notify our payment partner of any suspected security breach, misuse, irregularity, or suspected fraudulent transaction.</>,
          ]}
        />
      </DocSection>

      {/* 09 */}
      <DocSection id="contact" label="09 Contact">
        <SecHead n="09">Contact</SecHead>
        <P>Questions about this policy, our sub-processors, or a data request? Reach our data protection contact.</P>
        <ContactCard items={DH_CONTACT} />
      </DocSection>
    </LegalDoc>
  );
}
