"use client";
// apps/admin/app/(auth)/accept-invite/[token]/page.tsx
// Opened from the branded invite email. Sets name + password (POST /admin/staff/accept-invite, public,
// rate-limited, single-use), then signs in. The inviter sees the person turn Active in Staff & access.
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { signIn } from "@newcondo/auth/client";
import { A } from "@/lib/api/admin";

export default function AcceptInvite({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [name, setName] = useState(""); const [pw, setPw] = useState(""); const [pw2, setPw2] = useState(""); const [busy, setBusy] = useState(false);
  const strong = pw.length >= 10 && /[A-Z]/.test(pw) && /\d/.test(pw);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!strong || pw !== pw2) return;
    setBusy(true);
    try {
      const { email } = await A.acceptInvite({ token, name: name.trim(), password: pw });
      const r = await signIn("credentials", { loginType: "email", email, password: pw, redirect: false });
      if (r?.error) throw new Error("Account created — please sign in.");
      toast.success("Welcome to the team", { description: "Your admin account is active." });
      router.replace("/overview");
    } catch (err) { toast.error("Couldn’t finish setup", { description: (err as Error).message }); setBusy(false); }
  };
  return <main className="auth-wrap"><form className="auth-card" onSubmit={submit}>
    <div className="auth-brand"><img src="/logo-mark-dark.png" alt="" />newcondo<span className="a-tag">admin</span></div>
    <h1>Set up your account</h1>
    <p className="lead">This link works once and expires 72 hours after it was sent.</p>
    <div className="field"><label>Full name</label><input className="inp" value={name} onChange={(e) => setName(e.target.value)} required /></div>
    <div className="field"><label>Password</label><input className="inp" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} required /><span className="hint" style={{ color: pw && !strong ? "var(--warning)" : undefined }}>At least 10 characters, one capital letter and one number.</span></div>
    <div className="field"><label>Confirm password</label><input className={`inp${pw2 && pw !== pw2 ? " err" : ""}`} type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} required /></div>
    <button className="btn btn-dark" style={{ width: "100%" }} disabled={busy || !strong || pw !== pw2 || name.trim().length < 2}>{busy && <Loader2 size={15} className="spin" />}Create password &amp; sign in</button>
  </form></main>;
}
