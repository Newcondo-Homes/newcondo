import type { Metadata } from "next";
import { DataHandling } from "@/components/sections/data-handling";

export const metadata: Metadata = {
  title: "Data Handling Policy | NewCondo",
  description:
    "How Newcondo handles personal data as a data controller — sub-processors, social platform data, data minimization, government request process, and security controls.",
};

export default function DataHandlingPage() {
  return <DataHandling />;
}
