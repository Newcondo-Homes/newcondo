/* ============================================================
   Dashboard domain types + dummy data.

   PRISMA MAPPING (packages/db/prisma/schema.prisma) — these UI types are
   DTOs; the backend services map DB rows to them, so UI enums stay stable:
     Property.status  UI PENDING_MARKING = DRAFT + !boundaryVerified
                      UI PENDING_REVIEW  = PENDING (adminApprovalStatus PENDING)
                      PUBLISHED / RENTED / DRAFT / UNAVAILABLE map 1:1
     "marked"         = Property.boundaryVerified
     FlatUnit         = PropertyUnit (label = unitNumber);
                      UI VACANT = AVAILABLE · OCCUPIED/RESERVED = OCCUPIED ·
                      UNDER_CONSTRUCTION = UNDER_CONSTRUCTION (new enum value)
     Tenant           = Rental (+ renter User); tenancyId = rentalId
     Tx.reference     = Payment.flutterwaveRef · fee = platformFee ·
                      net = ownerAmount · escrow = status HELD +
                      confirmationPeriodEnd
     location         = address/city/state (no lga/area columns — city holds
                      the area string for now)

   TODO(backend): the DUMMY_* exports below are the offline fallback; the
   hooks call the live combined backend when NEXT_PUBLIC_API_URL is set.
   ============================================================ */

export type Role = "OWNER" | "AGENT" | "RENTER";
export type PropertyStatus = "DRAFT" | "PENDING_MARKING" | "PENDING_REVIEW" | "PUBLISHED" | "RENTED" | "UNAVAILABLE";
export type FlatStatus = "OCCUPIED" | "VACANT" | "UNDER_CONSTRUCTION";
export type PromoMode = "PUBLIC" | "PERMISSION" | "RESTRICTED";
export type MarkingMethod = "SELF" | "KNOWN_PERSON" | "BROADCAST" | "NEWCONDO";
export type MarkingStatus = "AWAITING_CONFIRMATION" | "COMPLETED" | "IN_QUEUE";
export type ServiceStatus = "SCHEDULED" | "ACTIVE" | "IN_PROGRESS" | "COMPLETED" | "ISSUE";
export type TxType = "RENT_IN" | "RENT_OUT" | "COMMISSION" | "MARKING" | "WITHDRAW" | "FEE";

export interface DashboardUser { id: string; name: string; email: string; role: Role; plan: string; verificationStatus: "VERIFIED" | "PENDING" | "REJECTED"; initials: string; isAvailableForMarking?: boolean; reliability?: number; }
export interface FlatUnit { n: string; status: FlatStatus; renter?: string; till?: string; note?: string; }
export interface Property { id: string; title: string; location: string; state: string; price: number; per: string; status: PropertyStatus; marked: boolean; views: number; inquiries: number; flats: number; flatsRented: number; listedBy: "self" | "agent"; agent: string | null; }
export interface AgentListing { id: string; title: string; location: string; state: string; price: number; per: string; status: PropertyStatus; marked: boolean; views: number; inquiries: number; viaSubAgent: number; promoMode: PromoMode; subAgents: number; owner: string; }
export interface Promotion { id: string; title: string; listingAgent: string; clicks: number; conversions: number; earned: number; link: string; }
export interface SubAgentRequest { id: string; name: string; property: string; reliability: number; requested: string; }
export interface MarkingJob { id: string; property: string; propertyId?: string; method: MarkingMethod; fee: number; status: MarkingStatus; marker: string; markerRating?: number; markedAt: string; confirmDeadlineH?: number; photos: number; }
export interface AvailableJob { id: string; title: string; area: string; distanceKm: number; payout: number; queue: number; posted: string; contact: string; photos: number; joined?: boolean; }
export interface ActiveJob { id: string; title: string; area: string; payout: number; slotMinsLeft: number; position: number; accepted: string; contactName: string; contactPhone: string; }
export interface JobHistoryItem { id: string; title: string; date: string; payout: number; status: "PAID" | "PARTIAL"; note?: string; }
export interface EscrowItem { id: string; property: string; flat: string; renter: string; amount: number; hoursLeft: number; viaAgent: string | null; }
export interface Tx { id: string; date: string; desc: string; type: TxType; amount: number; fee?: number; net: number; status: string; note?: string; }
export interface VirtualAccount { id: string; name: string; number: string; bank: string; available: number; locked: number; kind: "MAIN" | "PROPERTY"; property?: string; }
export interface Wallet { available: number; locked: number; autoPayout: "OFF" | "INSTANT" | "WEEKLY" | "MONTHLY"; bank: string | null; }
export interface ServiceJob { id: string; service: string; icon: string; property: string; vendor: string; rating?: number; date: string; time?: string; status: ServiceStatus; cost: number; photos?: number; note: string; }
export interface Notification { id: string; t: string; s: string; time: string; unread: boolean; kind: "marking" | "payment" | "wallet" | "verify"; to: string; }

