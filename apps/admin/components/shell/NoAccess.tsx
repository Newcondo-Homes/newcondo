"use client";
// apps/admin/components/shell/NoAccess.tsx — full-page states that never leave the screen blank.
import { LogOut, RefreshCw } from "lucide-react";
import { signOut } from "@newcondo/auth/client";
import { clearViews } from "@/lib/viewState";
import type { ReactNode } from "react";

export function Boot({ label = "Loading your dashboard…" }: { label?: string }) {
  return <main className="a-boot"><div className="a-boot-in"><span className="a-boot-mark"><img src="/logo-mark-dark.png" alt="" /></span><p>{label}</p></div></main>;
}

export function NoAccess({ title, body, detail, onRetry }: { title: string; body: ReactNode; detail?: ReactNode; onRetry?: () => void }) {
  return <main className="auth-wrap"><div className="auth-card">
    <div className="auth-brand"><img src="/logo-mark-dark.png" alt="" />newcondo<span className="a-tag">admin</span></div>
    <h1>{title}</h1>
    <p className="lead">{body}</p>
    {detail && <div className="a-diag">{detail}</div>}
    <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
      {onRetry && <button className="btn btn-line" onClick={onRetry}><RefreshCw size={15} />Try again</button>}
      <button className="btn btn-dark" onClick={() => { clearViews(); void signOut({ redirectTo: "/login" }); }}><LogOut size={15} />Sign out</button>
    </div>
  </div></main>;
}
