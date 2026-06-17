import type { Metadata } from "next";
import { CookiePolicy } from "@/components/sections/cookie-policy";

export const metadata: Metadata = {
  title: "Cookie Policy | NewCondo",
  description:
    "How Newcondo uses cookies and similar technologies — what they do, the categories we set, third-party cookies, and how to control them in your browser.",
};

export default function CookiesPage() {
  return <CookiePolicy />;
}
