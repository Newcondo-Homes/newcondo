import type { Metadata } from "next";
import { ClientsView } from "@/components/views/PlanViews";

export const metadata: Metadata = { title: "Clients" };
export default function Page() { return <ClientsView />; }
