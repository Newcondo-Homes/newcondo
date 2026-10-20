import type { Metadata } from "next";
import { TodayView } from "@/components/views/WorkViews";

export const metadata: Metadata = { title: "Today" };
export default function Page() { return <TodayView />; }
