// apps/platform/components/marking/MarkingImagesGallery.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Button } from '@newcondo/ui/components/button';
import { Badge } from '@newcondo/ui/components/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@newcondo/ui/components/dialog';
import {
  Image as ImageIcon,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import Image from 'next/image';

interface MarkingImage {
  id: string;
  url: string;
  description?: string;
  uploadedAt: Date;
}

interface MarkingImagesGalleryProps {
  images: MarkingImage[];
  agentName?: string;
  completedAt?: Date;
}

export function MarkingImagesGallery({
  images,
  agentName,
  completedAt,
}: MarkingImagesGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setSelectedIndex(null);
  };

  const goToPrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const handleDownload = async (imageUrl: string, imageName: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = imageName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const selectedImage = selectedIndex !== null ? images[selectedIndex] : null;

  if (images.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No completion images available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Completion Images</CardTitle>
              {agentName && completedAt && (
                <p className="text-sm text-muted-foreground mt-1">
                  Uploaded by {agentName} on {formatDate(completedAt)}
                </p>
              )}
            </div>
            <Badge>{images.length} images</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border bg-muted"
                onClick={() => openLightbox(index)}
              >
                <Image
                  src={image.url}
                  alt={image.description || `Marking image ${index + 1}`}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-white" />
                </div>
                {image.description && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 text-white text-xs">
                    {image.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lightbox Dialog */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                Image {selectedIndex !== null ? selectedIndex + 1 : 0} of{' '}
                {images.length}
              </span>
              <div className="flex gap-2">
                {selectedImage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleDownload(
                        selectedImage.url,
                        `marking-image-${selectedIndex! + 1}.jpg`
                      )
                    }
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={closeLightbox}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedImage && (
            <div className="relative w-full max-h-[70vh] aspect-video">
              <Image
                src={selectedImage.url}
                alt={
                  selectedImage.description ||
                  `Marking image ${selectedIndex! + 1}`
                }
                className="object-contain rounded-lg"
              />

              {selectedImage.description && (
                <p className="mt-4 text-sm text-muted-foreground">
                  {selectedImage.description}
                </p>
              )}

              {/* Navigation Buttons */}
              <div className="absolute inset-y-0 left-0 flex items-center">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPrevious}
                  disabled={selectedIndex === 0}
                  className="ml-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNext}
                  disabled={selectedIndex === images.length - 1}
                  className="mr-2"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}