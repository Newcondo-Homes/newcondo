"use client";
// Finish & verify a visit: 1) photos of the work (S3, presigned) →
// 2) the visit code (6 digits) or the QR from the tenant / owner / agent's
// phone → 3) payout outcome. POST /vendors/me/jobs/:id/verify completes the
// job and, for INSTANT vendors, sends the transfer in the same request.
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Check, ArrowRight, AlertTriangle, Loader2 } from "lucide-react";
import { Modal, Tabs, SkeletonRows } from "@/components/ui/primitives";
import { useJob, useMe, useRefreshJobs } from "@/hooks/useVendor";
import { uploadJobPhotos, verifyVisit } from "@/lib/api/vendor";
import { naira, VENDORS } from "@/lib/constants";
import { svcLabel } from "./JobRow";
import { QrScanner } from "./QrScanner";

function CodeBoxes({ value, onChange, error }: { value: string; onChange: (v: string) => void; error: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const n = VENDORS.codes.length;
  const set = (i: number, raw: string) => {
    const d = raw.replace(/\D/g, "");
    if (d.length > 1) { onChange(d.slice(0, n)); refs.current[Math.min(n - 1, d.length)]?.focus(); return; }
    const arr = value.padEnd(n, " ").split(""); arr[i] = d || " ";
    onChange(arr.join("").trimEnd());
    if (d && i < n - 1) refs.current[i + 1]?.focus();
  };
  return <div className={`v-code${error ? " err" : ""}`}>{Array.from({ length: n }).map((_, i) =>
    <input key={i} ref={(el) => { refs.current[i] = el; }} inputMode="numeric" autoComplete="one-time-code" maxLength={n} aria-label={`Digit ${i + 1}`} value={(value[i] ?? "").trim()}
      onChange={(e) => set(i, e.target.value)} onKeyDown={(e) => { if (e.key === "Backspace" && !(value[i] ?? "").trim() && i > 0) refs.current[i - 1]?.focus(); }} />)}
  </div>;
}

export function VerifyVisitSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: job } = useJob(id);
  const { data: me } = useMe();
  const refresh = useRefreshJobs();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [mode, setMode] = useState<"code" | "qr">("code");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [photos, setPhotos] = useState<number | null>(null);
  const [result, setResult] = useState<{ payout: string; receiveNaira?: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = useCallback(async (value: string) => {
    if (!job) return;
    setBusy(true); setErr("");
    try {
      const r = await verifyVisit(job.id, value);
      setResult(r); setStep(2); await refresh();
      if (r.payout === "PROCESSING") toast.success("Visit verified — payment sent", { description: `${naira(r.receiveNaira ?? job.receive)} is on its way to your bank.` });
      else if (r.payout === "BATCHED") toast.success("Visit verified", { description: "Added to today's 6:00 pm payout." });
      else toast.warning("Visit verified — transfer retrying", { description: "We'll keep trying and notify you when it lands." });
    } catch (e) { setErr((e as Error).message); if (mode === "qr") setMode("code"); }
    finally { setBusy(false); }
  }, [job, mode, refresh]);
  const onScan = useCallback((t: string) => void submit(t), [submit]);

  if (!job) return <Modal title="Verify this visit" onClose={onClose}><SkeletonRows n={3} /></Modal>;
  const count = photos ?? job.photoCount;
  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    const t = toast.loading(`Uploading ${files.length} photo(s)…`);
    try { const n = await uploadJobPhotos(job.id, Array.from(files)); setPhotos(n); toast.success("Photos uploaded", { id: t, description: "Only the owner and Newcondo can see them." }); }
    catch (e) { toast.error("Upload failed", { id: t, description: (e as Error).message }); }
  };

  return <Modal title={step === 2 ? "Visit confirmed" : "Verify this visit"} sub={step === 2 ? undefined : `${svcLabel(job.service)} · ${job.property}`} onClose={onClose}
    footer={step === 0 ? <><button className="btn btn-line" onClick={onClose}>Cancel</button><button className="btn btn-dark" disabled={count < job.minPhotos} onClick={() => setStep(1)}>Continue<ArrowRight size={15} /></button></>
      : step === 1 ? <><button className="btn btn-line" onClick={() => setStep(0)}>Back</button>{mode === "code" && <button className="btn btn-dark" disabled={code.length < VENDORS.codes.length || busy} onClick={() => submit(code)}>{busy ? <Loader2 size={15} className="spin" /> : <Check size={15} />}Confirm code</button>}</>
      : <button className="btn btn-dark" onClick={onClose}>Back to jobs</button>}>
    {step < 2 && <div className="m-steps"><div className="seg"><i style={{ width: "100%" }} /></div><div className="seg"><i style={{ width: step >= 1 ? "100%" : 0 }} /></div></div>}
    {step === 0 && <>
      <p className="v-lead">Snap the work before you ask for the code. The owner sees these in their dashboard.</p>
      <div className="v-photos">
        {Array.from({ length: Math.max(job.minPhotos, count + 1) }).map((_, i) => i < count
          ? <div key={i} className="v-photo done"><Check size={18} /><span>Photo {i + 1}</span></div>
          : <button key={i} className="v-photo" onClick={() => fileRef.current?.click()}><Camera size={20} /><span>{i < job.minPhotos ? "Required" : "Add more"}</span></button>)}
      </div>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" multiple hidden onChange={(e) => { void upload(e.target.files); e.target.value = ""; }} />
      <p className="hint" style={{ margin: "10px 0 0" }}>At least {job.minPhotos} photo(s) of the work.</p>
    </>}
    {step === 1 && <>
      <div style={{ marginBottom: 16 }}><Tabs value={mode} onChange={setMode} items={[{ id: "code", label: "Enter code" }, { id: "qr", label: "Scan QR" }]} /></div>
      {mode === "code" ? <>
        <p className="v-lead">Ask the tenant, owner or listing agent to open <b>Newcondo → Services → Visit code</b> and read you the {VENDORS.codes.length} digits.</p>
        <CodeBoxes value={code} onChange={(c) => { setCode(c); setErr(""); }} error={!!err} />
        {err && <div className="err-msg" style={{ justifyContent: "center", marginTop: 10 }}><AlertTriangle size={13} />{err}</div>}
        <p className="hint" style={{ textAlign: "center", margin: "12px 0 0" }}>Codes only work today, for this visit.</p>
      </> : busy ? <SkeletonRows n={1} h={220} /> : <QrScanner onResult={onScan} />}
    </>}
    {step === 2 && <div className="v-done">
      <span className="v-done-ic"><Check size={28} /></span>
      <b>{naira(result?.receiveNaira ?? job.receive)}</b>
      <p>{result?.payout === "BATCHED" ? "Added to today's payout. Everything you verify today is sent together at 6:00 pm — one transfer fee instead of one per job." : `On its way to ${me?.bank.bankName ?? "your bank"} ${me?.bank.accountNumberMasked ?? ""}. It usually lands within minutes.`}</p>
      <div className="fee-box" style={{ width: "100%" }}><span>Job fee {naira(job.cost)} − Flutterwave transfer fee</span><b>{naira(job.receive)}</b></div>
    </div>}
  </Modal>;
}
