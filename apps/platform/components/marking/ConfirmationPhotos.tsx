// apps/platform/components/marking/ConfirmationPhotos.tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@newcondo/ui/components/dialog";
import { Button } from "@newcondo/ui/components/button";
import { ChevronLeft, ChevronRight, X, ZoomIn, Download } from "lucide-react";

interface ConfirmationPhotosProps {
  photos: string[];
}

export function ConfirmationPhotos({ photos }: ConfirmationPhotosProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);

  const openLightbox = (index: number) => {
    setSelectedPhoto(index);
  };

  const closeLightbox = () => {
    setSelectedPhoto(null);
  };

  const goToPrevious = () => {
    if (selectedPhoto !== null && selectedPhoto > 0) {
      setSelectedPhoto(selectedPhoto - 1);
    }
  };

  const goToNext = () => {
    if (selectedPhoto !== null && selectedPhoto < photos.length - 1) {
      setSelectedPhoto(selectedPhoto + 1);
    }
  };

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `property-photo-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
        <p className="text-muted-foreground">No photos available</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <div
            key={index}
            className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
            onClick={() => openLightbox(index)}
          >
            <img
              src={photo}
              alt={`Property photo ${index + 1}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
              <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="absolute bottom-2 right-2">
              <div className="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                {index + 1}/{photos.length}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={selectedPhoto !== null} onOpenChange={closeLightbox}>
        <DialogContent className="max-w-7xl p-0 bg-black">
          <div className="relative h-[90vh] flex items-center justify-center">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
              onClick={closeLightbox}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Download Button */}
            {selectedPhoto !== null && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-16 z-50 text-white hover:bg-white/20"
                onClick={() => handleDownload(photos[selectedPhoto])}
              >
                <Download className="h-6 w-6" />
              </Button>
            )}

            {/* Previous Button */}
            {selectedPhoto !== null && selectedPhoto > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 z-50 text-white hover:bg-white/20"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            )}

            {/* Image */}
            {selectedPhoto !== null && (
              <img
                src={photos[selectedPhoto]}
                alt={`Property photo ${selectedPhoto + 1}`}
                className="max-h-full max-w-full object-contain"
              />
            )}

            {/* Next Button */}
            {selectedPhoto !== null && selectedPhoto < photos.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 z-50 text-white hover:bg-white/20"
                onClick={goToNext}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            )}

            {/* Counter */}
            {selectedPhoto !== null && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
                <div className="bg-black bg-opacity-70 text-white px-4 py-2 rounded-full">
                  {selectedPhoto + 1} / {photos.length}
                </div>
              </div>
            )}

            {/* Thumbnail Strip */}
            {selectedPhoto !== null && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-50 max-w-5xl overflow-x-auto">
                <div className="flex gap-2 px-4">
                  {photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedPhoto(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                        index === selectedPhoto
                          ? "border-white scale-110"
                          : "border-transparent opacity-50 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={photo}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}