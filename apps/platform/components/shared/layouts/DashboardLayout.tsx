"use client";

/* ============================================================
   DashboardLayout — the client shell rendered by app/(dashboard)/layout.tsx
   after the server-side auth gate. Wires: TanStack QueryProvider,
   RoleProvider (seeded from the session user), Sidebar, Topbar, Toaster.
   ============================================================ */
import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { QueryProvider } from "@/components/providers/query-provider";
import { RoleProvider } from "@/components/providers/role-provider";
import { Toaster } from "@newcondo/ui";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import type { Role } from "@/lib/dashboard/data";

interface SessionUserLike { role?: string | null; userType?: string | null; }

export default function DashboardLayout({ user, children }: { user?: SessionUserLike; children: ReactNode }) {
  const [mobileNav, setMobileNav] = useState(false);
  const initialRole = ((user?.role ?? user?.userType) as Role) || "OWNER";
  // Freeze the page while the mobile drawer is open. Without this a touch-drag
  // anywhere — over the drawer or the scrim — scrolls the dashboard behind it.
  useBodyScrollLock(mobileNav);
  return (
    <QueryProvider>
      <RoleProvider initialRole={initialRole}>
        <div className="flex min-h-screen bg-nc-background text-text-primary font-sans">
          {/* mobile scrim + drawer */}
          <AnimatePresence>
            {mobileNav && (
              <motion.div key="scrim" className="fixed inset-0 z-[55] overscroll-none bg-ink/35 min-[1001px]:hidden"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setMobileNav(false)}
                onTouchStart={() => setMobileNav(false)} />
            )}
          </AnimatePresence>
          <aside
            className={
              "fixed inset-y-0 left-0 z-[60] flex w-64 flex-col overflow-y-auto overscroll-contain bg-surface border-r border-border-hair px-3.5 pt-5 pb-3.5 " +
              "transition-transform duration-300 ease-nc max-[1000px]:shadow-pop " +
              (mobileNav ? "translate-x-0" : "max-[1000px]:-translate-x-full")
            }
          >
            <Sidebar onNavigate={() => setMobileNav(false)} />
          </aside>
          <div className="flex min-w-0 flex-1 flex-col min-[1001px]:ml-64">
            <Topbar onBurger={() => setMobileNav(true)} />
            <div className="mx-auto w-full max-w-[1180px] px-[clamp(14px,3.5vw,44px)] pt-6 pb-20">{children}</div>
          </div>
        </div>
        <Toaster />
      </RoleProvider>
    </QueryProvider>
  );
}
