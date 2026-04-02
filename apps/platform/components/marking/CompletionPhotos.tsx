// apps/platform/components/marking/CompletionPhotos.tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@newcondo/ui/components/card";
import { Button } from "@newcondo/ui/components/button";
import { Input } from "@newcondo/ui/components/input";
import { Label } from "@newcondo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@newcondo/ui/components/select";
import { Badge } from "@newcondo/ui/components/badge";
import { Upload, X, Image as ImageIcon, AlertCircle, CheckCircle } from "lucide-react";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from '@/lib/uploadthing';

interface Photo {
  url: string;
  description: string;
  category: "exterior" | "interior" | "boundary" | "landmark";
}

interface CompletionPhotosProps {
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  minPhotos?: number;
}

const categoryLabels = {
  exterior: "Exterior View",
  interior: "Interior View",
  boundary: "Boundary/Corner",
  landmark: "Nearby Landmark",
};

const categoryColors = {
  exterior: "bg-blue-100 text-blue-800",
  interior: "bg-green-100 text-green-800",
  boundary: "bg-purple-100 text-purple-800",
  landmark: "bg-orange-100 text-orange-800",
};

export function CompletionPhotos({
  photos,
  onPhotosChange,
  minPhotos = 4,
}: CompletionPhotosProps) {
  const [editingPhoto, setEditingPhoto] = useState<number | null>(null);

  const handlePhotoUpload = (url: string) => {
    const newPhoto: Photo = {
      url,
      description: "",
      category: "exterior",
    };
    onPhotosChange([...photos, newPhoto]);
  };

  const updatePhoto = (index: number, updates: Partial<Photo>) => {
    const updated = photos.map((photo, i) =>
      i === index ? { ...photo, ...updates } : photo
    );
    onPhotosChange(updated);
  };

  const removePhoto = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  const getCategoryCount = (category: string) => {
    return photos.filter((p) => p.category === category).length;
  };

  const requiredCategories = {
    exterior: 1,
    interior: 1,
    boundary: 1,
    landmark: 1,
  };

  const isCategoryComplete = (category: keyof typeof requiredCategories) => {
    return getCategoryCount(category) >= requiredCategories[category];
  };

  return (
    <div className="space-y-6">
      {/* Requirements */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <p className="font-semibold text-blue-900">Photo Requirements</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(requiredCategories).map(([category, required]) => {
                const complete = isCategoryComplete(category as keyof typeof requiredCategories);
                return (
                  <div
                    key={category}
                    className="flex items-center justify-between p-2 bg-white rounded border"
                  >
                    <span className="text-gray-700">
                      {categoryLabels[category as keyof typeof categoryLabels]}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          complete
                            ? "bg-green-100 text-green-800 border-green-300"
                            : "bg-gray-100 text-gray-600"
                        }
                      >
                        {getCategoryCount(category)}/{required}
                      </Badge>
                      {complete && <CheckCircle className="h-4 w-4 text-green-600" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-semibold mb-1">Upload Property Photos</p>
                <p className="text-sm text-muted-foreground">
                  JPG, PNG or WebP (Max 10MB per file)
                </p>
              </div>
              <UploadButton<OurFileRouter, 'propertyImages'>
                endpoint="propertyImages"
                onClientUploadComplete={(res) => {
                  if (res && res[0]) {
                    handlePhotoUpload(res[0].url);
                  }
                }}
                onUploadError={(error: Error) => {
                  alert(`Upload error: ${error.message}`);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {photos.map((photo, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="relative aspect-video bg-gray-100">
                <img
                  src={photo.url}
                  alt={photo.description || `Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => removePhoto(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Badge
                  className={`absolute bottom-2 left-2 ${
                    categoryColors[photo.category]
                  }`}
                >
                  {categoryLabels[photo.category]}
                </Badge>
              </div>
              <CardContent className="pt-4 space-y-3">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={photo.category}
                    onValueChange={(value) =>
                      updatePhoto(index, { category: value as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="Describe what this photo shows..."
                    value={photo.description}
                    onChange={(e) =>
                      updatePhoto(index, { description: e.target.value })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Photos Uploaded
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={photos.length >= minPhotos ? "default" : "secondary"}
              >
                {photos.length} / {minPhotos} minimum
              </Badge>
              {photos.length >= minPhotos && (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Messages */}
      {photos.length < minPhotos && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-900">
                  {minPhotos - photos.length} more photo{minPhotos - photos.length !== 1 ? "s" : ""} required
                </p>
                <p className="text-yellow-800 mt-1">
                  Upload at least one photo from each category to proceed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}