// apps/admin/app/(dashboard)/layout.tsx
// Server gate: valid session with role ADMIN. Scopes are fetched client-side
// from /admin/me (so a freeze or permission change applies on the next poll).
import { redirect } from "next/navigation";
import { auth } from "@newcondo/auth";
import { AdminShell } from "@/components/shell/AdminShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect(process.env.NEXT_PUBLIC_PLATFORM_URL ?? "https://newcondo.homes");
  return <AdminShell user={{ name: session.user.name ?? "", email: session.user.email ?? "" }}>{children}</AdminShell>;
}
