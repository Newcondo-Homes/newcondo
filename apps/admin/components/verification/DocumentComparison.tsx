'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ZoomIn, ZoomOut, RotateCw, AlertCircle, Check, X } from 'lucide-react';
import Image from 'next/image';

interface DocumentComparisonProps {
  idDocument: {
    url: string;
    type: string;
    extractedData?: {
      name?: string;
      dateOfBirth?: string;
      idNumber?: string;
      issueDate?: string;
      expiryDate?: string;
    };
  };
  selfie: {
    url: string;
  };
  userData: {
    name: string;
    dateOfBirth?: string;
  };
  onMatchConfirm?: (matches: boolean, notes?: string) => void;
}

export function DocumentComparison({
  idDocument,
  selfie,
  userData,
  onMatchConfirm,
}: DocumentComparisonProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [activeImage, setActiveImage] = useState<'id' | 'selfie'>('id');
  const [comparisonNotes, setComparisonNotes] = useState('');

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const checkDataMatch = (extracted?: string, provided?: string) => {
    if (!extracted || !provided) return null;
    const match = extracted.toLowerCase().trim() === provided.toLowerCase().trim();
    return match;
  };

  const nameMatch = checkDataMatch(idDocument.extractedData?.name, userData.name);
  const dobMatch = checkDataMatch(idDocument.extractedData?.dateOfBirth, userData.dateOfBirth);

  return (
    <div className="space-y-6">
      {/* Comparison Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Document Verification</CardTitle>
          <CardDescription>
            Compare ID document with selfie and verify personal information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Data Verification */}
            <div className="space-y-4">
              <h3 className="font-semibold">Personal Information Match</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Full Name</p>
                    <p className="text-sm text-gray-900">{userData.name}</p>
                    {idDocument.extractedData?.name && (
                      <p className="text-xs text-gray-500">
                        ID: {idDocument.extractedData.name}
                      </p>
                    )}
                  </div>
                  {nameMatch !== null && (
                    nameMatch ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <X className="h-5 w-5 text-red-600" />
                    )
                  )}
                </div>

                {userData.dateOfBirth && (
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Date of Birth</p>
                      <p className="text-sm text-gray-900">{userData.dateOfBirth}</p>
                      {idDocument.extractedData?.dateOfBirth && (
                        <p className="text-xs text-gray-500">
                          ID: {idDocument.extractedData.dateOfBirth}
                        </p>
                      )}
                    </div>
                    {dobMatch !== null && (
                      dobMatch ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <X className="h-5 w-5 text-red-600" />
                      )
                    )}
                  </div>
                )}

                {idDocument.extractedData?.idNumber && (
                  <div className="rounded-lg border p-3">
                    <p className="text-sm font-medium text-gray-700">ID Number</p>
                    <p className="text-sm text-gray-900">{idDocument.extractedData.idNumber}</p>
                  </div>
                )}
              </div>

              {(nameMatch === false || dobMatch === false) && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Discrepancies detected between provided information and ID document
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Visual Checklist */}
            <div className="space-y-4">
              <h3 className="font-semibold">Visual Verification Checklist</h3>
              
              <div className="space-y-2">
                <label className="flex items-start gap-3 rounded-lg border p-3 hover:bg-gray-50">
                  <input type="checkbox" className="mt-1" />
                  <div>
                    <p className="text-sm font-medium">Photo matches selfie</p>
                    <p className="text-xs text-gray-500">
                      Face on ID document matches uploaded selfie
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 rounded-lg border p-3 hover:bg-gray-50">
                  <input type="checkbox" className="mt-1" />
                  <div>
                    <p className="text-sm font-medium">Document is clear and readable</p>
                    <p className="text-xs text-gray-500">
                      All text and details are visible without blur
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 rounded-lg border p-3 hover:bg-gray-50">
                  <input type="checkbox" className="mt-1" />
                  <div>
                    <p className="text-sm font-medium">No signs of tampering</p>
                    <p className="text-xs text-gray-500">
                      Document appears authentic without alterations
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 rounded-lg border p-3 hover:bg-gray-50">
                  <input type="checkbox" className="mt-1" />
                  <div>
                    <p className="text-sm font-medium">Document is not expired</p>
                    <p className="text-xs text-gray-500">
                      Expiry date is valid or N/A
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 rounded-lg border p-3 hover:bg-gray-50">
                  <input type="checkbox" className="mt-1" />
                  <div>
                    <p className="text-sm font-medium">Selfie shows live person</p>
                    <p className="text-xs text-gray-500">
                      Not a photo of a photo or screen
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Side-by-Side Image Comparison */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Image Comparison</CardTitle>
              <CardDescription>Compare ID document photo with selfie</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleRotate}>
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* ID Document */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant={activeImage === 'id' ? 'default' : 'outline'}>
                  ID Document ({idDocument.type})
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveImage('id')}
                >
                  Focus
                </Button>
              </div>
              <div className="relative overflow-hidden rounded-lg border bg-gray-50">
                <div
                  className="flex items-center justify-center"
                  style={{
                    minHeight: '400px',
                    transform: `scale(${zoom / 100}) rotate(${activeImage === 'id' ? rotation : 0}deg)`,
                    transition: 'transform 0.3s',
                  }}
                >
                  <Image
                    src={idDocument.url}
                    alt="ID Document"
                    width={400}
                    height={400}
                    className="max-h-[400px] w-auto object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Selfie */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant={activeImage === 'selfie' ? 'default' : 'outline'}>
                  Selfie Photo
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveImage('selfie')}
                >
                  Focus
                </Button>
              </div>
              <div className="relative overflow-hidden rounded-lg border bg-gray-50">
                <div
                  className="flex items-center justify-center"
                  style={{
                    minHeight: '400px',
                    transform: `scale(${zoom / 100}) rotate(${activeImage === 'selfie' ? rotation : 0}deg)`,
                    transition: 'transform 0.3s',
                  }}
                >
                  <Image
                    src={selfie.url}
                    alt="Selfie"
                    width={400}
                    height={400}
                    className="max-h-[400px] w-auto object-contain"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center text-sm text-gray-500">
            Current zoom: {zoom}% | Rotation: {rotation}°
          </div>
        </CardContent>
      </Card>
    </div>
  );
}