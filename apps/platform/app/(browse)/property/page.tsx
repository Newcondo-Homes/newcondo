import type { Metadata } from "next";
import { Suspense } from "react";
import Navbar from "@/components/shared/navigation/Navbar";
import { BrowseGrid } from "@/components/browse/BrowseGrid";

/* ============================================================
   /property — public browse grid.

   Open to every signed-in role (owner, agent, renter). The grid only
   ever contains PUBLISHED + boundaryVerified + admin-APPROVED
   properties: that filter lives in publicBrowseService.browseProperties()
   on the server, so "only marked properties can be listed" holds even
   against a hand-crafted request.

   Agents see a Promote button on each card (BrowsePropertyCard).

   NOTE: this replaces the previous generic gray-50 layout with the
   NewCondo surface — cream page, white 28px cards, ink type — so browse
   matches the dashboard and marketing site instead of looking like a
   different product.
   ============================================================ */

export const metadata: Metadata = {
  title: "Browse verified properties | NewCondo",
  description:
    "Every listing here has verified GPS marking, a named listing agent, and escrow-protected rent. No fake listings, no double-booking.",
};

export default function BrowsePropertiesPage() {
  return (
    <div className="min-h-screen bg-nc-background">
      <Navbar />
      <main className="mx-auto w-full max-w-[1440px] px-[clamp(16px,4vw,44px)] py-[clamp(20px,3vh,36px)]">
        <header className="mb-[clamp(18px,2.5vh,28px)]">
          <h1 className="m-0 text-[clamp(26px,3.2vw,40px)] font-bold leading-[1.02] tracking-[-0.04em] text-text-primary text-balance">
            Verified properties, not random online posts
          </h1>
          <p className="mt-2.5 max-w-[62ch] text-[15px] leading-[1.55] text-text-secondary max-sm:text-[14px]">
            Every home below has its location verified on the map, one accountable listing agent, and rent
            held in escrow for 24 hours after you pay.
          </p>
        </header>

        {/* BrowseGrid owns all filter state and reads useSearchParams-free
            local state, but useBrowse runs client-side — Suspense keeps the
            server render from blocking on it. */}
        <Suspense fallback={null}>
          <BrowseGrid />
        </Suspense>
      </main>
    </div>
  );
}
