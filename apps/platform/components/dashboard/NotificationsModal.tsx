"use client";

/* NotificationsModal — the full notification page for all roles.
   Opened from the bell popover's bottom "View all notifications" button.
   Modal on big screens / bottom sheet on mobile (Modal handles both).
   Page numbers (First · window · Last) when notifications are many — no
   scrolling through an endless list.
   Live: GET /api/v1/notifications (notification-service). */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { Modal } from "@/components/dashboard/Modal";
import { DBtn, EmptyState } from "@/components/dashboard/primitives";
import { useNotifications, useCacheUpdate } from "@/hooks/dashboard/useDashboardData";
import { markAllNotificationsRead, isLiveBackend } from "@/lib/api/dashboard";
import { toast } from "@newcondo/ui";
import type { Notification, Role } from "@/lib/dashboard/data";

const PAGE_SIZE = 8;
const N_ICON: Record<string, string> = { marking: "map-pin", payment: "credit-card", wallet: "wallet", verify: "shield-check", tenant: "users", service: "briefcase", referral: "gift" };

export function NotificationsModal({ role, onClose }: { role: Role; onClose: () => void }) {
  const router = useRouter();
  const { data: notifs = [] } = useNotifications(role);
  const cache = useCacheUpdate();
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(notifs.length / PAGE_SIZE));
  const shown = notifs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const unread = notifs.filter((n) => n.unread).length;
  const markAll = () => {
    if (isLiveBackend) markAllNotificationsRead().catch(() => {});
    cache.update<Notification[]>(["notifications", role], (l) => l.map((n) => ({ ...n, unread: false })));
    toast.info("All notifications marked as read");
  };
  const span = 5;
  const start = Math.max(1, Math.min(page - 2, totalPages - span + 1));
  const nums = Array.from({ length: Math.min(span, totalPages) }, (_, i) => start + i);
  return (
    <Modal wide title="Notifications" sub={unread > 0 ? `${unread} unread · newest first` : "You're all caught up"} onClose={onClose}
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-2.5">
          {unread > 0 ? <button className="text-[13px] font-semibold text-green-dark hover:text-ink" onClick={markAll}>Mark all read</button> : <span />}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <PgBtn disabled={page === 1} onClick={() => setPage(1)} label="First" />
              {nums.map((n) => (
                <button key={n} onClick={() => setPage(n)}
                  className={cx("grid size-9 place-items-center rounded-full text-[13px] font-semibold transition-colors", n === page ? "bg-ink text-cream" : "bg-surface-sunken text-text-secondary hover:bg-[#ECE9DE] hover:text-ink")}>{n}</button>
              ))}
              <PgBtn disabled={page === totalPages} onClick={() => setPage(totalPages)} label="Last" />
            </div>
          )}
          <DBtn onClick={onClose}>Done</DBtn>
        </div>
      }>
      {notifs.length === 0 ? <EmptyState icon="bell" title="No notifications yet" sub="Marking updates, payments and requests will land here — and in your email." /> : (
        <div className="overflow-hidden rounded-2xl border border-border-hair">
          {shown.map((n) => (
            <button key={n.id} onClick={() => { onClose(); router.push(n.to); }}
              className={cx("flex w-full items-start gap-3 border-b border-border-hair px-4 py-3.5 text-left transition-colors last:border-b-0 hover:bg-surface-sunken", n.unread && "bg-green-wash/60")}>
              <span className={cx("mt-0.5 grid size-9 flex-none place-items-center rounded-xl", n.unread ? "bg-white text-green-dark" : "bg-surface-sunken text-ink")}>
                <Icon name={N_ICON[n.kind] ?? "info"} size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-semibold leading-snug tracking-[-0.01em]">{n.t}</span>
                <span className="mt-0.5 block text-[12px] leading-normal text-text-tertiary">{n.s} · {n.time}</span>
              </span>
              {n.unread && <span className="mt-2 size-2 flex-none rounded-full bg-green" />}
            </button>
          ))}
        </div>
      )}
      {totalPages > 1 && <p className="mb-0 mt-3 text-center text-[11.5px] text-text-tertiary">Page {page} of {totalPages}</p>}
    </Modal>
  );
}
function PgBtn({ disabled, onClick, label }: { disabled: boolean; onClick: () => void; label: string }) {
  return <button disabled={disabled} onClick={onClick} className={cx("rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-colors", disabled ? "cursor-default bg-surface-sunken text-text-tertiary opacity-50" : "bg-surface-sunken text-text-secondary hover:bg-[#ECE9DE] hover:text-ink")}>{label}</button>;
}
