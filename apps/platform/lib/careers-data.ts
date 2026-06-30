/* ============================================================
   Careers — structured content + dummy roles.

   NOTE: OPEN_ROLES below is DUMMY DATA. When your backend is
   ready, remove this array and use the fetchOpenRoles() helper
   in components/sections/careers.tsx (currently commented out).
   The Role shape matches what the component renders, so you can
   swap the source without touching the UI.
   ============================================================ */

export type Role = {
  id: string;
  title: string;
  team: string;
  location: string;
  type: string; // Full-time / Contract / Internship
};

/* ---- OPEN ROLES ----
   No open positions right now → empty array shows the "no open roles" state.

   The dummy roles below are kept (commented out) so you can either restore
   them for previewing, or use them as the shape your backend should return.

// const DUMMY_ROLES: Role[] = [
//   { id: "eng-1", title: "Senior Backend Engineer", team: "Engineering", location: "Lagos / Remote", type: "Full-time" },
//   { id: "eng-2", title: "Frontend Engineer (Next.js)", team: "Engineering", location: "Remote (Nigeria)", type: "Full-time" },
//   { id: "ops-1", title: "Verification Operations Lead", team: "Trust & Safety", location: "Owerri", type: "Full-time" },
//   { id: "gtm-1", title: "Field Sales Associate", team: "Growth", location: "Abuja", type: "Full-time" },
//   { id: "des-1", title: "Product Designer", team: "Product", location: "Remote (Nigeria)", type: "Contract" },
// ];
*/
export const OPEN_ROLES: Role[] = [];

export const PERKS: { icon: string; title: string; body: string }[] = [
  { icon: "banknote", title: "Honest pay", body: "Competitive salaries benchmarked to the role, reviewed regularly — no games, no surprises." },
  { icon: "laptop", title: "Remote-friendly", body: "Work from anywhere in Nigeria, with the equipment and tools you need to do your best work." },
  { icon: "trending-up", title: "Real ownership", body: "Early-team equity and the room to shape a product millions of Nigerians will rely on." },
  { icon: "graduation-cap", title: "Grow fast", body: "A learning budget and the kind of responsibility that compounds your skills quickly." },
  { icon: "heart-pulse", title: "Health cover", body: "Health insurance for you, because you can't build trust if you're worried about cover." },
  { icon: "users", title: "A team that cares", body: "Small, senior, mission-driven. We hire kind people who are excellent at what they do." },
];

export const HIRING_STEPS: { n: string; title: string; body: string }[] = [
  { n: "1", title: "Apply", body: "Send your CV and a short note on why Newcondo. No cover-letter essays required." },
  { n: "2", title: "Intro call", body: "A 30-minute conversation to understand your story and answer your questions." },
  { n: "3", title: "Practical", body: "A focused, paid take-home or live exercise that reflects the real work — never a trick." },
  { n: "4", title: "Meet the team", body: "Final conversations with the people you'll work with, then a decision within a week." },
];
