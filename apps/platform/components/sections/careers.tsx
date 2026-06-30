"use client";

/* ============================================================
   Careers — brand page with an open-roles list.

   The roles list is wired to render from a `roles` state. Right
   now it's seeded with DUMMY DATA (OPEN_ROLES from lib/careers-data).

   >>> WHEN YOUR BACKEND IS READY <<<
   1. Uncomment the fetchOpenRoles() helper and the useEffect below.
   2. Set the initial useState to [] (empty) instead of OPEN_ROLES.
   3. Point API_ENDPOINT at your real endpoint.
   The Role shape (id, title, team, location, type) is all the UI
   needs — return that from your API and nothing else changes.
   ============================================================ */

import { useState /*, useEffect */ } from "react";
import { Navbar } from "@/components/sections/navbar";
import { ChatButton } from "@/components/chat-button";
import { Section } from "@/components/ui/section";
import { SectionHead } from "@/components/ui/section-head";
import { PageHero } from "@/components/ui/page-hero";
import { Icon } from "@/components/ui/icon";
import { Reveal, Group, Item, vCard, vRow } from "@/components/motion";
import { OPEN_ROLES, PERKS, HIRING_STEPS, type Role } from "@/lib/careers-data";

/* ============================================================
   BACKEND HOOK — commented out until the API exists.
// TODO: be able to set ooen roles from admin dashboard or somewhere safer
// const API_ENDPOINT = "/api/careers/open-roles";

// async function fetchOpenRoles(): Promise<Role[]> {
//   const res = await fetch(API_ENDPOINT, { cache: "no-store" });
//   if (!res.ok) throw new Error(`Failed to load roles: ${res.status}`);
//   const data = await res.json();
//   // Expecting an array of { id, title, team, location, type }.
//   return data.roles as Role[];
// }
   ============================================================ */