/* -------- preview users (in production this is the NextAuth session) -------- */
export const DUMMY_USERS: Record<Role, DashboardUser> = {
  OWNER: { id: "u_own_01", name: "Adaeze Okafor", email: "adaeze@newcondo.homes", role: "OWNER", plan: "Elite", verificationStatus: "VERIFIED", initials: "AO" },
  AGENT: { id: "u_agt_01", name: "Emeka Obi", email: "emeka@newcondo.homes", role: "AGENT", plan: "Premium", verificationStatus: "VERIFIED", initials: "EO", isAvailableForMarking: true, reliability: 4.8 },
  RENTER: { id: "u_rnt_01", name: "Chiamaka Eze", email: "chiamaka@gmail.com", role: "RENTER", plan: "Free", verificationStatus: "PENDING", initials: "CE" },
};

/* TODO(backend): GET /api/properties/my-listings?ownerId= */
export const DUMMY_PROPERTIES: Property[] = [
  { id: "p1", title: "3-bedroom flat, New Owerri", location: "New Owerri, Owerri Municipal", state: "Imo", price: 1200000, per: "year", status: "PUBLISHED", marked: true, views: 842, inquiries: 14, flats: 2, flatsRented: 1, listedBy: "self", agent: null },
  { id: "p2", title: "2-bedroom apartment, Trans Amadi", location: "Trans Amadi, Port Harcourt", state: "Rivers", price: 850000, per: "year", status: "RENTED", marked: true, views: 1204, inquiries: 31, flats: 1, flatsRented: 1, listedBy: "agent", agent: "Emeka Obi" },
  { id: "p3", title: "Self-contain, Independence Layout", location: "Independence Layout, Enugu", state: "Enugu", price: 450000, per: "year", status: "PENDING_MARKING", marked: false, views: 0, inquiries: 0, flats: 4, flatsRented: 0, listedBy: "self", agent: null },
  { id: "p4", title: "4-bedroom duplex, GRA Phase 2", location: "GRA Phase 2, Port Harcourt", state: "Rivers", price: 3500000, per: "year", status: "DRAFT", marked: false, views: 0, inquiries: 0, flats: 1, flatsRented: 0, listedBy: "self", agent: null },
];

/* Per-flat units for multifamily houses.
   TODO(backend): Flat model belongs to Property; payments/escrow reference flatId. */
export const DUMMY_FLAT_UNITS: Record<string, FlatUnit[]> = {
  p1: [{ n: "Flat A", status: "OCCUPIED", renter: "Ike N.", till: "May 2027" }, { n: "Flat B", status: "VACANT" }],
  p2: [{ n: "Flat 1", status: "OCCUPIED", renter: "Chiamaka Eze", till: "Mar 2027" }],
  p3: [{ n: "Flat A", status: "VACANT" }, { n: "Flat B", status: "VACANT" }, { n: "Flat C", status: "UNDER_CONSTRUCTION", note: "Plumbing & finishing — est. Sep 2026" }, { n: "Flat D", status: "UNDER_CONSTRUCTION", note: "Plumbing & finishing — est. Sep 2026" }],
  p4: [{ n: "Main duplex", status: "VACANT" }],
  p5: [{ n: "Mini flat", status: "VACANT" }],
  p6: [{ n: "Main house", status: "VACANT" }, { n: "BQ", status: "UNDER_CONSTRUCTION", note: "Finishing — est. Oct 2026" }],
};

