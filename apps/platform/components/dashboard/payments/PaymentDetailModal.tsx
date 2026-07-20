"use client";

/* Full transaction detail. Receipt: lib/dashboard/receipt.ts — live backend
   returns a presigned S3 PDF (GET /payments/:id/receipt.pdf); preview mode
   renders a print-ready receipt window locally. */
import { Icon } from "@/components/ui/icon";
import { downloadReceipt } from "@/lib/dashboard/receipt";
import { Modal } from "@/components/dashboard/Modal";
import { DBtn, StatusBadge, KV, Banner } from "@/components/dashboard/primitives";
import { signNgn } from "@/lib/dashboard/format";
import type { Role, Tx } from "@/lib/dashboard/data";

const TYPE: Record<string, string> = { RENT_IN: "Rent received", RENT_OUT: "Rent paid", COMMISSION: "Commission", MARKING: "Marking service", WITHDRAW: "Withdrawal", FEE: "Platform fee" };

export function PaymentDetailModal({ row, role, onClose }: { row: Tx; role: Role; onClose: () => void }) {
  return (
    <Modal title={TYPE[row.type] ?? "Transaction"} sub={row.desc} onClose={onClose}
      footer={<>
        <DBtn variant="line" onClick={() => downloadReceipt(row)}>
          <Icon name="download" size={14} />Receipt
        </DBtn>
        <DBtn onClick={onClose}>Done</DBtn>
      </>}>
      <div className="pb-4 pt-1.5 text-center">
        <div className={"font-mono text-[30px] font-semibold tracking-[-0.02em] " + (row.amount > 0 ? "text-green-dark" : "text-text-primary")}>{signNgn(row.amount)}</div>
        <div className="mt-2"><StatusBadge s={row.status} /></div>
      </div>
      <KV k="Date" v={row.date} />
      <KV k="Reference" v={`NC-TX-${row.id.toUpperCase()}-2026`} mono />
      {row.fee != null && <KV k="Platform commission" v={signNgn(row.fee)} mono />}
      {row.fee != null && <KV k="Net to you" v={<span className="text-green-dark">{signNgn(row.net)}</span>} mono />}
      {row.note && <KV k="Note" v={row.note} />}
      <KV k="Channel" v="Flutterwave · virtual account" />
      <KV k="Escrow window" v={row.type === "WITHDRAW" || row.type === "FEE" ? "Not applicable" : "24h · cleared"} />
      {role !== "RENTER" && row.type !== "WITHDRAW" && (
        <div className="mt-3.5">
          <Banner icon="info">Something look wrong? Open a dispute and the funds trail is reviewed by Newcondo support — never settle off-platform.</Banner>
        </div>
      )}
    </Modal>
  );
}
