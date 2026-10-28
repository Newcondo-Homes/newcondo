// apps/admin/app/layout.tsx
// Geist + Geist Mono self-hosted through next/font (the NewCondo type system).
// globals.css only *named* Geist — nothing loaded it, so every screen fell back
// to Segoe UI / Arial. admin.css points --font-sans / --font-mono at these vars.
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers/Providers";
import "./globals.css";
import "./admin.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Newcondo Admin", template: "%s · Newcondo Admin" },
  robots: { index: false, follow: false },
  icons: { icon: "/logo-mark-dark.png" },
};
export const viewport: Viewport = { themeColor: "#F7F6EF", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={`${geist.variable} ${geistMono.variable}`}><body><Providers>{children}</Providers></body></html>;
}