/* TODO(backend): GET /api/agent/listings + GET /api/agent/promotions */
export const DUMMY_AGENT_LISTINGS: AgentListing[] = [
  { id: "p2", title: "2-bedroom apartment, Trans Amadi", location: "Trans Amadi, Port Harcourt", state: "Rivers", price: 850000, per: "year", status: "RENTED", marked: true, views: 1204, inquiries: 31, viaSubAgent: 412, promoMode: "PERMISSION", subAgents: 3, owner: "Adaeze Okafor" },
  { id: "p5", title: "Mini flat, Aba Road", location: "Aba Road, Port Harcourt", state: "Rivers", price: 600000, per: "year", status: "PUBLISHED", marked: true, views: 687, inquiries: 19, viaSubAgent: 203, promoMode: "PUBLIC", subAgents: 5, owner: "Chief Amadi" },
  { id: "p6", title: "2-bedroom bungalow, Rumuola", location: "Rumuola, Port Harcourt", state: "Rivers", price: 750000, per: "year", status: "PUBLISHED", marked: true, views: 311, inquiries: 7, viaSubAgent: 0, promoMode: "RESTRICTED", subAgents: 0, owner: "Mrs. Nwosu" },
];
export const DUMMY_PROMOTIONS: Promotion[] = [
  { id: "pr1", title: "Studio apartment, Wuse 2", listingAgent: "Fatima Bello", clicks: 148, conversions: 1, earned: 42500, link: "newcondo.homes/r/EMK-wuse2-8fk2" },
  { id: "pr2", title: "3-bedroom flat, Lekki Phase 1", listingAgent: "Dele Osoba", clicks: 96, conversions: 0, earned: 0, link: "newcondo.homes/r/EMK-lekki-2xw9" },
];
export const DUMMY_SUBAGENT_REQUESTS: SubAgentRequest[] = [
  { id: "sa1", name: "Ngozi Kalu", property: "Mini flat, Aba Road", reliability: 4.6, requested: "2h ago" },
  { id: "sa2", name: "Ibrahim Musa", property: "2-bedroom bungalow, Rumuola", reliability: 4.1, requested: "yesterday" },
];

/* Marking. Fee ₦20,000 broadcast · ₦25,000 Newcondo agent. Marker gets 25% (₦5,000):
   ₦1,000 held on completion, rest on owner confirmation (72h window).
   TODO(backend): GET /api/marking-jobs?requesterId= · GET /api/marking/available-jobs?lat&lng
   POST /api/marking/queue/:jobId/join · POST /api/marking-jobs/:id/confirm | /dispute */
