"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@newcondo/ui/dialog";
import { Button } from "@newcondo/ui/button";
import { ZoomIn, ZoomOut, Download, RotateCw } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

interface Document {
  id: string;
  documentType: string;
  fileName?: string;
  fileUrl?: string;
  mimeType?: string;
}

interface DocumentViewerProps {
  document: Document;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentViewer({ document, open, onOpenChange }: DocumentViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDownload = () => {
    if (document.fileUrl) {
      window.open(document.fileUrl, "_blank");
    }
  };

  const isImage = document.mimeType?.startsWith("image/") ?? document.fileUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPdf = document.mimeType === "application/pdf" ?? document.fileUrl?.endsWith(".pdf");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {document.documentType.replace(/_/g, " ")}
            {document.fileName && ` - ${document.fileName}`}
          </DialogTitle>
        </DialogHeader>

        {/* Controls */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom <= 50}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[60px] text-center">{zoom}%</span>
            <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 200}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            {isImage && (
              <Button variant="outline" size="sm" onClick={handleRotate}>
                <RotateCw className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>

        {/* Document Display */}
        <div className="flex-1 overflow-auto">
          {isImage && document.fileUrl && (
            <div className="flex items-center justify-center p-4 min-h-[400px]">
              <div
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transition: "transform 0.3s ease",
                }}
              >
                <Image
                  src={document.fileUrl}
                  alt={document.documentType}
                  width={800}
                  height={600}
                  className="max-w-full h-auto"
                  style={{ objectFit: "contain" }}
                />
              </div>
            </div>
          )}

          {isPdf && document.fileUrl && (
            <iframe
              src={document.fileUrl}
              className="w-full h-[600px] border-0"
              title={document.documentType}
            />
          )}

          {!isImage && !isPdf && document.fileUrl && (
            <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
              <p className="text-muted-foreground mb-4">
                Preview not available for this file type
              </p>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download to View
              </Button>
            </div>
          )}

          {!document.fileUrl && (
            <div className="flex items-center justify-center p-8 text-center min-h-[400px]">
              <div>
                <p className="text-muted-foreground mb-2">No file attached</p>
                {document.documentType.includes("NIN") || document.documentType.includes("BVN") ? (
                  <p className="text-sm text-muted-foreground">
                    This document requires ID number verification only
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}