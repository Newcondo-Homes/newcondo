import type { Metadata } from "next";
import { SettingsView } from "@/components/views/MoneyViews";

export const metadata: Metadata = { title: "Business & Settings" };
export default function Page() { return <SettingsView />; }
