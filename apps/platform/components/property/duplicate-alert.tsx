"use client";

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@newcondo/ui/components/alert';
import { Button } from '@newcondo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@newcondo/ui/components/dialog';
import { Badge } from '@newcondo/ui/components/badge';
import { 
  AlertTriangle, 
  Eye, 
  MapPin, 
  Calendar, 
  User, 
  ExternalLink,
  Clock,
  Flag,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DuplicateProperty {
  id: string;
  title: string;
  address: string;
  price: number;
  currency: string;
  images: string[];
  owner: {
    name: string;
    id: string;
  };
  agent?: {
    name: string;
    id: string;
  };
  createdAt: string;
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'RENTED' | 'UNAVAILABLE';
  adminApprovalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  similarity: number; // 0-100% similarity score
  boundaryOverlap: number; // 0-100% boundary overlap
  distanceMeters: number; // Distance in meters
}

interface DuplicateAlertProps {
  duplicates: DuplicateProperty[];
  onReportDuplicate: (duplicateId: string) => void;
  onViewProperty: (propertyId: string) => void;
  onRequestVerification?: () => void;
  onProceedAnyway?: () => void;
  canProceed?: boolean;
  className?: string;
}

export default function DuplicateAlert({
  duplicates,
  onReportDuplicate,
  onViewProperty,
  onRequestVerification,
  onProceedAnyway,
  canProceed = false,
  className
}: DuplicateAlertProps) {
  const [selectedDuplicate, setSelectedDuplicate] = useState<DuplicateProperty | null>(null);
  const [reportingId, setReportingId] = useState<string | null>(null);

  const handleReportDuplicate = async (duplicateId: string) => {
    setReportingId(duplicateId);
    try {
      await onReportDuplicate(duplicateId);
    } finally {
      setReportingId(null);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 90) return 'text-red-600 bg-red-50';
    if (similarity >= 70) return 'text-orange-600 bg-orange-50';
    if (similarity >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-blue-600 bg-blue-50';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'RENTED':
        return 'bg-blue-100 text-blue-800';
      case 'UNAVAILABLE':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getApprovalStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  if (duplicates.length === 0) {
    return null;
  }

  const highSimilarityDuplicates = duplicates.filter(d => d.similarity >= 80);
  const mediumSimilarityDuplicates = duplicates.filter(d => d.similarity >= 60 && d.similarity < 80);
  const lowSimilarityDuplicates = duplicates.filter(d => d.similarity < 60);

  return (
    <div className={cn("space-y-4", className)}>
      {/* High Similarity Alert */}
      {highSimilarityDuplicates.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">
            Potential Duplicate Properties Found
          </AlertTitle>
          <AlertDescription className="text-red-700 mt-2">
            We found {highSimilarityDuplicates.length} property(s) with high similarity to your listing. 
            These properties may be duplicates or very similar to what you're trying to list.
          </AlertDescription>
        </Alert>
      )}

      {/* Medium Similarity Alert */}
      {mediumSimilarityDuplicates.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">
            Similar Properties in Area
          </AlertTitle>
          <AlertDescription className="text-orange-700 mt-2">
            We found {mediumSimilarityDuplicates.length} property(s) with similar characteristics in the same area.
          </AlertDescription>
        </Alert>
      )}

      {/* Duplicate Properties List */}
      <div className="grid gap-4">
        {duplicates.map((duplicate) => (
          <Card key={duplicate.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {duplicate.title}
                    <Badge className={getSimilarityColor(duplicate.similarity)}>
                      {duplicate.similarity}% similar
                    </Badge>
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {duplicate.address}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Listed {formatDate(duplicate.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(duplicate.status)}>
                    {duplicate.status}
                  </Badge>
                  {getApprovalStatusIcon(duplicate.adminApprovalStatus)}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Property Info */}
                <div className="space-y-3">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {formatPrice(duplicate.price, duplicate.currency)}
                    </p>
                    <p className="text-sm text-gray-600">per month</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        Owner: {duplicate.owner.name}
                      </span>
                    </div>
                    {duplicate.agent && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          Agent: {duplicate.agent.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 text-sm">
                    <p><strong>Boundary Overlap:</strong> {duplicate.boundaryOverlap}%</p>
                    <p><strong>Distance:</strong> {duplicate.distanceMeters}m away</p>
                  </div>
                </div>

                {/* Property Image */}
                <div className="relative">
                  {duplicate.images.length > 0 && (
                    <img
                      src={duplicate.images[0]}
                      alt={duplicate.title}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  )}
                  {duplicate.images.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      +{duplicate.images.length - 1} more
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewProperty(duplicate.id)}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </Button>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDuplicate(duplicate)}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      More Info
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Property Details</DialogTitle>
                    </DialogHeader>
                    {selectedDuplicate && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold mb-2">Property Info</h4>
                            <div className="space-y-2 text-sm">
                              <p><strong>Title:</strong> {selectedDuplicate.title}</p>
                              <p><strong>Price:</strong> {formatPrice(selectedDuplicate.price, selectedDuplicate.currency)}</p>
                              <p><strong>Address:</strong> {selectedDuplicate.address}</p>
                              <p><strong>Status:</strong> {selectedDuplicate.status}</p>
                              <p><strong>Listed:</strong> {formatDate(selectedDuplicate.createdAt)}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Similarity Analysis</h4>
                            <div className="space-y-2 text-sm">
                              <p><strong>Overall Similarity:</strong> {selectedDuplicate.similarity}%</p>
                              <p><strong>Boundary Overlap:</strong> {selectedDuplicate.boundaryOverlap}%</p>
                              <p><strong>Distance:</strong> {selectedDuplicate.distanceMeters}m</p>
                            </div>
                          </div>
                        </div>
                        
                        {selectedDuplicate.images.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Property Images</h4>
                            <div className="grid grid-cols-3 gap-2">
                              {selectedDuplicate.images.slice(0, 6).map((image, index) => (
                                <img
                                  key={index}
                                  src={image}
                                  alt={`Property ${index + 1}`}
                                  className="w-full h-24 object-cover rounded"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReportDuplicate(duplicate.id)}
                  disabled={reportingId === duplicate.id}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <Flag className="h-4 w-4" />
                  {reportingId === duplicate.id ? 'Reporting...' : 'Report Duplicate'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        {onRequestVerification && (
          <Button
            variant="outline"
            onClick={onRequestVerification}
            className="flex items-center gap-2"
          >
            <Flag className="h-4 w-4" />
            Request Manual Verification
          </Button>
        )}
        
        {onProceedAnyway && canProceed && (
          <Button
            variant="secondary"
            onClick={onProceedAnyway}
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Proceed Anyway
          </Button>
        )}
      </div>

      {/* Warning for high similarity */}
      {highSimilarityDuplicates.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700">
            <strong>Important:</strong> Listing duplicate properties is against our terms of service. 
            If you believe this is not a duplicate, please contact our support team for assistance.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}