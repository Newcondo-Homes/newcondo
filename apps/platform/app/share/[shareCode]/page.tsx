// apps/platform/app/share/[shareCode]/page.tsx
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Bed, Bath, Square, Share2, Heart } from 'lucide-react';

interface SharePageProps {
  params: Promise<{
    shareCode: string;
  }>;
}

// ✅ Typed interfaces replacing any
interface PropertyImage {
  url: string;
  isPrimary: boolean;
  altText?: string | null;
}

interface SharedProperty {
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  price: number | string;
  currency?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  features?: string[];
  propertyType: string;
  isAvailable: boolean;
  isOwnerListing: boolean;
  images?: PropertyImage[];
  owner?: {
    name?: string | null;
  };
}

async function getSharedProperty(shareCode: string): Promise<SharedProperty | null> {

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/properties/share/${shareCode}`,
      { cache: 'no-store' }
    );

    if (!res.ok) return null;

    return res.json();
  } catch (error) {
    console.error('Error fetching shared property:', error);
    return null;
  }
}

export default async function SharedPropertyPage({ params }: SharePageProps) {
  
  const { shareCode } = await params
  const property = await getSharedProperty(shareCode);

  if (!property) {
    notFound();
  }

  const primaryImage =
    property.images?.find((img) => img.isPrimary)?.url ||
    property.images?.[0]?.url ||
    '/images/placeholders/property.jpg';

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: property.currency || 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              NewCondo
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Sign In to Book
            </Link>
          </div>
        </div>
      </header>

      {/* Property Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Property Images */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="relative h-96 md:h-[600px] rounded-lg overflow-hidden">
            <Image
              src={primaryImage}
              alt={property.title}
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* ✅ PropertyImage replaces any */}
            {property.images?.slice(1, 5).map((image: PropertyImage, idx: number) => (
              <div key={idx} className="relative h-44 md:h-[290px] rounded-lg overflow-hidden">
                <Image
                  src={image.url}
                  alt={`${property.title} - Image ${idx + 2}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Property Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {property.title}
              </h1>
              <div className="flex items-center text-gray-600">
                <MapPin className="h-5 w-5 mr-2" />
                <span>
                  {property.address}, {property.city}, {property.state}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6 text-gray-700">
              {property.bedrooms && (
                <div className="flex items-center gap-2">
                  <Bed className="h-5 w-5" />
                  <span>{property.bedrooms} Beds</span>
                </div>
              )}
              {property.bathrooms && (
                <div className="flex items-center gap-2">
                  <Bath className="h-5 w-5" />
                  <span>{property.bathrooms} Baths</span>
                </div>
              )}
              {property.area && (
                <div className="flex items-center gap-2">
                  <Square className="h-5 w-5" />
                  <span>{property.area}</span>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Description</h2>
              <p className="text-gray-700 whitespace-pre-line">
                {property.description}
              </p>
            </div>

            {property.features && property.features.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3">Features &amp; Amenities</h2>
                <div className="grid grid-cols-2 gap-3">
                  {property.features.map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-blue-600 rounded-full" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-6">
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-500">Property Type</dt>
                  <dd className="mt-1 text-lg font-medium text-gray-900 capitalize">
                    {property.propertyType.toLowerCase().replace('_', ' ')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Availability</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${property.isAvailable
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>
                      {property.isAvailable ? 'Available' : 'Not Available'}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border shadow-lg p-6 sticky top-24">
              <div className="mb-6">
                <div className="text-3xl font-bold text-gray-900">
                  {formatPrice(Number(property.price))}
                </div>
                <div className="text-gray-600">per month</div>
              </div>

              {property.isAvailable ? (
                <>
                  <Link
                    href="/register"
                    className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg font-medium hover:bg-blue-700 transition mb-3"
                  >
                    Book Now
                  </Link>
                  <p className="text-sm text-gray-600 text-center">
                    Create an account to proceed with booking
                  </p>
                </>
              ) : (
                <button
                  disabled
                  className="w-full bg-gray-300 text-gray-600 py-3 rounded-lg font-medium cursor-not-allowed"
                >
                  Not Available
                </button>
              )}

              <div className="mt-6 pt-6 border-t space-y-3">
                <button className="w-full flex items-center justify-center gap-2 py-2 border rounded-lg hover:bg-gray-50 transition">
                  <Share2 className="h-5 w-5" />
                  <span>Share Property</span>
                </button>
                <button className="w-full flex items-center justify-center gap-2 py-2 border rounded-lg hover:bg-gray-50 transition">
                  <Heart className="h-5 w-5" />
                  <span>Save Property</span>
                </button>
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-900 mb-1">Listed by</p>
                  <p>{property.owner?.name || 'Property Owner'}</p>
                  {property.isOwnerListing ? (
                    <span className="inline-flex mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      Direct from Owner
                    </span>
                  ) : (
                    <span className="inline-flex mt-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                      Listed by Agent
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}