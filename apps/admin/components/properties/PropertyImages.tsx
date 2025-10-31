'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Star,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import Image from 'next/image';

interface PropertyImage {
  id: string;
  url: string;
  altText?: string | null;
  isPrimary: boolean;
  order: number;
}

interface PropertyImagesProps {
  images: PropertyImage[];
  boundaryImages?: string[];
  propertyTitle: string;
}

export function PropertyImages({
  images,
  boundaryImages = [],
  propertyTitle,
}: PropertyImagesProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [viewMode, setViewMode] = useState<'property' | 'boundary'>('property');

  const allImages = viewMode === 'property' ? images : boundaryImages.map((url, i) => ({ url, id: `boundary-${i}` }));
  const currentImages = allImages.map(img => typeof img === 'string' ? img : img.url);

  const handleImageClick = (url: string, index: number) => {
    setSelectedImage(url);
    setCurrentIndex(index);
    setZoom(100);
    setRotation(0);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedImage(currentImages[currentIndex - 1]);
      setZoom(100);
      setRotation(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < currentImages.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedImage(currentImages[currentIndex + 1]);
      setZoom(100);
      setRotation(0);
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  if (images.length === 0 && boundaryImages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Property Images</CardTitle>
          <CardDescription>No images uploaded for this property</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12">
            <ImageIcon className="mb-4 h-12 w-12 text-gray-400" />
            <p className="text-sm text-gray-500">No images available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedImages = [...images].sort((a, b) => a.order - b.order);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Property Images</CardTitle>
              <CardDescription>
                {viewMode === 'property' 
                  ? `${images.length} property ${images.length === 1 ? 'image' : 'images'}`
                  : `${boundaryImages.length} boundary ${boundaryImages.length === 1 ? 'image' : 'images'}`
                }
              </CardDescription>
            </div>
            {boundaryImages.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'property' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('property')}
                >
                  Property ({images.length})
                </Button>
                <Button
                  variant={viewMode === 'boundary' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('boundary')}
                >
                  Boundary ({boundaryImages.length})
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'property' && images.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12">
              <AlertCircle className="mb-4 h-12 w-12 text-yellow-400" />
              <p className="text-sm text-gray-500">No property images uploaded</p>
            </div>
          ) : viewMode === 'boundary' && boundaryImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12">
              <AlertCircle className="mb-4 h-12 w-12 text-yellow-400" />
              <p className="text-sm text-gray-500">No boundary images available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {viewMode === 'property' ? (
                sortedImages.map((image, index) => (
                  <div
                    key={image.id}
                    className="group relative cursor-pointer overflow-hidden rounded-lg border bg-gray-100"
                    onClick={() => handleImageClick(image.url, index)}
                  >
                    <div className="relative aspect-square">
                      <Image
                        src={image.url}
                        alt={image.altText || `Property image ${index + 1}`}
                        fill
                        className="object-cover transition-transform group-hover:scale-110"
                      />
                      {image.isPrimary && (
                        <div className="absolute right-2 top-2 rounded bg-yellow-400 p-1">
                          <Star className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <ZoomIn className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    {image.altText && (
                      <div className="p-2">
                        <p className="truncate text-xs text-gray-600">{image.altText}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                boundaryImages.map((url, index) => (
                  <div
                    key={`boundary-${index}`}
                    className="group relative cursor-pointer overflow-hidden rounded-lg border bg-gray-100"
                    onClick={() => handleImageClick(url, index)}
                  >
                    <div className="relative aspect-square">
                      <Image
                        src={url}
                        alt={`Boundary image ${index + 1}`}
                        fill
                        className="object-cover transition-transform group-hover:scale-110"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <ZoomIn className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Viewer Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>
                {propertyTitle} - Image {currentIndex + 1} of {currentImages.length}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Image Controls */}
          <div className="flex items-center justify-center gap-2 border-b pb-4">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600">{zoom}%</span>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <div className="mx-2 h-4 w-px bg-gray-300" />
            <Button variant="outline" size="sm" onClick={handleRotate}>
              <RotateCw className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600">{rotation}°</span>
          </div>

          {/* Main Image */}
          <div className="relative flex items-center justify-center bg-gray-50 p-4">
            {currentIndex > 0 && (
              <Button
                variant="outline"
                size="icon"
                className="absolute left-4 z-10"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}

            <div
              className="max-h-[600px] overflow-auto"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transition: 'transform 0.3s',
              }}
            >
              {selectedImage && (
                <Image
                  src={selectedImage}
                  alt={`Viewing image ${currentIndex + 1}`}
                  width={800}
                  height={800}
                  className="h-auto max-w-full"
                />
              )}
            </div>

            {currentIndex < currentImages.length - 1 && (
              <Button
                variant="outline"
                size="icon"
                className="absolute right-4 z-10"
                onClick={handleNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Thumbnails */}
          {currentImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto border-t pt-4">
              {currentImages.map((url, index) => (
                <div
                  key={index}
                  className={`relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded border-2 ${
                    index === currentIndex ? 'border-blue-500' : 'border-gray-200'
                  }`}
                  onClick={() => handleImageClick(url, index)}
                >
                  <Image
                    src={url}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}