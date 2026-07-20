import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { MotionProvider } from "@/components/motion-provider";
import { Toaster } from "@newcondo/ui/";
import { SessionProvider } from "@newcondo/auth/client";
import { auth } from "@newcondo/auth";
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
  title: "Newcondo",
  description:
    "Rent out your property without agent confusion, double-booking, or payment stress. Escrow rent collection, verified tenants, and one owner dashboard.",
  metadataBase: new URL("https://newcondo.homes"),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const [session, cookieStore] = await Promise.all([auth(), cookies()]);

  const ipBypass = cookieStore.get(IP_BYPASS_COOKIE)?.value === "1";
  const geoGranted = !!verifyGeoAccess(cookieStore.get(GEO_ACCESS_COOKIE)?.value);
  // Logged-in users skip the location gate — a real session means they've
  // already signed up / verified their account, so re-checking GPS on every
  // visit would only block legitimate users travelling outside the area.
  const sessionBypass = !!session;

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <Providers>
            <MotionProvider>
              {/* <LocationGate ipBypass={ipBypass} geoGranted={geoGranted} sessionBypass={sessionBypass}> */}
                {children}
              {/* </LocationGate> */}
            </MotionProvider>
          </Providers>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}