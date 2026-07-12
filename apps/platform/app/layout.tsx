import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { MotionProvider } from "@/components/motion-provider";
import { Toaster } from "@newcondo/ui/";
import { SessionProvider } from "@newcondo/auth/client";
import { Providers } from '@/components/providers';
import { LocationGate } from "@/components/gate/LocationGate";
import { IP_BYPASS_COOKIE } from "@/lib/gate-storage";
import { GEO_ACCESS_COOKIE, verifyGeoAccess } from "@/lib/geo-token";
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
  metadataBase: new URL("https://newcondo.homes"),
};

// export const metadata: Metadata = {
//   title: { template: "%s | Newcondo", default: "Newcondo" },
//   description: "The property platform built for Nigeria.",
//   metadataBase: new URL("https://newcondo.homes"),
// };
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const cookieStore = await cookies();
  const ipBypass = cookieStore.get(IP_BYPASS_COOKIE)?.value === "1";
  const geoGranted = !!verifyGeoAccess(cookieStore.get(GEO_ACCESS_COOKIE)?.value);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <Providers>
            <MotionProvider>
              <LocationGate ipBypass={ipBypass} geoGranted={geoGranted}>
                {children}
              </LocationGate>
            </MotionProvider>
          </Providers>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}

