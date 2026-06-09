"use client";

import { motion } from "framer-motion";
import { Icon } from "@/components/ui/icon";

export function ChatButton() {
  return (
    <motion.button
      aria-label="Help"
      className="fixed right-6 bottom-6 z-[90] w-[58px] h-[58px] rounded-full border-0 bg-ink text-cream flex items-center justify-center cursor-pointer shadow-lift"
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.95 }}
    >
      <Icon name="message-circle" size={24} />
    </motion.button>
  );
}
