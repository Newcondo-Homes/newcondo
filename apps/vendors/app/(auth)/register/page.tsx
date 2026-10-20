"use client";
// apps/vendors/app/(auth)/register/page.tsx
// Three short steps: who you are (company / individual + provider type) →
// contact + login → review. POST /vendors/register creates the VENDOR user +
// Vendor row (PENDING), then we sign in and land on Settings to finish
// documents, bank and service areas.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, User, ArrowRight, Loader2 } from "lucide-react";
import { signIn } from "@newcondo/auth/client";
import { registerVendor } from "@/lib/api/vendor";
import { VENDORS, type VendorProviderType } from "@/lib/constants";

const TYPES = Object.entries(VENDORS.providerTypes) as [VendorProviderType, (typeof VENDORS.providerTypes)[VendorProviderType]][];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<"COMPANY" | "INDIVIDUAL">("COMPANY");
  const [type, setType] = useState<VendorProviderType | "">("");
  const [f, setF] = useState({ businessName: "", contactName: "", email: "", phone: "", password: "", cacNumber: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const step1ok = f.contactName.length > 1 && /\S+@\S+\.\S+/.test(f.email) && /^(\+?234|0)[789][01]\d{8}$/.test(f.phone.replace(/\s/g, "")) && f.password.length >= 8 && /\d/.test(f.password) && (kind === "INDIVIDUAL" || f.businessName.length > 1);

  const submit = async () => {
    if (!type) return;
    setBusy(true);
    try {
      await registerVendor({ ...f, phone: f.phone.replace(/\s/g, ""), businessName: kind === "COMPANY" ? f.businessName : f.contactName, providerType: type, cacNumber: f.cacNumber || undefined });
      const r = await signIn("credentials", { email: f.email.trim().toLowerCase(), password: f.password, redirect: false });
      if (r?.error) throw new Error("Account created — please sign in");
      toast.success("Welcome to the vendor network", { description: "Finish your bank and service areas to start receiving clients." });
      router.replace("/settings");
    } catch (e) { toast.error("Couldn't create your account", { description: (e as Error).message }); }
    finally { setBusy(false); }
  };

  return <main className="auth-wrap"><div className="auth-card">
    <div className="auth-brand"><img src="/logo-mark-dark.png" alt="" />newcondo<span className="v-tag">vendors</span></div>
    <div className="m-steps" style={{ marginTop: 18 }}>{[0, 1, 2].map((i) => <div key={i} className="seg"><i style={{ width: step >= i ? "100%" : 0 }} /></div>)}</div>
    {step === 0 && <>
      <h1>What do you do?</h1><p className="lead">You&apos;ll be matched with subscribed properties near you.</p>
      <div className="grid g-2" style={{ gap: 10, marginBottom: 14 }}>
        {(["COMPANY", "INDIVIDUAL"] as const).map((k) => <div key={k} className={`opt${kind === k ? " sel" : ""}`} style={{ marginBottom: 0 }} onClick={() => { setKind(k); setType(""); }}>
          <span className="opt-ic">{k === "COMPANY" ? <Building2 size={18} /> : <User size={18} />}</span><div><b>{k === "COMPANY" ? "Company" : "Individual"}</b><p>{k === "COMPANY" ? "Registered business" : "Working on your own"}</p></div></div>)}
      </div>
      {TYPES.filter(([, t]) => t.kind === kind).map(([id, t]) => <div key={id} className={`opt${type === id ? " sel" : ""}`} onClick={() => setType(id)}><div><b>{t.label}</b><p>{t.services.map((s) => VENDORS.services[s].label).join(" · ")}</p></div></div>)}
      <button className="btn btn-dark" style={{ width: "100%" }} disabled={!type} onClick={() => setStep(1)}>Continue<ArrowRight size={15} /></button>
    </>}
    {step === 1 && <>
      <h1>Your details</h1><p className="lead">Owners see your business name. Your phone stays private.</p>
      {kind === "COMPANY" && <div className="f-row"><div className="field"><label>Business name</label><input className="inp" value={f.businessName} onChange={set("businessName")} /></div><div className="field"><label>CAC number <span className="hint">(optional)</span></label><input className="inp" value={f.cacNumber} onChange={set("cacNumber")} /></div></div>}
      <div className="field"><label>{kind === "COMPANY" ? "Contact person" : "Full name"}</label><input className="inp" autoComplete="name" value={f.contactName} onChange={set("contactName")} /></div>
      <div className="f-row"><div className="field"><label>Email</label><input className="inp" type="email" autoComplete="email" value={f.email} onChange={set("email")} /></div><div className="field"><label>Phone</label><input className="inp" inputMode="tel" autoComplete="tel" placeholder="0803 000 0000" value={f.phone} onChange={set("phone")} /></div></div>
      <div className="field"><label>Password</label><input className="inp" type="password" autoComplete="new-password" value={f.password} onChange={set("password")} /><span className="hint">8+ characters with letters and numbers.</span></div>
      <div style={{ display: "flex", gap: 10 }}><button className="btn btn-line" onClick={() => setStep(0)}>Back</button><button className="btn btn-dark" style={{ flex: 1 }} disabled={!step1ok} onClick={() => setStep(2)}>Continue<ArrowRight size={15} /></button></div>
    </>}
    {step === 2 && type && <>
      <h1>Check and join</h1><p className="lead">Newcondo verifies every provider before matching.</p>
      <div className="kv"><span className="k">Provider</span><span className="v">{VENDORS.providerTypes[type].label}</span></div>
      <div className="kv"><span className="k">Name</span><span className="v">{kind === "COMPANY" ? f.businessName : f.contactName}</span></div>
      <div className="kv"><span className="k">Service hours</span><span className="v">Mon – Thu & Sat, 9:00 – 17:00</span></div>
      <div className="kv"><span className="k">How you&apos;re paid</span><span className="v">After the visit code is verified</span></div>
      <p className="hint" style={{ margin: "12px 0 16px" }}>By joining you agree to Newcondo&apos;s vendor terms: visits are verified with a code from the tenant, owner or listing agent, and only verified visits are paid.</p>
      <div style={{ display: "flex", gap: 10 }}><button className="btn btn-line" onClick={() => setStep(1)}>Back</button><button className="btn btn-dark" style={{ flex: 1 }} disabled={busy} onClick={submit}>{busy && <Loader2 size={15} className="spin" />}Create vendor account</button></div>
    </>}
    <p className="auth-foot">Already with us? <Link href="/login">Sign in</Link></p>
  </div></main>;
}
