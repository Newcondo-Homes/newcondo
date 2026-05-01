'use client';
// apps/platform/components/properties/PropertyImageGallery.tsx

import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

interface PropertyImage {
  id: string;
  url: string;
  altText?: string | null;
  isPrimary: boolean;
  order: number;
}

interface PropertyImageGalleryProps {
  images: PropertyImage[];
  title: string;
}

export function PropertyImageGallery({ images, title }: PropertyImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const sorted = [...images].sort((a, b) => {
    if (a.isPrimary) return -1;
    if (b.isPrimary) return 1;
    return a.order - b.order;
  });

  if (sorted.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
        No images available
      </div>
    );
  }

  const prev = () => setActiveIndex((i) => (i === 0 ? sorted.length - 1 : i - 1));
  const next = () => setActiveIndex((i) => (i === sorted.length - 1 ? 0 : i + 1));

  return (
    <>
      {/* Main gallery */}
      <div className="space-y-3">
        {/* Primary image */}
        <div className="group relative h-72 overflow-hidden rounded-xl bg-gray-100 sm:h-96">
          <img
            src={sorted[activeIndex].url}
            alt={sorted[activeIndex].altText ?? title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Zoom button */}
          <button
            onClick={() => setLightboxOpen(true)}
            className="absolute right-3 top-3 rounded-lg bg-black/50 p-2 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/70"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          {/* Nav arrows */}
          {sorted.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/70"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/70"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Counter */}
          <div className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white">
            {activeIndex + 1} / {sorted.length}
          </div>
        </div>

        {/* Thumbnails */}
        {sorted.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {sorted.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActiveIndex(i)}
                className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                  i === activeIndex
                    ? 'border-violet-500'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={img.url}
                  alt={img.altText ?? `Image ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <img
            src={sorted[activeIndex].url}
            alt={sorted[activeIndex].altText ?? title}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
            {activeIndex + 1} / {sorted.length}
          </div>
        </div>
      )}
    </>
  );
}