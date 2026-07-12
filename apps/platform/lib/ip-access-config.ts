/* ============================================================
   IP ALLOW-LIST — devices that bypass the location gate entirely.
   ============================================================

   Add an IP address to grant that device instant access regardless
   of its GPS location (founder, co-founder, stakeholders, clients
   doing a demo, etc.). Leave the list empty to disable this feature
   — when empty, IP checking is skipped and everyone goes through the
   normal location gate.

   This is enforced in `middleware.ts` (server-side, reads the real
   request IP) — it cannot be spoofed by editing browser storage.
   ============================================================ */

export const IP_WHITELIST: string[] = [
  // "102.89.23.45",   // Founder — home
  // "197.210.54.10",  // Co-founder
  // "41.58.12.9",     // Stakeholder / investor demo
  // "129.205.112.4",  // Client walkthrough
];
