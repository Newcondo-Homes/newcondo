// apps/platform/components/property/image-uploader.tsx

'use client';

import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface PropertyImage {
  id: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
  order: number;
  file?: File;
}

interface ImageUploaderProps {
  images: PropertyImage[];
  onImagesChange: (images: PropertyImage[]) => void;
  maxImages?: number;
  maxSizeInMB?: number;
  acceptedTypes?: string[];
  className?: string;
}

export function ImageUploader({
  images,
  onImagesChange,
  maxImages = 10,
  maxSizeInMB = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return 'Invalid file type. Please upload JPEG, PNG, or WebP images.';
    }
    
    if (file.size > maxSizeInMB * 1024 * 1024) {
      return `File size must be less than ${maxSizeInMB}MB.`;
    }
    
    return null;
  };

  const uploadToUploadThing = async (file: File): Promise<string> => {
    // Simulate upload - replace with actual UploadThing implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(URL.createObjectURL(file));
      }, 1000);
    });
  };

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (images.length + files.length > maxImages) {
      toast({
        title: "Too many images",
        description: `You can only upload up to ${maxImages} images.`,
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    const newImages: PropertyImage[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validationError = validateFile(file);
        
        if (validationError) {
          toast({
            title: "Upload failed",
            description: validationError,
            variant: "destructive"
          });
          continue;
        }

        const url = await uploadToUploadThing(file);
        
        newImages.push({
          id: crypto.randomUUID(),
          url,
          altText: `Property image ${images.length + i + 1}`,
          isPrimary: images.length === 0 && i === 0,
          order: images.length + i,
          file
        });
      }

      onImagesChange([...images, ...newImages]);
      
      if (newImages.length > 0) {
        toast({
          title: "Images uploaded",
          description: `Successfully uploaded ${newImages.length} image(s).`
        });
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  }, [images, maxImages, onImagesChange, toast]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
    e.target.value = '';
  }, [handleFileUpload]);

  const removeImage = (imageId: string) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    // Reassign primary if the removed image was primary
    if (updatedImages.length > 0 && !updatedImages.some(img => img.isPrimary)) {
      updatedImages[0].isPrimary = true;
    }
    onImagesChange(updatedImages);
  };

  const setPrimaryImage = (imageId: string) => {
    const updatedImages = images.map(img => ({
      ...img,
      isPrimary: img.id === imageId
    }));
    onImagesChange(updatedImages);
  };

  const updateImageAltText = (imageId: string, altText: string) => {
    const updatedImages = images.map(img => 
      img.id === imageId ? { ...img, altText } : img
    );
    onImagesChange(updatedImages);
  };

  const reorderImages = (dragIndex: number, hoverIndex: number) => {
    const updatedImages = [...images];
    const draggedImage = updatedImages[dragIndex];
    updatedImages.splice(dragIndex, 1);
    updatedImages.splice(hoverIndex, 0, draggedImage);
    
    // Update order values
    updatedImages.forEach((img, index) => {
      img.order = index;
    });
    
    onImagesChange(updatedImages);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Property Images</Label>
        <span className="text-sm text-muted-foreground">
          {images.length}/{maxImages} images
        </span>
      </div>

      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          uploading && "pointer-events-none opacity-50"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center space-y-2">
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
          
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {uploading ? "Uploading images..." : "Drop images here or click to upload"}
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WebP up to {maxSizeInMB}MB each
            </p>
          </div>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading || images.length >= maxImages}
            onClick={() => document.getElementById('image-upload')?.click()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Choose Images
          </Button>
          
          <input
            id="image-upload"
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            className="hidden"
            onChange={handleFileInput}
            disabled={uploading || images.length >= maxImages}
          />
        </div>
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <Card key={image.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-square">
                  <img
                    src={image.url}
                    alt={image.altText || `Property image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Primary badge */}
                  {image.isPrimary && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                      Primary
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="absolute top-2 right-2 flex space-x-1">
                    {!image.isPrimary && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0"
                        onClick={() => setPrimaryImage(image.id)}
                        title="Set as primary image"
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 w-8 p-0"
                      onClick={() => removeImage(image.id)}
                      title="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Alt text input */}
                <div className="p-3">
                  <Input
                    placeholder="Image description (optional)"
                    value={image.altText || ''}
                    onChange={(e) => updateImageAltText(image.id, e.target.value)}
                    className="text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}