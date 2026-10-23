"use client";
// apps/admin/app/(auth)/login/page.tsx — shared NextAuth credentials provider; the layout then requires role ADMIN.
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { signIn } from "@newcondo/auth/client";

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/overview";
  const [busy, setBusy] = useState(false);
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const r = await signIn("credentials", { loginType: "email", email: String(f.get("email")).trim().toLowerCase(), password: String(f.get("password")), redirect: false });
    setBusy(false);
    if (r?.error) { toast.error("Couldn't sign you in", { description: "Check your email and password." }); return; }
    router.replace(next.startsWith("/") ? next : "/overview");
  };
  return <form className="auth-card" onSubmit={onSubmit}>
    <div className="auth-brand"><img src="/logo-mark-dark.png" alt="" />newcondo<span className="a-tag">admin</span></div>
    <h1>Staff sign in</h1>
    <p className="lead">For the Newcondo team only. Every action here is recorded.</p>
    <div className="field"><label htmlFor="email">Work email</label><input id="email" name="email" type="email" autoComplete="email" className="inp" required /></div>
    <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" className="inp" required /></div>
    <button className="btn btn-dark" style={{ width: "100%" }} disabled={busy}>{busy && <Loader2 size={15} className="spin" />}Sign in</button>
    <p className="auth-foot">No account? Ask a super admin to invite you.</p>
  </form>;
}
export default function LoginPage() { return <main className="auth-wrap"><Suspense><LoginForm /></Suspense></main>; }
