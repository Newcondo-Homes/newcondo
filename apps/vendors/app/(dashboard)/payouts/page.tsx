import type { Metadata } from "next";
import { PayoutsView } from "@/components/views/MoneyViews";

export const metadata: Metadata = { title: "Payouts" };
export default function Page() { return <PayoutsView />; }