export const DUMMY_MARKING_JOBS_OWNER: MarkingJob[] = [
  { id: "mj1", property: "Self-contain, Independence Layout", propertyId: "p3", method: "BROADCAST", fee: 20000, status: "AWAITING_CONFIRMATION", marker: "Ngozi Kalu", markerRating: 4.6, markedAt: "Today, 11:42", confirmDeadlineH: 63, photos: 6 },
  { id: "mj2", property: "3-bedroom flat, New Owerri", propertyId: "p1", method: "SELF", fee: 0, status: "COMPLETED", marker: "You", markedAt: "12 May 2026", photos: 8 },
  { id: "mj3", property: "2-bedroom apartment, Trans Amadi", propertyId: "p2", method: "KNOWN_PERSON", fee: 0, status: "COMPLETED", marker: "Uche (link)", markedAt: "3 Feb 2026", photos: 5 },
];
export const DUMMY_AVAILABLE_JOBS: AvailableJob[] = [
  { id: "aj1", title: "4-bedroom duplex, GRA Phase 2", area: "GRA Phase 2, Port Harcourt", distanceKm: 1.8, payout: 5000, queue: 2, posted: "25 min ago", contact: "Guide provided", photos: 3 },
  { id: "aj2", title: "Warehouse conversion, Elelenwo", area: "Elelenwo, Port Harcourt", distanceKm: 6.4, payout: 5000, queue: 0, posted: "2h ago", contact: "Owner on site", photos: 0 },
  { id: "aj3", title: "2-bedroom flat, Woji", area: "Woji, Port Harcourt", distanceKm: 3.1, payout: 5000, queue: 4, posted: "4h ago", contact: "Guide provided", photos: 5 },
];
export const DUMMY_ACTIVE_JOB: ActiveJob = { id: "aj0", title: "Bungalow, Rumuokoro", area: "Rumuokoro, Port Harcourt", payout: 5000, slotMinsLeft: 104, position: 1, accepted: "13:05", contactName: "Mr. Wachukwu", contactPhone: "0803 ••• 4421" };
export const DUMMY_JOB_HISTORY: JobHistoryItem[] = [
  { id: "h1", title: "Self-contain, D-Line", date: "8 Jul 2026", payout: 5000, status: "PAID" },
  { id: "h2", title: "3-bedroom flat, Ada George", date: "29 Jun 2026", payout: 5000, status: "PAID" },
  { id: "h3", title: "Duplex, Peter Odili Rd", date: "15 Jun 2026", payout: 1000, status: "PARTIAL", note: "Owner missed confirm window — drip payout running" },
];

/* Payments & escrow. 24h renter window; commission 20% (15% Elite);
   listing agent gets 50% of commission, split with sub-agent when link used.
   TODO(backend): GET /api/payments/history?role= · GET /api/payments/pending-confirmations */
export const DUMMY_ESCROW: EscrowItem[] = [
  { id: "e1", property: "3-bedroom flat, New Owerri", flat: "Flat B", renter: "Tobi A.", amount: 1200000, hoursLeft: 9, viaAgent: null },
];
export const DUMMY_PAYMENTS: Record<Role, Tx[]> = {
  OWNER: [
    { id: "t1", date: "14 Jul 2026", desc: "Rent — Trans Amadi, Flat 1", type: "RENT_IN", amount: 850000, fee: -170000, net: 680000, status: "RELEASED" },
    { id: "t2", date: "14 Jul 2026", desc: "Platform commission (20%)", type: "FEE", amount: -170000, net: -170000, status: "DEDUCTED" },
    { id: "t3", date: "2 Jul 2026", desc: "Marking service — Independence Layout", type: "MARKING", amount: -20000, net: -20000, status: "PAID" },
    { id: "t4", date: "28 Jun 2026", desc: "Withdrawal to GTBank ••7702", type: "WITHDRAW", amount: -500000, net: -500000, status: "SETTLED" },
  ],
  AGENT: [
    { id: "a1", date: "14 Jul 2026", desc: "Listing commission — Trans Amadi (50% of 20%)", type: "COMMISSION", amount: 85000, net: 85000, status: "RELEASED" },
    { id: "a2", date: "8 Jul 2026", desc: "Marking job — Self-contain, D-Line", type: "MARKING", amount: 5000, net: 5000, status: "RELEASED" },
    { id: "a3", date: "30 Jun 2026", desc: "Sub-agent split — Wuse 2 (via your link)", type: "COMMISSION", amount: 42500, net: 42500, status: "RELEASED" },
    { id: "a4", date: "21 Jun 2026", desc: "Withdrawal to Access ••1188", type: "WITHDRAW", amount: -100000, net: -100000, status: "SETTLED" },
  ],
  RENTER: [
    { id: "r1", date: "3 Mar 2026", desc: "Rent — 2-bedroom, Trans Amadi (Flat 1)", type: "RENT_OUT", amount: -867000, net: -867000, status: "CONFIRMED", note: "incl. ₦17,000 platform fee" },
  ],
};

