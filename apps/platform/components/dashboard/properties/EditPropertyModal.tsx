"use client";

/* Edit property — title/rent, per-flat Vacant/Under-construction status
   (occupied flats are locked; they update from payments), delete listing.
   TODO(backend): PATCH /api/properties/:id · PATCH /api/properties/:id/flats
   DELETE /api/properties/:id (soft delete; marking record stays). */
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { toast } from "@newcondo/ui";
import { Modal, ConfirmDialog } from "@/components/dashboard/Modal";
import { DBtn, StatusBadge, Banner, Thumb } from "@/components/dashboard/primitives";
import { NCSelect, Field, inputCls } from "@/components/dashboard/NCSelect";
import type { FlatUnit } from "@/lib/dashboard/data";

export interface EditPayload { title: string; price: number; units: FlatUnit[]; }

export function EditPropertyModal({ propTitle, propPrice, units, agentOwner, onSave, onDelete, onClose }: {
  propTitle: string; propPrice: number; units: FlatUnit[]; agentOwner?: string;
  onSave: (f: EditPayload) => void; onDelete: () => void; onClose: () => void;
}) {
  const [f, setF] = useState({ title: propTitle, price: String(propPrice), units: units.map((u) => ({ ...u })) });
  const [del, setDel] = useState(false);
  const setUnit = (i: number, status: FlatUnit["status"]) => setF((x) => ({ ...x, units: x.units.map((u, j) => (j === i ? { ...u, status } : u)) }));
  const save = () => {
    if (!f.title.trim()) { toast.error("Title is required"); return; }
    if (!+f.price || +f.price <= 0) { toast.error("Enter a valid rent"); return; }
    onClose();
    onSave({ title: f.title, price: +f.price, units: f.units });
    toast.promise(new Promise((res) => setTimeout(res, 1300)), {
      loading: "Saving changes…",
      success: "Property updated — flats under construction are hidden from renters.",
      error: "Could not save changes",
    });
  };
  return (
    <Modal wide title="Edit property" sub={propTitle} onClose={onClose}
      footer={<>
        <DBtn variant="ghost" className="!text-danger max-sm:!flex-none sm:mr-auto" onClick={() => setDel(true)}><Icon name="trash-2" size={15} />Delete listing</DBtn>
        <DBtn variant="line" onClick={onClose}>Cancel</DBtn>
        <DBtn onClick={save}>Save changes</DBtn>
      </>}>
      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        <Field label="Listing title"><input className={inputCls()} value={f.title} onChange={(e) => setF((x) => ({ ...x, title: e.target.value }))} /></Field>
        <Field label="Rent (₦ / year)"><input className={inputCls()} type="number" value={f.price} onChange={(e) => setF((x) => ({ ...x, price: e.target.value }))} /></Field>
      </div>
      {f.units.length > 0 && (<>
        <div className="mb-2 mt-0.5 text-[13px] font-semibold">Flats — set which are ready to rent</div>
        {f.units.map((u, i) => (
          <div key={u.n} className="mb-2 flex flex-wrap items-center gap-3 rounded-[14px] border border-border-hair p-3">
            <Thumb size={40} icon={u.status === "UNDER_CONSTRUCTION" ? "hammer" : "home"} />
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold">{u.n}</div>
              <div className="mt-0.5 text-[12.5px] text-text-tertiary">
                {u.status === "OCCUPIED" ? `${u.renter} · till ${u.till}` : u.status === "VACANT" ? "Visible to renters" : "Hidden from renters"}
              </div>
            </div>
            {u.status === "OCCUPIED" ? <StatusBadge s="OCCUPIED" /> : (
              <div className="w-[230px] max-w-full flex-none">
                <NCSelect value={u.status} onChange={(v) => setUnit(i, v as FlatUnit["status"])}
                  options={[{ value: "VACANT", label: "Vacant — ready to rent" }, { value: "UNDER_CONSTRUCTION", label: "Under construction" }]} />
              </div>
            )}
          </div>
        ))}
        <Banner icon="info">Occupied flats update automatically when rent is paid or a tenancy ends — they can&rsquo;t be set by hand.</Banner>
      </>)}
      <AnimatePresence>
        {del && (
          <ConfirmDialog danger title="Delete this listing?" confirmLabel="Delete listing"
            body={`${propTitle} will be removed from Newcondo. The GPS marking stays on record so the property can't be double-listed${agentOwner ? `, and the owner (${agentOwner}) will be notified` : ""}. Payment history is kept.`}
            onConfirm={() => { onClose(); onDelete(); }} onClose={() => setDel(false)} />
        )}
      </AnimatePresence>
    </Modal>
  );
}
