// apps/vendors/app/(dashboard)/layout.tsx
// Server gate: a valid session whose role is VENDOR. Owners, agents and
// renters who land here are sent to the platform app instead.
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@newcondo/auth";
import { VendorShell } from "@/components/shell/VendorShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "VENDOR") redirect(process.env.NEXT_PUBLIC_PLATFORM_URL ?? "https://newcondo.homes");
  // Suspense: the shell reads ?open=<jobId> (notification deep links) via useSearchParams.
  return <Suspense><VendorShell user={{ name: session.user.name ?? "", email: session.user.email ?? "" }}>{children}</VendorShell></Suspense>;
}
