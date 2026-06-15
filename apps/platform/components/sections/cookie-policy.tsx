"use client";

/* ============================================================
   Cookie Policy — content only. Chrome lives in <LegalDoc>.
   ============================================================ */

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
} from "@/components/ui/legal-doc";
import {
  COOKIE_TOC,
  COOKIE_META,
  COOKIE_TYPE_ROWS,
  COOKIE_THIRD_PARTY,
  BROWSER_LINKS,
  COOKIE_CONTACT,
} from "@/lib/cookie-data";

export function CookiePolicy() {
  return (
    <LegalDoc
      eyebrow="Legal · Cookies"
      crumb="Cookie Policy"
      title="Cookie Policy"
      meta={COOKIE_META}
      toc={COOKIE_TOC}
      lead={
        <>
          This policy explains how Newcondo uses cookies and similar technologies — what they do, which ones we set, and
          how you can control them. It sits alongside our <DocLink href="/privacy">Privacy Policy</DocLink>.
        </>
      }
    >
      {/* 01 */}
      <DocSection id="what" label="01 What">
        <SecHead n="01">What cookies are</SecHead>
        <P>
          Cookies are small text files placed on your device when you visit a website or use an app. They let the platform
          remember your actions and preferences — like staying signed in — over a period of time, so you don&apos;t have to
          re-enter them each time. We also use related technologies such as local storage and pixels; we refer to all of
          these as &quot;cookies&quot; in this policy.
        </P>
        <Callout tone="note" icon="cookie">
          Cookies cannot run programs or carry viruses. They simply store small pieces of information that help the platform work.
        </Callout>
      </DocSection>

      {/* 02 */}
      <DocSection id="why" label="02 Why">
        <SecHead n="02">Why we use cookies</SecHead>
        <P>We use cookies to keep the platform secure, functional, and continually improving. Specifically, they help us:</P>
        <Bullets
          items={[
            <><B>Keep you signed in</B> and protect your session from hijacking.</>,
            <><B>Prevent fraud</B> by detecting unusual login, device, or payment behaviour.</>,
            <><B>Remember your preferences</B>, such as saved properties and settings.</>,
            <><B>Measure performance</B> so we can fix problems and improve the experience.</>,
            <><B>Attribute referrals</B> — so the agent whose tracked link brought a paying tenant is paid correctly.</>,
          ]}
        />
      </DocSection>

      {/* 03 */}
      <DocSection id="types" label="03 Types">
        <SecHead n="03">Types of cookies we use</SecHead>
        <P>We group the cookies we set into four categories.</P>
        <DocTable head={["Category", "Purpose", "Typical duration"]} rows={COOKIE_TYPE_ROWS.map(([a, b, c]) => [a, b, <Mono>{c}</Mono>])} />
        <Callout tone="warn" icon="triangle-alert">
          Disabling <B>strictly necessary</B> cookies may stop core features — including sign-in and payments — from working.
        </Callout>
      </DocSection>

      {/* 04 */}
      <DocSection id="third-party" label="04 Third-party">
        <SecHead n="04">Third-party cookies</SecHead>
        <P>
          Some cookies are set by trusted partners who provide services on our behalf. Each receives only what it needs for
          its specific function, under a Data Processing Agreement.
        </P>
        <DocTable head={["Provider", "What their cookies do"]} rows={COOKIE_THIRD_PARTY.map(([a, b]) => [a, b])} />
        <Callout tone="green" icon="lock">
          We never sell your data, and partners may not use their cookies to track you across unrelated sites for advertising. See our <DocLink href="/privacy">Privacy Policy</DocLink> for full detail.
        </Callout>
      </DocSection>

      {/* 05 */}
      <DocSection id="manage" label="05 Manage">
        <SecHead n="05">Managing &amp; disabling cookies</SecHead>
        <P>You are in control. You can manage non-essential cookies through our in-app cookie controls, or directly in your browser:</P>
        <Bullets items={BROWSER_LINKS} />
        <H3>Do Not Track</H3>
        <P>
          Some browsers offer a &quot;Do Not Track&quot; signal. Because there is no common industry standard for how to interpret
          it, the platform does not currently respond to Do Not Track signals — but we limit tracking to the purposes described above regardless.
        </P>
      </DocSection>

      {/* 06 */}
      <DocSection id="changes" label="06 Changes">
        <SecHead n="06">Changes to this policy &amp; contact</SecHead>
        <P>
          We may update this Cookie Policy from time to time. Material changes will be communicated via platform notifications
          or email, with a revised effective date. Questions are welcome.
        </P>
        <ContactCard items={COOKIE_CONTACT} />
        <Callout tone="note" icon="copyright" className="mt-6">
          This Cookie Policy is the intellectual property of NewCondo Ltd, protected under the Nigerian Copyright Act Cap C28 LFN 2004. No reproduction, redistribution, or reuse is permitted without express written consent.
        </Callout>
      </DocSection>
    </LegalDoc>
  );
}
