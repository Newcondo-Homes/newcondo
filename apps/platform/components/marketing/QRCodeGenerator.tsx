// apps/platform/components/marketing/QRCodeGenerator.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Button } from '@newcondo/ui/components/button';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';
import { toast } from '@newcondo/ui';
import { QrCode, Download, ExternalLink, Info } from 'lucide-react';
import Image from 'next/image';

interface QRCodeGeneratorProps {
  propertyId: string;
  shareableLink: string;
  propertyTitle: string;
}

export function QRCodeGenerator({
  shareableLink,
  propertyTitle,
}: QRCodeGeneratorProps) {

  // Generate QR code URL using Google Charts API (free service)
  const getQRCodeUrl = (size: number = 300) => {
    const encodedUrl = encodeURIComponent(shareableLink);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedUrl}`;
  };

  const handleDownload = async (size: number = 500) => {
    try {
      const qrUrl = getQRCodeUrl(size);
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${propertyTitle.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('QR Code downloaded', {
        description: 'QR code saved successfully',
      });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failded', {
        description: 'Failed to download QR code',
      });
    }
  };

  const openQRCodeInNewTab = () => {
    window.open(getQRCodeUrl(500), '_blank');
  };

  if (!shareableLink) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Generate a shareable link first to create a QR code
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Use this QR code on flyers, posters, or digital media to make it easy for people to access your property listing.
          </AlertDescription>
        </Alert>

        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <Image
              src={getQRCodeUrl(300)}
              alt={`QR code for ${propertyTitle}`}
              width={300}
              height={300}
              className="w-[300px] h-[300px]"
            />
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Scan this QR code to view the property
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            <Button
              onClick={() => handleDownload(500)}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Download High-Res
            </Button>
            <Button
              onClick={openQRCodeInNewTab}
              variant="outline"
              size="sm"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}