"use client";
// apps/admin/components/staff/ScopeEditor.tsx
// Role preset ± individual scopes, rendered entirely from ADMIN_MODULES.
// A new scope in backend-shared/constants/adminScopes.ts shows up here automatically.
import { useState } from "react";
import { ChevronDown, ChevronRight, Check } from "lucide-react";
import { ADMIN_MODULES, ADMIN_ROLES, resolveAdminScopes, type AdminRole, type AdminModuleDef, type AdminScopeDef } from "@/lib/scopes";

export interface ScopeDelta { granted: string[]; revoked: string[] }

export function ScopeEditor({ role, value, onChange, readOnly }: { role: AdminRole; value: ScopeDelta; onChange: (d: ScopeDelta) => void; readOnly?: boolean }) {
  const preset: readonly string[] = ADMIN_ROLES[role].scopes;
  const eff: string[] = [...resolveAdminScopes(role, value.granted, value.revoked)];
  const [open, setOpen] = useState<string[]>(ADMIN_MODULES.length ? [ADMIN_MODULES[0].id] : []);
  const locked = !!readOnly || role === "SUPER_ADMIN";
  const toggle = (key: string) => {
    if (locked) return;
    const on = eff.includes(key), inPreset = preset.includes(key);
    let g = value.granted.filter((x: string) => x !== key), r = value.revoked.filter((x: string) => x !== key);
    if (on && inPreset) r = [...r, key];      // remove a preset scope
    if (!on && !inPreset) g = [...g, key];    // add a scope outside the preset
    onChange({ granted: g, revoked: r });     // re-ticking/unticking a delta just clears it
  };
  return <div>{ADMIN_MODULES.map((m: AdminModuleDef) => {
    const isOpen = open.includes(m.id);
    const c = m.scopes.filter((s: AdminScopeDef) => eff.includes(s.key)).length;
    return <div key={m.id} className="a-scope-mod">
      <div className="a-scope-h" role="button" aria-expanded={isOpen} onClick={() => setOpen((o: string[]) => isOpen ? o.filter((x: string) => x !== m.id) : [...o, m.id])}>
        {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}{m.label}<span className="hint">{m.desc}</span><span className="cnt">{c}/{m.scopes.length}</span>
      </div>
      {isOpen && m.scopes.map((s: AdminScopeDef) => {
        const on = eff.includes(s.key), inP = preset.includes(s.key);
        return <div key={s.key} className={`a-scope${locked ? " locked" : ""}`} onClick={() => toggle(s.key)} role="checkbox" aria-checked={on} aria-disabled={locked}>
          <span className={`chk${on ? " on" : ""}`}>{on && <Check size={12} strokeWidth={3} />}</span>
          <div style={{ minWidth: 0 }}><b>{s.label}{on && !inP && <span className="tagx add">Added</span>}{!on && inP && <span className="tagx rem">Removed</span>}{s.risk === "high" && <span className="tagx risk">Sensitive</span>}</b>
            <p>{s.desc} · <span className="a-mono" style={{ fontSize: 11 }}>{s.key}</span></p></div>
        </div>;
      })}
    </div>;
  })}</div>;
}