/* TODO(backend): GET /api/virtual-accounts · GET /api/virtual-accounts/:id/transactions */
export const DUMMY_VIRTUAL_ACCOUNTS: Record<Role, VirtualAccount[]> = {
  OWNER: [
    { id: "va1", name: "ADAEZE OKAFOR — NC-MAIN", number: "991 224 0817", bank: "Wema (Flutterwave)", available: 680000, locked: 1200000, kind: "MAIN" },
    { id: "va2", name: "ADAEZE OKAFOR — NC-P1", number: "991 224 5530", bank: "Wema (Flutterwave)", available: 0, locked: 1200000, kind: "PROPERTY", property: "3-bedroom flat, New Owerri" },
    { id: "va3", name: "ADAEZE OKAFOR — NC-P2", number: "991 224 8841", bank: "Wema (Flutterwave)", available: 680000, locked: 0, kind: "PROPERTY", property: "2-bedroom apartment, Trans Amadi" },
  ],
  AGENT: [{ id: "va4", name: "EMEKA OBI — NC-MAIN", number: "991 887 2204", bank: "Wema (Flutterwave)", available: 132500, locked: 1000, kind: "MAIN" }],
  RENTER: [],
};
export const DUMMY_WALLETS: Record<Role, Wallet> = {
  OWNER: { available: 680000, locked: 1200000, autoPayout: "OFF", bank: "GTBank ••7702" },
  AGENT: { available: 132500, locked: 1000, autoPayout: "WEEKLY", bank: "Access ••1188" },
  RENTER: { available: 0, locked: 0, autoPayout: "OFF", bank: null },
};

/* Referrals — dual-sided, pay-on-success. TODO(backend): GET /api/referrals/stats */
export const DUMMY_REFERRALS = {
  link: "newcondo.homes/r/ADA-4F2K",
  invited: 12, signedUp: 5, converted: 3, credits: 21000,
  history: [
    { id: "rf1", name: "Chinedu N. (Owner)", status: "CONVERTED", reward: 10000, date: "2 Jul 2026" },
    { id: "rf2", name: "Blessing A. (Renter)", status: "CONVERTED", reward: 2000, date: "18 Jun 2026" },
    { id: "rf3", name: "Kunle T. (Agent)", status: "SIGNED_UP", reward: 0, date: "12 Jun 2026", note: "Reward pending first transaction" },
    { id: "rf4", name: "Amara O.", status: "INVITED", reward: 0, date: "8 Jun 2026" },
  ],
};

/* Third-party vendor services — visit frequency depends on the owner's plan.
   TODO(backend): GET /api/services/plan · GET /api/services/jobs · POST /api/services/request */
export const DUMMY_SERVICES = {
  plan: {
    name: "Shield", price: 45000, per: "quarter", renews: "1 Oct 2026",
    entitlements: [
      ["Fumigation", "3× / year", "PestGuard NG"],
      ["Waste management", "Weekly pickup", "CleanCity Waste"],
      ["Property inspection", "2× / year", "HomeCheck Inspectors"],
      ["Maintenance repair", "On request · vetted rates", "VoltFix · PipeMasters"],
    ] as [string, string, string][],
  },
  jobs: [
    { id: "s1", service: "Fumigation", icon: "bug", property: "3-bedroom flat, New Owerri", vendor: "PestGuard NG", rating: 4.7, date: "21 Jul 2026", time: "9:00–12:00", status: "SCHEDULED", cost: 0, note: "Included in Shield plan — visit 2 of 3. Renters in Flat A notified." },
    { id: "s2", service: "Waste management", icon: "trash-2", property: "All properties", vendor: "CleanCity Waste", rating: 4.5, date: "Every Tuesday", status: "ACTIVE", cost: 0, note: "Weekly pickup under Shield plan. Last pickup: 14 Jul, 07:40." },
    { id: "s3", service: "Property inspection", icon: "search", property: "2-bedroom apartment, Trans Amadi", vendor: "HomeCheck Inspectors", rating: 4.8, date: "14 Jun 2026", status: "COMPLETED", cost: 0, photos: 4, note: "No structural issues. Minor damp patch on kitchen wall — repair recommended within 3 months." },
    { id: "s4", service: "Repair — electrical", icon: "wrench", property: "3-bedroom flat, New Owerri · Flat A", vendor: "VoltFix Electricals", rating: 4.6, date: "2 Jun 2026", status: "COMPLETED", cost: 18500, photos: 2, note: "Requested by renter. Faulty distribution board replaced; 90-day workmanship warranty." },
    { id: "s5", service: "Fumigation", icon: "bug", property: "2-bedroom apartment, Trans Amadi", vendor: "PestGuard NG", rating: 4.7, date: "8 Mar 2026", status: "COMPLETED", cost: 0, photos: 3, note: "Visit 1 of 3 under Shield plan." },
  ] as ServiceJob[],
  types: ["Fumigation", "Waste management", "Property inspection", "Repair — electrical", "Repair — plumbing", "Repair — general"],
};

