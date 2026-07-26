import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ShareHeader } from "@/components/share/share-header";
import { ShareExperience } from "@/components/share/share-experience";
import { Footer } from "@/components/sections/footer";
import { ChatButton } from "@/components/chat-button";
import type { SharedProperty } from "@/components/share/share-types";

interface SharePageProps {
  params: Promise<{ shareCode: string }>;
}

/* ------------------------------------------------------------------
   TEMP: mock data — the share API isn't ready yet.
   When the endpoint is live, delete MOCK_PROPERTY and restore the
   fetch block below (kept commented for a one-line swap-back).
   ------------------------------------------------------------------ */
const MOCK_PROPERTY: SharedProperty = {
  title: "2-bedroom flat, New Owerri",
  description:
    "A clean, freshly painted 2-bedroom flat in a quiet, gated compound off Wethedral Road, New Owerri. Both rooms are en-suite with fitted wardrobes, the kitchen is tiled with ample cabinet space, and the compound has 24/7 security and parking for two cars.\n\nThis property's location has been GPS-marked on NewCondo, so its boundary is confirmed and it cannot be double-listed. Rent is collected securely through the platform and held for a 24-hour confirmation window before release.",
  address: "Plot 14, Wethedral Road",
  city: "Owerri Municipal",
  state: "Imo",
  price: 1200000,
  currency: "NGN",
  bedrooms: 2,
  bathrooms: 2,
  area: "95 m²",
  features: [
    "Borehole water",
    "Prepaid meter",
    "Tiled floors",
    "Parking space",
    "24/7 security",
    "POP ceiling",
    "Fenced compound",
    "Tarred access road",
  ],
  propertyType: "FLAT",
  isAvailable: true,
  isOwnerListing: true,
  isVerified: true,
  lat: 5.4763,
  lng: 7.0259,
  photoCount: 12,
  images: [],
  owner: { name: "Chinedu Okafor" },
};

async function getSharedProperty(shareCode: string): Promise<SharedProperty | null> {
  // Return mock data until the share endpoint exists. The shareCode is
  // accepted so callers/links keep working unchanged.
  void shareCode;
  return MOCK_PROPERTY;

  /* --- restore when the API is ready ---
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/properties/share/${shareCode}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Error fetching shared property:", error);
    return null;
  }
  */
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { shareCode } = await params;
  const property = await getSharedProperty(shareCode);
  if (!property) return { title: "Property not found | NewCondo" };
  return {
    title: `${property.title} | NewCondo`,
    description: property.description?.slice(0, 160),
  };
}

export default async function SharedPropertyPage({ params }: SharePageProps) {
  const { shareCode } = await params;
  const property = await getSharedProperty(shareCode);
  if (!property) notFound();

  return (
    <div className="share-paper min-h-screen bg-nc-background">
      <ShareHeader />
      <ShareExperience property={property} shareCode={shareCode} />
      <Footer />
      <ChatButton />
    </div>
  );
}
