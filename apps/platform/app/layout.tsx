import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@newcondo/ui/";
import { SessionProvider } from "@newcondo/auth/client";
import { Providers } from '@/components/providers';
import "./globals.css";

//TODO: do prisma migrate in @newcondo/db to effect new changes in schema
// TODO: Make sure to clean up expired OTP - code is in backend ( authservice - otpService.ts)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Newcondo — For Property Owners",
  description:
    "Rent out your property without agent confusion, double-booking, or payment stress. Escrow rent collection, verified tenants, and one owner dashboard.",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <Providers>
            {children}
          </Providers>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
