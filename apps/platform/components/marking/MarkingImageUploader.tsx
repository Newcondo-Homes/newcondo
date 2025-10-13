'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/card';
import { Button } from '@newcondo/ui/button';
import { Label } from '@newcondo/ui/label';
import { Progress } from '@newcondo/ui/progress';
import { Alert, AlertDescription } from '@newcondo/ui/alert';
import { Camera, Upload, X, CheckCircle2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { useUploadThing } from '@/lib/uploadthing';

interface UploadedImage {
  id: string;
  url: string;
  name: string;
  size: number;
  category?: ImageCategory;
}

type ImageCategory = 
  | 'EXTERIOR_FRONT'
  | 'EXTERIOR_BACK'
  | 'EXTERIOR_SIDE'
  | 'LIVING_ROOM'
  | 'BEDROOM'
  | 'KITCHEN'
  | 'BATHROOM'
  | 'COMPOUND'
  | 'OTHER';

interface MarkingImageUploaderProps {
  jobId: string;
  maxImages?: number;
  onImagesUploaded: (images: UploadedImage[]) => void;
  existingImages?: UploadedImage[];
  requiredCategories?: ImageCategory[];
}

export default function MarkingImageUploader({
  jobId,
  maxImages = 20,
  onImagesUploaded,
  existingImages = [],
  requiredCategories = [
    'EXTERIOR_FRONT',
    'LIVING_ROOM',
    'BEDROOM',
    'KITCHEN',
    'BATHROOM',
  ],
}: MarkingImageUploaderProps) {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  const { startUpload, isUploading } = useUploadThing('markingImages', {
    onClientUploadComplete: (res) => {
      const newImages: UploadedImage[] = res.map((file) => ({
        id: file.key,
        url: file.url,
        name: file.name,
        size: file.size,
      }));
      
      const allImages = [...uploadedImages, ...newImages];
      setUploadedImages(allImages);
      onImagesUploaded(allImages);
      setUploading(false);
      setUploadProgress(0);
    },
    onUploadError: (error) => {
      setErrors([error.message]);
      setUploading(false);
      setUploadProgress(0);
    },
    onUploadProgress: (progress) => {
      setUploadProgress(progress);
    },
  });

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      setErrors([]);

      // Validation
      const newErrors: string[] = [];
      
      if (uploadedImages.length + files.length > maxImages) {
        newErrors.push(`Maximum ${maxImages} images allowed`);
      }

      const invalidFiles = files.filter(
        (file) => !file.type.startsWith('image/')
      );
      if (invalidFiles.length > 0) {
        newErrors.push('Only image files are allowed');
      }

      const oversizedFiles = files.filter(
        (file) => file.size > 10 * 1024 * 1024 // 10MB
      );
      if (oversizedFiles.length > 0) {
        newErrors.push('Some files exceed 10MB size limit');
      }

      if (newErrors.length > 0) {
        setErrors(newErrors);
        return;
      }

      setUploading(true);
      await startUpload(files);
    },
    [uploadedImages, maxImages, startUpload]
  );

  const handleRemoveImage = (imageId: string) => {
    const filtered = uploadedImages.filter((img) => img.id !== imageId);
    setUploadedImages(filtered);
    onImagesUploaded(filtered);
  };

  const handleCategoryChange = (imageId: string, category: ImageCategory) => {
    const updated = uploadedImages.map((img) =>
      img.id === imageId ? { ...img, category } : img
    );
    setUploadedImages(updated);
    onImagesUploaded(updated);
  };

  const getCategoryCoverage = () => {
    const categorized = uploadedImages.filter((img) => img.category);
    const uniqueCategories = new Set(categorized.map((img) => img.category));
    const requiredCovered = requiredCategories.filter((cat) =>
      uniqueCategories.has(cat)
    );
    return {
      covered: requiredCovered.length,
      total: requiredCategories.length,
      percentage: (requiredCovered.length / requiredCategories.length) * 100,
    };
  };

  const coverage = getCategoryCoverage();

  const categoryLabels: Record<ImageCategory, string> = {
    EXTERIOR_FRONT: 'Front View',
    EXTERIOR_BACK: 'Back View',
    EXTERIOR_SIDE: 'Side View',
    LIVING_ROOM: 'Living Room',
    BEDROOM: 'Bedroom',
    KITCHEN: 'Kitchen',
    BATHROOM: 'Bathroom',
    COMPOUND: 'Compound',
    OTHER: 'Other',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Property Images
        </CardTitle>
        <CardDescription>
          Upload clear photos of key areas of the property ({uploadedImages.length}/{maxImages} images)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Coverage Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Required Categories</span>
            <span className="text-muted-foreground">
              {coverage.covered}/{coverage.total} covered
            </span>
          </div>
          <Progress value={coverage.percentage} className="h-2" />
          {coverage.covered < coverage.total && (
            <p className="text-xs text-muted-foreground">
              Please upload images for all required categories to complete the marking
            </p>
          )}
        </div>

        {/* Upload Area */}
        <div className="space-y-3">
          <Label htmlFor="image-upload" className="cursor-pointer">
            <div className="border-2 border-dashed rounded-lg p-8 hover:bg-accent/50 transition-colors text-center">
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="font-medium">Upload Images</p>
                  <p className="text-sm text-muted-foreground">
                    Click to browse or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG up to 10MB each
                  </p>
                </div>
              </div>
            </div>
          </Label>
          <input
            id="image-upload"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading || uploadedImages.length >= maxImages}
            className="hidden"
          />
        </div>

        {/* Upload Progress */}
        {uploading && (
          <Alert>
            <Upload className="h-4 w-4 animate-pulse" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="text-sm font-medium">Uploading images...</p>
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Uploaded Images Grid */}
        {uploadedImages.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Uploaded Images</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {uploadedImages.map((image) => (
                <div key={image.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(image.id)}
                    className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  {/* Category Badge */}
                  {image.category && (
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {categoryLabels[image.category]}
                      </div>
                    </div>
                  )}

                  {/* Category Selector */}
                  <select
                    value={image.category || ''}
                    onChange={(e) =>
                      handleCategoryChange(image.id, e.target.value as ImageCategory)
                    }
                    className="mt-2 w-full text-xs border rounded px-2 py-1"
                  >
                    <option value="">Select category...</option>
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Required Categories List */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Required Categories</Label>
          <div className="grid grid-cols-2 gap-2">
            {requiredCategories.map((category) => {
              const hasImage = uploadedImages.some(
                (img) => img.category === category
              );
              return (
                <div
                  key={category}
                  className={`flex items-center gap-2 p-2 rounded-lg border ${
                    hasImage
                      ? 'bg-green-50 border-green-200'
                      : 'bg-muted'
                  }`}
                >
                  {hasImage ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">
                    {categoryLabels[category]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}