"use client";
// apps/vendors/app/(auth)/login/page.tsx
// Email + password through the shared NextAuth credentials provider
// (@newcondo/auth). The dashboard layout then checks role === VENDOR.
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { signIn } from "@newcondo/auth/client";

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/dashboard";
  const [busy, setBusy] = useState(false);
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const r = await signIn("credentials", { email: String(f.get("email")).trim().toLowerCase(), password: String(f.get("password")), redirect: false });
    setBusy(false);
    if (r?.error) { toast.error("Couldn't sign you in", { description: "Check your email and password." }); return; }
    router.replace(next.startsWith("/") ? next : "/dashboard"); // never redirect off-site
  };
  return <form className="auth-card" onSubmit={onSubmit}>
    <div className="auth-brand"><img src="/logo-mark-dark.png" alt="" />newcondo<span className="v-tag">vendors</span></div>
    <h1>Sign in</h1>
    <p className="lead">For fumigation, waste and inspection providers working with Newcondo.</p>
    <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" className="inp" required /></div>
    <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" className="inp" required /></div>
    <button className="btn btn-dark" style={{ width: "100%" }} disabled={busy}>{busy && <Loader2 size={15} className="spin" />}Sign in</button>
    <p className="auth-foot">New provider? <Link href="/register">Join the vendor network</Link></p>
  </form>;
}

export default function LoginPage() {
  return <main className="auth-wrap"><Suspense><LoginForm /></Suspense></main>;
}
