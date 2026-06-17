import type { Metadata } from "next";
import { Blog } from "@/components/sections/blog";

export const metadata: Metadata = {
  title: "Blog | NewCondo",
  description:
    "The Newcondo Journal — practical writing for Nigerian property owners on escrow rent, agents, tenant verification, and managing property from anywhere.",
};

export default function BlogPage() {
  return <Blog />;
}
