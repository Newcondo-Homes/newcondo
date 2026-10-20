import type { Metadata } from "next";
import { ScheduleView } from "@/components/views/PlanViews";

export const metadata: Metadata = { title: "Schedule" };
export default function Page() { return <ScheduleView />; }
