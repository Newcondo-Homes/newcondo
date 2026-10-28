// apps/admin/app/(dashboard)/layout.tsx
// Server gate: a valid session whose role is ADMIN. Scopes come from /admin/me (client).
//
// A signed-in NON-admin used to be redirect()ed to NEXT_PUBLIC_PLATFORM_URL. When that
// points at the same origin (e.g. both on localhost:3000), or the proxy bounces /login
// back to /overview, the browser loops "/ → /overview → …" and shows nothing.
// Now we render a clear screen with the signed-in email and a sign-out button instead.
import { redirect } from "next/navigation";
import { auth } from "@newcondo/auth";
import { AdminShell } from "@/components/shell/AdminShell";
import { NoAccess } from "@/components/shell/NoAccess";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN") {
    return <NoAccess title="This isn’t a staff account" body={`You’re signed in as ${session.user.email ?? "another user"}${role ? ` (${role.toLowerCase()})` : ""}. Sign out, then sign in with your NewCondo staff email.`} />;
  }
  return <AdminShell user={{ name: session.user.name ?? "", email: session.user.email ?? "" }}>{children}</AdminShell>;
}
