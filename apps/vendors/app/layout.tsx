// apps/vendors/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Newcondo Vendors", template: "%s · Newcondo Vendors" },
  description: "Your Newcondo service jobs, clients, schedule and payouts.",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#F7F6EF", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