/* Renter view of their tenancy + building services. TODO(backend): GET /api/rentals/mine */
export const DUMMY_RENTER_RENTAL = {
  property: "2-bedroom apartment, Trans Amadi", flat: "Flat 1", agent: "Emeka Obi", owner: "Adaeze Okafor",
  paid: 867000, paidDate: "3 Mar 2026", till: "Mar 2027", rent: 850000,
  services: [
    { service: "Fumigation", icon: "bug", vendor: "PestGuard NG", date: "Next: Nov 2026", status: "SCHEDULED" as ServiceStatus, note: "Covered by your owner’s Shield plan — you’ll be notified 48h before the visit." },
    { service: "Waste management", icon: "trash-2", vendor: "CleanCity Waste", date: "Every Tuesday", status: "ACTIVE" as ServiceStatus, note: "Put bins out Monday night." },
    { service: "Property inspection", icon: "search", vendor: "HomeCheck Inspectors", date: "14 Jun 2026", status: "COMPLETED" as ServiceStatus, note: "Passed — minor kitchen damp patch flagged to the owner." },
  ],
};

/* TODO(backend): GET /api/notifications (+ SSE/websocket for realtime) */
export const DUMMY_NOTIFICATIONS: Record<Role, Notification[]> = {
  OWNER: [
    { id: "n1", t: "Marking completed — confirm within 72h", s: "Ngozi Kalu marked Self-contain, Independence Layout", time: "2h ago", unread: true, kind: "marking", to: "/marking" },
    { id: "n2", t: "Rent payment in escrow", s: "₦1,200,000 from Tobi A. — 24h window ends 09:00 tomorrow", time: "15h ago", unread: true, kind: "payment", to: "/payments" },
    { id: "n3", t: "Payout released", s: "₦680,000 available for withdrawal", time: "2d ago", unread: false, kind: "wallet", to: "/wallet" },
  ],
  AGENT: [
    { id: "n4", t: "Marking slot active — 1h 44m left", s: "Bungalow, Rumuokoro · you are position 1", time: "1h ago", unread: true, kind: "marking", to: "/marking" },
    { id: "n5", t: "New marking job nearby", s: "4-bedroom duplex, GRA Phase 2 · 1.8 km away · ₦5,000", time: "25m ago", unread: true, kind: "marking", to: "/marking" },
    { id: "n6", t: "Commission released", s: "₦85,000 — Trans Amadi listing", time: "2d ago", unread: false, kind: "wallet", to: "/wallet" },
  ],
  RENTER: [
    { id: "n7", t: "Complete verification", s: "Upload NIN or BVN to unlock payments", time: "1d ago", unread: true, kind: "verify", to: "/profile" },
  ],
};

/* Chart placeholders. TODO(backend): GET /api/analytics/revenue?range=6m etc. */
export const DUMMY_CHARTS = {
  revenue: { labels: ["Feb", "Mar", "Apr", "May", "Jun", "Jul"], values: [0, 850, 850, 2050, 2050, 2730] },
  views: { labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], values: [38, 52, 41, 67, 88, 120, 96] },
  agentEarnings: { labels: ["Feb", "Mar", "Apr", "May", "Jun", "Jul"], values: [24, 61, 48, 92, 110, 132.5] },
};

