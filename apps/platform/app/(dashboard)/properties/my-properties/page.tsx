import { Suspense } from "react";
import { Metadata } from "next";
import MyPropertiesLoading from "./loading";
import MyPropertiesContent from "@/components/properties/MyPropertiesContent";

export const metadata: Metadata = {
  title: "My Properties | NewCondo",
  description: "Manage your property listings, view analytics, and track performance",
};

export default function MyPropertiesPage() {
  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<MyPropertiesLoading />}>
        <MyPropertiesContent />
      </Suspense>
    </div>
  );
}