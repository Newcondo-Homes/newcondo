import type { Metadata } from "next";
import MarkPropertyExperience from "@/components/marking/MarkPropertyExperience";
import type { PropertyLinkInfo } from "@/components/marking/marking-core";

export const metadata: Metadata = {
  title: "Mark property | NewCondo",
  description: "Mark a property's location on the map to verify it for a NewCondo listing.",
};

interface PageProps {
  params: Promise<{ linkId: string }>;
}

export default async function MarkPropertyPage({ params }: PageProps) {
  const { linkId } = await params;

  /* ============================================================
     TODO (backend): validate the one-time link and fetch the
     property + access details server-side, e.g.

       const data = await getMarkingLink(linkId);
       if (!data || data.expired) notFound();

     then map it into PropertyLinkInfo below. For now we pass the
     linkId through; the owner-supplied fields render gracefully
     when absent.
     ============================================================ */
  const link: PropertyLinkInfo = {
    propertyId: linkId,
    // address: data.address,
    // ownerName: data.ownerName,
    // ownerPhone: data.ownerPhone,
    // propertyType: data.propertyType,
  };

  // TODO (backend): also fetch already-marked properties near this area and
  // pass them as `markedProperties` so they render as red-grey masks.
  return <MarkPropertyExperience linkId={linkId} link={link} />;
}