/* Structured Nigerian geography (sample). TODO(backend): serve full dataset from @newcondo/db */
export const DUMMY_GEO: Record<string, Record<string, string[]>> = {
  Imo: { "Owerri Municipal": ["New Owerri", "Ikenegbu", "Aladinma"], "Owerri North": ["Orji", "Egbu"], Okigwe: ["Okigwe Town"] },
  Rivers: { "Port Harcourt": ["GRA Phase 2", "D-Line", "Old Township"], "Obio-Akpor": ["Trans Amadi", "Rumuola", "Woji", "Rumuokoro"] },
  Enugu: { "Enugu North": ["Independence Layout", "GRA"], "Enugu East": ["Abakpa", "Trans-Ekulu"] },
  Lagos: { "Eti-Osa": ["Lekki Phase 1", "Ikate", "VI"], Ikeja: ["Allen", "Opebi", "Oregun"] },
};
export const AMENITIES = ["Water (borehole)", "Prepaid meter", "Gated compound", "Parking", "POP ceiling", "Fenced", "Security", "Tiled floors", "Wardrobes", "Kitchen cabinets"];

/* ================= tenants ================= */
export interface Tenant {
  id: string; name: string; email: string; phone: string; flatLabel: string;
  status: "ACTIVE" | "ENDED"; startDate: string; till?: string; rentPaid: number;
  verificationStatus: "VERIFIED" | "PENDING"; lastPayment?: string; onboardedVia: string;
}
/* TODO(backend): GET /api/v1/properties/:id/tenants (implemented — property-service tenantService) */
export const DUMMY_TENANTS: Record<string, Tenant[]> = {
  p1: [
    { id: "tn1", name: "Ike Nwachukwu", email: "ike.nwa@gmail.com", phone: "0803 441 2210", flatLabel: "Flat A", status: "ACTIVE", startDate: "12 May 2026", till: "May 2027", rentPaid: 1200000, verificationStatus: "VERIFIED", lastPayment: "12 May 2026", onboardedVia: "Invite link · 12 May 2026" },
  ],
  p2: [
    { id: "tn2", name: "Chiamaka Eze", email: "chiamaka@gmail.com", phone: "0805 112 8830", flatLabel: "Flat 1", status: "ACTIVE", startDate: "3 Mar 2026", till: "Mar 2027", rentPaid: 850000, verificationStatus: "PENDING", lastPayment: "3 Mar 2026", onboardedVia: "Invite link · 2 Mar 2026" },
    { id: "tn3", name: "Bola Adeyemi", email: "bola.ad@yahoo.com", phone: "0812 900 4471", flatLabel: "Flat 1", status: "ENDED", startDate: "Feb 2024", till: "Feb 2026", rentPaid: 1600000, verificationStatus: "VERIFIED", lastPayment: "1 Feb 2025", onboardedVia: "Invite link · Jan 2024" },
  ],
  p5: [
    { id: "tn4", name: "Ada Ugo", email: "ada.ugo@gmail.com", phone: "0703 551 9902", flatLabel: "Mini flat", status: "ENDED", startDate: "Jan 2025", till: "Jan 2026", rentPaid: 600000, verificationStatus: "VERIFIED", lastPayment: "5 Jan 2025", onboardedVia: "Invite link · Dec 2024" },
  ],
};

/* ================= bank accounts (payout destinations) =================
   Distinct from virtual accounts: VAs are AUTO-created by Newcondo (main on
   subscription activation; one per marked property) — users never create
   them. Bank accounts are user-managed and hold the payout default. */
