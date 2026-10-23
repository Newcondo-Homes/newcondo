// apps/vendors/app/(dashboard)/layout.tsx
// Server gate + data preload. A valid session whose role is VENDOR; owners,
// agents and renters who land here are sent to the platform app instead.
// This layout persists across client-side navigation, so the auth check and
// the preload run once per full page load — switching pages never re-runs it.
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@newcondo/auth";
import { VendorShell } from "@/components/shell/VendorShell";
import { VendorDataProvider } from "@/components/providers/VendorDataProvider";
import { preloadVendorData } from "@/lib/server/preload";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "VENDOR") redirect(process.env.NEXT_PUBLIC_PLATFORM_URL ?? "https://newcondo.homes");
  const state = await preloadVendorData(session.accessToken);
  // Suspense: the shell reads ?open=<jobId> (notification deep links) via useSearchParams.
  return <VendorDataProvider state={state} accessToken={session.accessToken}>
    <Suspense><VendorShell user={{ name: session.user.name ?? "", email: session.user.email ?? "" }}>{children}</VendorShell></Suspense>
  </VendorDataProvider>;
}
