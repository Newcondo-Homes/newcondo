"use client";

/* Receipt download.
   Live backend: GET /api/v1/payments/:id/receipt.pdf → backend renders a
   branded PDF (pdfkit), caches it in S3, returns a presigned URL we open.
   Preview/fallback: render the same receipt as a print-ready window locally
   so the button always works. */
import { toast } from "@newcondo/ui";
import { getReceiptPdfUrl, isLiveBackend } from "@/lib/api/dashboard";
import { ngn, signNgn } from "@/lib/dashboard/format";
import type { Tx } from "@/lib/dashboard/data";

export async function downloadReceipt(row: Tx) {
  if (isLiveBackend) {
    try {
      const { url } = await getReceiptPdfUrl(row.id);
      window.open(url, "_blank", "noopener");
      return;
    } catch (e) { console.warn("[receipt] backend PDF unavailable, using local render:", e); }
  }
  const w = window.open("", "_blank", "noopener,width=420,height=640");
  if (!w) { toast.error("Allow pop-ups to download receipts"); return; }
  const rows = [
    ["Reference", `NC-TX-${row.id.toUpperCase()}-2026`],
    ["Date", row.date],
    ["Description", row.desc],
    ["Amount", signNgn(row.amount)],
    ...(row.fee != null ? [["Platform commission", signNgn(row.fee)], ["Net", signNgn(row.net)]] : []),
    ["Status", row.status],
    ["Channel", "Flutterwave · virtual account"],
    ...(row.note ? [["Note", row.note]] : []),
  ] as [string, string][];
  w.document.write(`<!DOCTYPE html><html><head><title>Newcondo receipt — ${row.id}</title><style>
    body{font-family:ui-sans-serif,system-ui;background:#F7F6EF;color:#131313;margin:0;padding:0}
    .head{background:#131313;color:#F9F9EF;padding:22px 28px;font-weight:700;font-size:20px;letter-spacing:-.04em}
    .card{background:#fff;margin:20px;border-radius:16px;border:1px solid rgba(0,0,0,.06);padding:20px}
    .amt{font-size:26px;font-weight:700;letter-spacing:-.02em;text-align:center;padding:6px 0 14px}
    .kv{display:flex;justify-content:space-between;gap:16px;font-size:13px;padding:8px 0;border-bottom:1px solid rgba(0,0,0,.06)}
    .kv:last-child{border-bottom:0}.k{color:#8a877c}.v{font-weight:600;text-align:right}
    .foot{margin:0 20px 20px;font-size:11px;color:#8a877c;line-height:1.5}
    @media print{.no-print{display:none}}
    .no-print{margin:0 20px 16px}.no-print button{background:#131313;color:#F9F9EF;border:0;border-radius:999px;padding:10px 18px;font-weight:600;cursor:pointer}
  </style></head><body>
  <div class="head">newcondo</div>
  <div class="card"><div class="amt">${signNgn(row.amount)}</div>
  ${rows.map(([k, v]) => `<div class="kv"><span class="k">${k}</span><span class="v">${v}</span></div>`).join("")}</div>
  <div class="no-print"><button onclick="window.print()">Save as PDF</button></div>
  <div class="foot">Escrowed by Newcondo. Never settle rent off-platform — protection only applies to payments made through your Newcondo dashboard.</div>
  </body></html>`);
  w.document.close();
  toast.success("Receipt ready", { description: `Use "Save as PDF" in the receipt window. ${ngn(row.amount)} · ${row.date}` });
}
