/* ============================================================
   Blog — structured content + three real seed posts.

   >>> WHEN YOUR BACKEND IS READY <<<
   The three posts below (BLOG_POSTS) are REAL, hand-written
   articles used to seed the page. When your API exists:

   1. In components/sections/blog.tsx, swap the initial
      useState(BLOG_POSTS) for useState<BlogPost[]>([]) and
      uncomment the fetchPosts() effect.
   2. In app/blog/[slug]/page.tsx, swap getPostBySlug() /
      generateStaticParams() to read from fetchPost(slug).
   3. Point BLOG_API at your real endpoint.

   The BlogPost shape is everything the UI renders — return that
   shape from your API and nothing in the components changes.

   Body model: an array of blocks (a small, transport-friendly
   schema your CMS can emit as JSON). Supported blocks:
     { type: "p",     text }     // inline <strong>/<em> allowed
     { type: "h2",    text }
     { type: "ul",    items[] }  // inline <strong>/<em> allowed
     { type: "quote", text, cite? }
   ============================================================ */

export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "quote"; text: string; cite?: string };

export type BlogAuthor = {
  name: string;
  role: string;
};

export type BlogPost = {
  /** URL segment, e.g. /blog/rent-in-escrow-explained */
  slug: string;
  title: string;
  /** One-sentence summary used on cards + meta description. */
  excerpt: string;
  /** e.g. "Rent & Payments", "Guides", "Diaspora". */
  category: string;
  author: BlogAuthor;
  /** ISO date — sort/machine-readable. */
  date: string;
  /** Human label shown in the UI. */
  dateLabel: string;
  /** Estimated reading time in minutes. */
  readMins: number;
  /** Caption for the image placeholder until real photography lands. */
  imageAlt: string;
  body: BlogBlock[];
};

/* ============================================================
   BACKEND HOOKS — commented out until the API exists.

// const BLOG_API = "/api/blog/posts";

// // List for the index grid (omit `body` server-side for a lighter payload if you like).
// export async function fetchPosts(): Promise<BlogPost[]> {
//   const res = await fetch(BLOG_API, { cache: "no-store" });
//   if (!res.ok) throw new Error(`Failed to load posts: ${res.status}`);
//   const data = await res.json();
//   return data.posts as BlogPost[];
// }

// // Single post for the reader page.
// export async function fetchPost(slug: string): Promise<BlogPost | null> {
//   const res = await fetch(`${BLOG_API}/${slug}`, { cache: "no-store" });
//   if (res.status === 404) return null;
//   if (!res.ok) throw new Error(`Failed to load post: ${res.status}`);
//   return (await res.json()) as BlogPost;
// }
   ============================================================ */

/* ---- Local helpers (read from the seed array). Replace their
   bodies with fetchPosts()/fetchPost() calls when the API is live. ---- */
export function getAllPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => b.date.localeCompare(a.date));
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return BLOG_POSTS.map((p) => p.slug);
}

/* ============================================================
   REAL SEED POSTS
   ============================================================ */
