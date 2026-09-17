/* ============================================================
   app/(links)/data-deletion/[code]/page.tsx

   Public status page behind the URL returned to Meta's Data Deletion Request
   Callback. Meta opens it; so does anyone who deleted via Facebook and wants to
   check we actually did it.

   NO personal data on this page, by design: the URL travels to Meta and is only
   as secret as a cuid. Status, dates, reference. Nothing else.

   Chrome comes from <LegalDoc>, same as every other policy page. All seven of
   its props are required — eyebrow, crumb, title, lead, meta, toc, children.
   ============================================================ */

import type { Metadata } from "next";
import {
  LegalDoc,
  DocSection,
  SecHead,
  P,
  B,
  DocLink,
  Bullets,
  Callout,
  type MetaChip,
  type TocItem,
} from "@/components/ui/legal-doc";

export const metadata: Metadata = {
  title: "Data deletion status — Newcondo",
  robots: { index: false, follow: false },
};

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://api.newcondo.homes/api/v1";

type Status = "PENDING" | "CANCELLED" | "ANONYMIZED" | "PURGED" | "BLOCKED";

const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) : "—";

const TOC: TocItem[] = [{ id: "status", n: "01", label: "Request status" }];

const COPY: Record<Status, { title: string; body: string; chip: string; green?: boolean }> = {
  PENDING: {
    title: "Deletion in progress",
    chip: "In progress",
    body: "The account has been closed and signed out, and its listings are no longer shown. Personal data is permanently erased on the date below — the delay is a recovery window in case the request was not made by the account holder.",
  },
  ANONYMIZED: {
    title: "Data deleted",
    chip: "Completed",
    green: true,
    body: "Personal data has been permanently erased: name, email address, phone number, date of birth, address, identity documents, and any linked Facebook or Google sign-in. Financial records required by tax and anti-money-laundering law are retained without anything that identifies a person.",
  },
  PURGED: {
    title: "Deletion complete",
    chip: "Completed",
    green: true,
    body: "Everything that could be deleted has been deleted.",
  },
  CANCELLED: {
    title: "Deletion cancelled",
    chip: "Cancelled",
    body: "The account holder signed in during the recovery window and restored the account. No data was erased.",
  },
  BLOCKED: {
    title: "Deletion pending an open obligation",
    chip: "On hold",
    body: "The request was received but cannot complete while money is still held, a tenancy is active, or a dispute is open. It completes automatically once those close.",
  },
};

export default async function DataDeletionStatusPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const res = await fetch(`${API}/data-deletion/${code}`, { cache: "no-store" }).catch(() => null);
  const json = res && res.ok ? await res.json() : null;
  const d = json?.data as
    | { status: Status; requestedAt: string; erasureDue: string; erasedAt: string | null; finalPurgeDue: string | null }
    | undefined;

  if (!d) {
    const notFoundMeta: MetaChip[] = [{ icon: "search-x", label: "", value: "Reference not found" }];
    return (
      <LegalDoc
        eyebrow="Data deletion"
        crumb="Data deletion status"
        title="Reference not found"
        lead="We couldn't find a deletion request with that reference."
        meta={notFoundMeta}
        toc={TOC}
      >
        <DocSection id="status" label="01 Status">
          <SecHead n="01">Request status</SecHead>
          <P>
            We have no deletion request under the reference <B>{code}</B>. Check the link, or email{" "}
            <DocLink href="mailto:info@newcondo.homes">info@newcondo.homes</DocLink> from the address on the account.
          </P>
          <P>
            What we keep after a deletion, and why, is set out in our{" "}
            <DocLink href="/privacy#deletion">Privacy Policy §13</DocLink>.
          </P>
        </DocSection>
      </LegalDoc>
    );
  }

  const c = COPY[d.status];
  const done = d.status === "ANONYMIZED" || d.status === "PURGED";
  const meta: MetaChip[] = [
    { icon: done ? "shield-check" : "clock", label: "", value: c.chip, green: c.green },
    { icon: "hash", label: "Reference", value: code },
  ];

  return (
    <LegalDoc
      eyebrow="Data deletion"
      crumb="Data deletion status"
      title={c.title}
      lead={c.body}
      meta={meta}
      toc={TOC}
    >
      <DocSection id="status" label="01 Status">
        <SecHead n="01">Request status</SecHead>
        <Bullets
          items={[
            <>
              <B>Reference —</B> {code}
            </>,
            <>
              <B>Request received —</B> {fmt(d.requestedAt)}
            </>,
            done ? (
              <>
                <B>Personal data erased —</B> {fmt(d.erasedAt)}
              </>
            ) : (
              <>
                <B>Scheduled erasure —</B> {fmt(d.erasureDue)}
              </>
            ),
            <>
              <B>Retained records destroyed —</B> {fmt(d.finalPurgeDue)}
            </>,
          ]}
        />
        <Callout tone="note" icon="archive">
          Some records must be retained after deletion where law, tax, accounting, anti-money-laundering, or
          fraud-prevention obligations require it. These carry nothing that identifies a person, are isolated from active
          systems, and are deleted at the end of their statutory period.
        </Callout>
        <P>
          Full detail is in our <DocLink href="/privacy#deletion">Privacy Policy §13</DocLink> and{" "}
          <DocLink href="/data-handling#retention">Data Handling Policy §07</DocLink>. Questions about this request:{" "}
          <DocLink href="mailto:info@newcondo.homes">info@newcondo.homes</DocLink>.
        </P>
      </DocSection>
    </LegalDoc>
  );
}