export function Careers() {
  // DUMMY DATA for now. Swap to useState<Role[]>([]) when wiring the backend.
  const [roles] = useState<Role[]>(OPEN_ROLES);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);

  /* ---- Uncomment when the backend is ready ----
  useEffect(() => {
    let alive = true;
    fetchOpenRoles()
      .then((data) => { if (alive) setRoles(data); })
      .catch((e) => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);
  ---- */

  return (
    <div className="newcondo-page min-h-dvh">
      <Navbar forceSolid />

      <PageHero
        label="Careers hero"
        eyebrow="Careers"
        title={["Build the platform", "Nigeria trusts."]}
        lead="We're a small, senior team rebuilding how property works in Nigeria — escrow rent, verified tenants, real protection for owners. If that matters to you, we should talk."
      />

      {/* ---- Perks ---- */}
      <Section id="perks" label="Perks">
        <SectionHead eyebrow="Why Newcondo" title="Work that matters, treated like it matters." />
        <Group stagger={0.07} className="grid grid-cols-3 gap-[clamp(16px,2vw,24px)] max-[860px]:grid-cols-2 max-[560px]:grid-cols-1">
          {PERKS.map((p) => (
            <Item key={p.title} variants={vCard} className="rounded-card border border-border-hair bg-surface p-[clamp(22px,2.6vw,30px)] shadow-card">
              <span className="mb-4 grid h-11 w-11 place-items-center rounded-[12px] bg-green-wash text-green-dark">
                <Icon name={p.icon} size={22} />
              </span>
              <h3 className="text-[18px] font-bold tracking-[-0.02em] text-text-primary m-0 mb-2">{p.title}</h3>
              <p className="text-[14.5px] leading-[1.55] text-text-secondary m-0">{p.body}</p>
            </Item>
          ))}
        </Group>
      </Section>

      {/* ---- Open roles ---- */}
      <Section id="roles" label="Open roles" cream>
        <SectionHead
          eyebrow="Open roles"
          title="Find your seat."
          lead="Don't see an exact match? We always want to meet exceptional people — write to us anyway."
        />

        {/* Empty / loading states for when the backend is live:
            {loading && <p className="text-text-secondary">Loading open roles…</p>}
            {error && <p className="text-text-secondary">Couldn't load roles right now. Email us at careers@newcondo.homes.</p>}
            {!loading && roles.length === 0 && <EmptyRoles />}
        */}

        {roles.length === 0 ? (
          <Reveal className="rounded-card border border-border-hair bg-surface p-[clamp(28px,4vw,48px)] text-center shadow-card">
            <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-surface-sunken text-text-tertiary">
              <Icon name="briefcase" size={24} />
            </span>
            <h3 className="text-[22px] font-bold tracking-[-0.02em] text-text-primary m-0 mb-2.5">No open roles right now</h3>
            <p className="text-[15.5px] leading-[1.6] text-text-secondary m-0 mx-auto max-w-[46ch]">
              We&apos;re not actively hiring at the moment — but we&apos;re always glad to hear from great people. Send your CV to{" "}
              {/* TODO: see if there will be a separate careers@newcondo.homes email */}
              {/* <a href="mailto:careers@newcondo.homes" className="text-green-dark underline underline-offset-[3px]">careers@newcondo.homes</a>. */}
              <br />
              <a href="mailto:info@newcondo.homes" className="text-green-dark underline underline-offset-[3px]">info@newcondo.homes</a>.
            </p>
          </Reveal>
        ) : (
          <Group stagger={0.05} className="rounded-card border border-border-hair bg-surface overflow-hidden shadow-card">
            {roles.map((r, i) => (
              <Item
                key={r.id}
                variants={vRow}
                as="a"
                href={`mailto:careers@newcondo.homes?subject=Application: ${encodeURIComponent(r.title)}`}
                className={`group flex items-center gap-5 px-[clamp(20px,3vw,34px)] py-[clamp(20px,2.4vw,28px)] no-underline transition-colors duration-200 ease-nc hover:bg-surface-sunken ${i !== 0 ? "border-t border-divider" : ""
                  }`}
              >
                <div className="min-w-0 flex-1">
                  <h3 className="text-[clamp(18px,2vw,23px)] font-bold tracking-[-0.02em] text-text-primary m-0 mb-2">{r.title}</h3>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-text-secondary">
                    <span className="inline-flex items-center gap-1.5"><Icon name="users" size={15} className="text-text-tertiary" />{r.team}</span>
                    <span className="text-text-tertiary">·</span>
                    <span className="inline-flex items-center gap-1.5"><Icon name="map-pin" size={15} className="text-text-tertiary" />{r.location}</span>
                  </div>
                </div>
                <span className="hidden sm:inline-flex items-center rounded-full border border-border-hair bg-surface-sunken px-3.5 py-1.5 text-[13px] font-semibold text-text-secondary flex-none">
                  {r.type}
                </span>
                <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-ink text-cream transition-transform duration-200 ease-nc group-hover:translate-x-0.5">
                  <Icon name="arrow-right" size={19} />
                </span>
              </Item>
            ))}
          </Group>
        )}
      </Section>

      {/* ---- Hiring process ---- */}
      <Section id="process" label="Hiring process">
        <SectionHead eyebrow="How we hire" title="Fast, fair, and respectful of your time." />
        <Group stagger={0.08} className="grid grid-cols-4 gap-[clamp(16px,2.5vw,32px)] max-[760px]:grid-cols-2 max-[460px]:grid-cols-1">
          {HIRING_STEPS.map((s) => (
            <Item key={s.n} variants={vCard}>
              <span className="grid h-11 w-11 place-items-center rounded-full bg-green-wash font-mono text-[16px] font-semibold text-green-dark mb-5">{s.n}</span>
              <h3 className="text-[18px] font-bold tracking-[-0.02em] text-text-primary m-0 mb-2">{s.title}</h3>
              <p className="text-[14.5px] leading-[1.55] text-text-secondary m-0">{s.body}</p>
            </Item>
          ))}
        </Group>
      </Section>
      <ChatButton />
    </div>
  );
}