export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "what-rent-in-escrow-actually-means",
    title: "What \u201Crent in escrow\u201D actually means for your money",
    excerpt:
      "Everyone says \u201Cescrow\u201D like you already know what it does. Here is exactly where your rent sits, who can touch it, and when it reaches your account.",
    category: "Rent & Payments",
    author: { name: "Adaeze Okonkwo", role: "Payments, Newcondo" },
    date: "2026-05-28",
    dateLabel: "28 May 2026",
    readMins: 6,
    imageAlt: "Owner checking a payment confirmation on a phone",
    body: [
      {
        type: "p",
        text: "If you have rented out property in Nigeria, you know the quiet anxiety of payment day. The tenant says they have paid. The agent says they are \u201Csorting it.\u201D Days pass. Then weeks. The money exists somewhere, but not in your account, and you are the last person to find out what happened to it.",
      },
      {
        type: "p",
        text: "Escrow ends that. But the word gets used so loosely that it has almost stopped meaning anything. So here is the plain version, with no jargon.",
      },
      { type: "h2", text: "Where the money actually sits" },
      {
        type: "p",
        text: "When a tenant pays rent through Newcondo, the money does <strong>not</strong> go to your agent. It does not go into anyone\u2019s personal account. It goes into a dedicated <strong>virtual account</strong> created for that transaction, operated through our payment partner, Flutterwave. The funds are held there \u2014 not spent, not moved, not \u201Cborrowed for a few days.\u201D",
      },
      {
        type: "p",
        text: "Think of it as a locked room that everyone can see into but no one can take from. You can watch the rent arrive in real time on your dashboard. So can the tenant. So can the agent. But the only direction those funds can travel is to <strong>your</strong> linked bank account.",
      },
      { type: "h2", text: "The 24-hour confirmation window" },
      {
        type: "p",
        text: "Once a tenant pays, a 24-hour window opens. This exists to protect everyone: it gives the tenant a short period to confirm they have access to the property as agreed, and it gives the system time to flag anything unusual before money moves.",
      },
      {
        type: "p",
        text: "When the window closes cleanly, the rent is released automatically to your account and the commission split happens in the background. You do not chase anyone. You do not call anyone. The money simply arrives.",
      },
      {
        type: "quote",
        text: "The first month I used Newcondo, I got paid directly into my account without calling anyone. I didn\u2019t know that was possible.",
        cite: "Property owner, Port Harcourt",
      },
      { type: "h2", text: "What the agent can and cannot do" },
      {
        type: "p",
        text: "Agents are essential \u2014 they find tenants, show the property, and coordinate the move-in. Newcondo does not remove them. What it removes is their ability to <strong>sit on your money</strong>. An agent can promote your listing and bring you a paying tenant, and their commission is calculated and paid automatically. At no point does your rent pass through their hands.",
      },
      {
        type: "ul",
        items: [
          "<strong>Can</strong> promote your listing and bring tenants",
          "<strong>Can</strong> see when rent is paid and confirmed",
          "<strong>Cannot</strong> receive, hold, or release your rent",
          "<strong>Cannot</strong> delay your payout or quietly deduct from it",
        ],
      },
      { type: "h2", text: "Why this matters even for one property" },
      {
        type: "p",
        text: "Landlords often assume escrow is for people with a portfolio. It is the opposite. If you own a single \u20A6100,000-per-month flat, you are trusting an informal system with \u20A61.2 million a year. The protection of knowing exactly where that money is \u2014 before you consider any other Newcondo feature \u2014 is worth more than the subscription many times over.",
      },
      {
        type: "p",
        text: "Rent should not be a thing you hope arrives. It should be a thing you watch arrive. That is the whole point of escrow, and it is the floor we build everything else on.",
      },
    ],
  },
  {
    slug: "five-questions-before-you-let-an-agent-list-your-property",
    title: "Five questions to ask before you let an agent list your property",
    excerpt:
      "Most owner-agent disputes are avoidable. They start with assumptions no one wrote down. Ask these five questions before you hand over a single key.",
    category: "Guides",
    author: { name: "Tunde Bello", role: "Owner Success, Newcondo" },
    date: "2026-05-14",
    dateLabel: "14 May 2026",
    readMins: 7,
    imageAlt: "Owner and agent reviewing a listing together",
    body: [
      {
        type: "p",
        text: "Almost every owner-agent fight we hear about could have been prevented in the first conversation. Not by distrust \u2014 by clarity. The damage usually comes from things both sides assumed but never said out loud. Here are five questions that put those assumptions on the table before anyone gets hurt.",
      },
      { type: "h2", text: "1. \u201CWho is allowed to list this property?\u201D" },
      {
        type: "p",
        text: "The single most expensive problem in Nigerian rentals is the same flat being marketed by three different agents to three different families. On moving day, two of them show up with receipts. On Newcondo, a property is GPS-marked and can have exactly one listing agent; everyone else promotes through tracked links. But even off-platform, get it in writing: one property, one agent of record. No exceptions.",
      },
      { type: "h2", text: "2. \u201CHow does rent reach me \u2014 and how fast?\u201D" },
      {
        type: "p",
        text: "Ask precisely how the money moves. Into whose account first? When does it reach yours? \u201CI\u2019ll bring it\u201D is not an answer \u2014 it is the start of a problem. If rent passes through an agent\u2019s personal account, you have handed a stranger an interest-free loan and a reason to delay. Insist that rent is collected into a held account and released directly to you.",
      },
      {
        type: "quote",
        text: "If you cannot describe exactly how money gets from the tenant to you, you do not have an agreement \u2014 you have a hope.",
      },
      { type: "h2", text: "3. \u201CWhat happens when the tenant damages something?\u201D" },
      {
        type: "p",
        text: "Decide the process before there is a problem. Who inspects? Who documents condition at move-in? Who approves repairs, and from whose money? Without a move-in inspection with photos, every future dispute becomes one person\u2019s word against another\u2019s \u2014 and the owner usually absorbs the loss.",
      },
      {
        type: "ul",
        items: [
          "Agree on a <strong>move-in inspection with photos</strong>, kept on record",
          "Decide who approves repairs and the spending limit",
          "Confirm how maintenance requests reach you \u2014 not at midnight, by phone",
        ],
      },
      { type: "h2", text: "4. \u201CWho is this tenant, really?\u201D" },
      {
        type: "p",
        text: "\u201CThey seem okay\u201D is how most bad tenancies begin. Before keys change hands, you want identity verification \u2014 NIN, BVN, or a government ID \u2014 and, ideally, some visibility into rental history. A tenant with two prior evictions will not volunteer that. A verified profile and a blacklist check will.",
      },
      { type: "h2", text: "5. \u201CWhat is written down, and where does it live?\u201D" },
      {
        type: "p",
        text: "A handwritten agreement witnessed by a neighbour will not protect you anywhere that matters. Ask for a properly structured tenancy agreement, digitally signed, and stored where you can retrieve it years later \u2014 including, if it ever comes to that, in court. If the answer is \u201Cwe\u2019ll sort the paperwork later,\u201D later never comes.",
      },
      { type: "h2", text: "The thread running through all five" },
      {
        type: "p",
        text: "Notice the pattern: every question replaces trust with a <strong>record</strong>. You are not insulting your agent by asking them \u2014 you are protecting the relationship from the misunderstandings that end most of them. The best agents welcome these questions, because clarity protects them too. Newcondo exists to make every one of these answers the default instead of a negotiation.",
      },
    ],
  },
  {
    slug: "managing-a-lagos-property-from-abroad",
    title: "Managing a Lagos property from abroad: a practical playbook",
    excerpt:
      "Owning in Lekki while living in London or Toronto does not have to mean flying blind. Here is how diaspora owners stay in control without a \u201Ctrusted person.\u201D",
    category: "Diaspora",
    author: { name: "Ngozi Eze", role: "Newcondo" },
    date: "2026-04-30",
    dateLabel: "30 April 2026",
    readMins: 8,
    imageAlt: "Owner managing a Nigerian property from a laptop abroad",
    body: [
      {
        type: "p",
        text: "You live in London. Your property is in Lekki. Between you sits a \u201Cproperty manager\u201D who calls when something breaks and goes quiet when rent is due. No dashboard, no record, no visibility \u2014 just trust. And trust, across five time zones, is not a system.",
      },
      {
        type: "p",
        text: "Newcondo was partly built for exactly this person. If you manage Nigerian property from abroad, here is a playbook that replaces hope with structure.",
      },
      { type: "h2", text: "Stop relying on a single trusted person" },
      {
        type: "p",
        text: "The diaspora model usually rests on one human \u2014 a cousin, an old friend, an agent \u201Cwho is like family.\u201D It works until it doesn\u2019t, and when it fails, it fails expensively and personally. The goal is not to find a more trustworthy person. It is to need <strong>no</strong> single point of trust at all, because the system itself holds the record.",
      },
      { type: "h2", text: "Put your rent on rails you can see" },
      {
        type: "p",
        text: "Rent collected into a held account and released directly to your Nigerian bank account means you no longer wait for someone to \u201Csend it across.\u201D You watch it land. The currency stays in naira, in your account, on a schedule \u2014 not subject to whether anyone remembered, or chose, to pay you this month.",
      },
      {
        type: "ul",
        items: [
          "Rent lands in <strong>your</strong> Nigerian account, not an intermediary\u2019s",
          "Every payment is timestamped and visible from anywhere in the world",
          "No more \u201CI\u2019ll transfer it when I\u2019m next at the bank\u201D",
        ],
      },
      { type: "h2", text: "Make the dashboard your eyes on the ground" },
      {
        type: "p",
        text: "Distance is really an information problem. When you can see payment history, tenant and agent activity, and maintenance requests in one place, the 8,000 kilometres stop mattering. You are not calling around for updates; the updates are already in front of you when you open the app over coffee in another country.",
      },
      {
        type: "quote",
        text: "Now I have a dashboard, a monthly call from my account manager, and I can see every payment. That peace of mind alone is worth the subscription.",
        cite: "Diaspora landlord, Lagos \u2014 based in Canada",
      },
      { type: "h2", text: "Handle maintenance without being there" },
      {
        type: "p",
        text: "Distance turns a leaking roof into a crisis, because you cannot drive over and look. The fix is a process that does not need you in the country: the tenant raises an issue in the app, a vetted contractor is dispatched, and you approve the quote from your phone. On Elite, emergencies are handled within 24 hours. You stay the decision-maker without being the errand-runner.",
      },
      { type: "h2", text: "Use a named human for the things software can\u2019t do" },
      {
        type: "p",
        text: "Some things still need a person \u2014 a quarterly check, a conversation with a difficult tenant, eyes on the compound. On Elite, a dedicated account manager calls you monthly and coordinates locally on your behalf. The difference from the old model is accountability: this is a named member of staff inside a system that records what they do, not a favour you are quietly hoping gets done.",
      },
      { type: "h2", text: "The shift, in one line" },
      {
        type: "p",
        text: "Managing from abroad has always meant trading control for distance. The playbook above trades it back. Your property is already yours \u2014 the point is to make the income, the records, and the peace of mind yours too, from wherever in the world you happen to be.",
      },
    ],
  },
];