export interface BankAccount {
  id: string; bankName: string; bankCode: string; accountNumber: string;
  accountName: string; isDefault: boolean; addedOn: string;
}
export const NG_BANKS: [string, string][] = [["GTBank", "058"], ["Access Bank", "044"], ["Zenith", "057"], ["UBA", "033"], ["First Bank", "011"], ["Opay", "999992"], ["Kuda", "50211"], ["Moniepoint", "50515"]];
export const DUMMY_BANK_ACCOUNTS: Record<Role, BankAccount[]> = {
  OWNER: [
    { id: "ba1", bankName: "GTBank", bankCode: "058", accountNumber: "0044817702", accountName: "ADAEZE N OKAFOR", isDefault: true, addedOn: "14 Feb 2026" },
    { id: "ba2", bankName: "Opay", bankCode: "999992", accountNumber: "8035550134", accountName: "ADAEZE OKAFOR", isDefault: false, addedOn: "2 Jun 2026" },
  ],
  AGENT: [{ id: "ba3", bankName: "Access Bank", bankCode: "044", accountNumber: "0091121188", accountName: "EMEKA C OBI", isDefault: true, addedOn: "20 Feb 2026" }],
  RENTER: [],
};

/* ================= browse grid ================= */
export interface BrowseListing {
  id: string; title: string; state: string; lga: string; area: string; price: number;
  propertyType: string; coverUrl: string | null; vacantFlats: number;
  listingAgent: { name: string } | null; isMarked: boolean; flats: { label: string; status: FlatStatus }[];
}
export interface BrowseFilters { q?: string; state?: string; type?: string; minPrice?: number; maxPrice?: number; page?: number; pageSize?: number; }
export interface BrowseResult { total: number; page: number; pageSize: number; items: BrowseListing[]; }
/* TODO(backend): GET /api/v1/properties/browse (implemented — publicBrowseService, PUBLISHED+marked only) */
export const DUMMY_BROWSE: BrowseListing[] = [
  { id: "b1", title: "2-bedroom apartment, Trans Amadi", state: "Rivers", lga: "Obio-Akpor", area: "Trans Amadi", price: 850000, propertyType: "Flat", coverUrl: null, vacantFlats: 0, listingAgent: { name: "Emeka Obi" }, isMarked: true, flats: [{ label: "Flat 1", status: "OCCUPIED" }] },
  { id: "b2", title: "Mini flat, Aba Road", state: "Rivers", lga: "Port Harcourt", area: "Aba Road", price: 600000, propertyType: "Mini flat", coverUrl: null, vacantFlats: 1, listingAgent: { name: "Emeka Obi" }, isMarked: true, flats: [{ label: "Mini flat", status: "VACANT" }] },
  { id: "b3", title: "3-bedroom flat, New Owerri", state: "Imo", lga: "Owerri Municipal", area: "New Owerri", price: 1200000, propertyType: "Flat", coverUrl: null, vacantFlats: 1, listingAgent: null, isMarked: true, flats: [{ label: "Flat A", status: "OCCUPIED" }, { label: "Flat B", status: "VACANT" }] },
  { id: "b4", title: "2-bedroom bungalow, Rumuola", state: "Rivers", lga: "Obio-Akpor", area: "Rumuola", price: 750000, propertyType: "Bungalow", coverUrl: null, vacantFlats: 1, listingAgent: { name: "Emeka Obi" }, isMarked: true, flats: [{ label: "Main house", status: "VACANT" }] },
  { id: "b5", title: "Self-contain, D-Line", state: "Rivers", lga: "Port Harcourt", area: "D-Line", price: 450000, propertyType: "Self-contain", coverUrl: null, vacantFlats: 2, listingAgent: { name: "Fatima Bello" }, isMarked: true, flats: [{ label: "Room 1", status: "VACANT" }, { label: "Room 2", status: "VACANT" }] },
  { id: "b6", title: "Studio apartment, Wuse 2", state: "FCT", lga: "Abuja Municipal", area: "Wuse 2", price: 1500000, propertyType: "Studio", coverUrl: null, vacantFlats: 1, listingAgent: { name: "Fatima Bello" }, isMarked: true, flats: [{ label: "Studio", status: "VACANT" }] },
];
