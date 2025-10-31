// apps/admin/src/components/marking-jobs/CompletionImages.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ZoomIn,
  Download,
  X,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import Image from 'next/image';

interface CompletionImage {
  id: string;
  url: string;
  description?: string;
  category: 'exterior' | 'interior' | 'boundary' | 'surroundings' | 'documents' | 'other';
  uploadedAt: string;
  isVerified: boolean;
  verificationStatus?: 'APPROVED' | 'REJECTED' | 'PENDING';
  rejectionReason?: string;
}

interface CompletionImagesProps {
  jobId: string;
  images: CompletionImage[];
  onVerifyImage?: (imageId: string, status: 'APPROVED' | 'REJECTED', reason?: string) => void;
  readOnly?: boolean;
}

export default function CompletionImages({
  jobId,
  images,
  onVerifyImage,
  readOnly = false,
}: CompletionImagesProps) {
  const [selectedImage, setSelectedImage] = useState<CompletionImage | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { value: 'all', label: 'All Images', count: images.length },
    { value: 'exterior', label: 'Exterior', count: images.filter(img => img.category === 'exterior').length },
    { value: 'interior', label: 'Interior', count: images.filter(img => img.category === 'interior').length },
    { value: 'boundary', label: 'Boundary', count: images.filter(img => img.category === 'boundary').length },
    { value: 'surroundings', label: 'Surroundings', count: images.filter(img => img.category === 'surroundings').length },
    { value: 'documents', label: 'Documents', count: images.filter(img => img.category === 'documents').length },
    { value: 'other', label: 'Other', count: images.filter(img => img.category === 'other').length },
  ];

  const filteredImages = selectedCategory === 'all'
    ? images
    : images.filter(img => img.category === selectedCategory);

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-500">Rejected</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-500">Pending Review</Badge>;
      default:
        return null;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'exterior':
        return 'bg-blue-100 text-blue-800';
      case 'interior':
        return 'bg-purple-100 text-purple-800';
      case 'boundary':
        return 'bg-green-100 text-green-800';
      case 'surroundings':
        return 'bg-yellow-100 text-yellow-800';
      case 'documents':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Completion Images ({images.length})</CardTitle>
            <div className="flex items-center gap-2">
              {images.some(img => !img.isVerified) && !readOnly && (
                <Badge variant="outline" className="text-yellow-600">
                  {images.filter(img => !img.isVerified).length} Pending Verification
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map(category => (
              <Button
                key={category.value}
                variant={selectedCategory === category.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.value)}
                disabled={category.count === 0}
              >
                {category.label} ({category.count})
              </Button>
            ))}
          </div>

          {/* Images Grid */}
          {filteredImages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No images found in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredImages.map(image => (
                <div
                  key={image.id}
                  className="group relative aspect-square rounded-lg overflow-hidden border-2 hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                >
                  <Image
                    src={image.url}
                    alt={image.description || 'Completion image'}
                    fill
                    className="object-cover"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                    <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Category Badge */}
                  <div className="absolute top-2 left-2">
                    <Badge className={getCategoryColor(image.category)} variant="secondary">
                      {image.category}
                    </Badge>
                  </div>

                  {/* Status Badge */}
                  {image.verificationStatus && (
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(image.verificationStatus)}
                    </div>
                  )}

                  {/* Description */}
                  {image.description && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                      <p className="text-white text-sm line-clamp-2">{image.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Image Preview</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {selectedImage && (
            <div className="space-y-4">
              {/* Image */}
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={selectedImage.url}
                  alt={selectedImage.description || 'Completion image'}
                  fill
                  className="object-contain"
                />
              </div>

              {/* Image Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className={getCategoryColor(selectedImage.category)}>
                    {selectedImage.category}
                  </Badge>
                  {selectedImage.verificationStatus && getStatusBadge(selectedImage.verificationStatus)}
                </div>

                {selectedImage.description && (
                  <div>
                    <h4 className="font-semibold mb-1">Description</h4>
                    <p className="text-sm text-gray-600">{selectedImage.description}</p>
                  </div>
                )}

                {selectedImage.rejectionReason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-red-900 mb-1">Rejection Reason</h4>
                        <p className="text-sm text-red-700">{selectedImage.rejectionReason}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-sm text-gray-500">
                  Uploaded: {new Date(selectedImage.uploadedAt).toLocaleString()}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() =>
                    handleDownload(
                      selectedImage.url,
                      `completion-image-${selectedImage.id}.jpg`
                    )
                  }
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>

                {!readOnly && !selectedImage.isVerified && onVerifyImage && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => {
                        const reason = prompt('Enter rejection reason:');
                        if (reason) {
                          onVerifyImage(selectedImage.id, 'REJECTED', reason);
                          setSelectedImage(null);
                        }
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        onVerifyImage(selectedImage.id, 'APPROVED');
                        setSelectedImage(null);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}