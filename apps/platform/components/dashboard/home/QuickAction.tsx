"use client";
import { Icon } from "@/components/ui/icon";

export function QuickAction({ icon, title, sub, onClick }: { icon: string; title: string; sub: string; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      className="group flex flex-col items-start gap-3 rounded-[20px] border border-border-hair bg-surface p-[18px] text-left shadow-[0_1px_2px_rgba(19,19,19,0.04)] transition-all duration-200 ease-nc hover:-translate-y-1 hover:shadow-card max-sm:gap-2 max-sm:p-3.5">
      <span className="grid size-[42px] place-items-center rounded-[13px] bg-surface-sunken text-ink transition-colors duration-200 group-hover:bg-ink group-hover:text-cream">
        <Icon name={icon} size={19} />
      </span>
      <b className="text-[14px] tracking-[-0.01em]">{title}</b>
      <span className="-mt-2 text-[12px] leading-snug text-text-tertiary">{sub}</span>
    </button>
  );
}
