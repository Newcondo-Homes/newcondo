"use client";

/* Lightweight SVG charts — PLACEHOLDERS for real analytics.
   TODO(backend): feed from GET /api/analytics/* ; swap for recharts if
   richer interactivity is needed. Dummy series live in lib/dashboard/data. */

export interface Series { labels: string[]; values: number[]; }

export function LineChart({ series, h = 150 }: { series: Series; h?: number }) {
  const w = 560, pad = 8;
  const max = Math.max(...series.values) * 1.15 || 1;
  const pts = series.values.map((v, i) => [pad + (i * (w - pad * 2)) / (series.values.length - 1), h - pad - (v / max) * (h - pad * 2)] as const);
  const path = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = path + ` L ${pts[pts.length - 1][0]} ${h} L ${pts[0][0]} ${h} Z`;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="block h-auto w-full">
        <defs><linearGradient id="nclg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#00B473" stopOpacity=".16" /><stop offset="1" stopColor="#00B473" stopOpacity="0" /></linearGradient></defs>
        {[0.25, 0.5, 0.75].map((f) => <line key={f} x1={pad} x2={w - pad} y1={h * f} y2={h * f} stroke="rgba(0,0,0,.05)" />)}
        <path d={area} fill="url(#nclg)" />
        <path d={path} fill="none" stroke="#008F5A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill="#fff" stroke="#008F5A" strokeWidth="2" />)}
      </svg>
      <div className="mt-1.5 flex justify-between text-[11px] font-medium text-text-tertiary max-sm:text-[10px]">
        {series.labels.map((l) => <span key={l}>{l}</span>)}
      </div>
    </div>
  );
}

export function BarChart({ series, h = 150 }: { series: Series; h?: number }) {
  const w = 560, pad = 6, n = series.values.length, bw = ((w - pad * 2) / n) * 0.55;
  const max = Math.max(...series.values) * 1.1 || 1;
  const top = Math.max(...series.values);
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="block h-auto w-full">
        {series.values.map((v, i) => {
          const x = pad + (i * (w - pad * 2)) / n + ((w - pad * 2) / n - bw) / 2;
          const bh = (v / max) * (h - 14);
          return <rect key={i} className="transition-opacity hover:opacity-75" x={x} y={h - bh} width={bw} height={bh} rx="6" fill={v === top ? "#131313" : "#DDD8C8"} />;
        })}
      </svg>
      <div className="mt-1.5 flex justify-between text-[11px] font-medium text-text-tertiary max-sm:text-[10px]">
        {series.labels.map((l) => <span key={l}>{l}</span>)}
      </div>
    </div>
  );
}
