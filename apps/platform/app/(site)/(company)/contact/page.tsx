import type { Metadata } from "next";
import { Contact } from "@/components/sections/contact";

export const metadata: Metadata = {
  title: "Contact | NewCondo",
  description:
    "Reach the Newcondo team — email info@newcondo.homes, call +234 810 831 5350, or visit our office in Owerri-West, Imo State. We reply within 24 hours.",
};

export default function ContactPage() {
  return <Contact />;
}
