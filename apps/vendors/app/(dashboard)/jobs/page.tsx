import type { Metadata } from "next";
import { JobsView } from "@/components/views/WorkViews";

export const metadata: Metadata = { title: "Jobs" };
export default function Page() { return <JobsView />; }
