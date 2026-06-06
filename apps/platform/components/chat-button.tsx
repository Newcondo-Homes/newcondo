import { cx } from "@/lib/cx";
import { Icon } from "@/components/ui/icon";

export function ChatButton() {
  return (
    <button
      aria-label="Help"
      className={cx(
        "fixed right-6 bottom-6 z-[90] w-[58px] h-[58px] rounded-full border-0 bg-ink text-cream",
        "flex items-center justify-center cursor-pointer shadow-lift transition-transform duration-200 ease-nc hover:-translate-y-[3px]"
      )}
    >
      <Icon name="message-circle" size={24} />
    </button>
  );
}
