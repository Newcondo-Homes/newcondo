"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@newcondo/ui/components/card";
import { Button } from "@newcondo/ui/components/button";
import { Badge } from "@newcondo/ui/components/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@newcondo/ui/components/tabs";
import { 
  Image as ImageIcon, 
  FileText, 
  Download, 
  Maximize2,
  ZoomIn,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";

interface Evidence {
  id: string;
  type: "IMAGE" | "DOCUMENT" | "BOUNDARY_DATA";
  url: string;
  filename: string;
  description?: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  propertyId: string;
  propertyTitle: string;
  metadata?: {
    fileSize?: number;
    mimeType?: string;
    dimensions?: { width: number; height: number };
  };
}

interface DisputeEvidenceProps {
  originalPropertyEvidence: Evidence[];
  duplicatePropertyEvidence: Evidence[];
}

export default function DisputeEvidence({
  originalPropertyEvidence,
  duplicatePropertyEvidence,
}: DisputeEvidenceProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const renderEvidenceCard = (evidence: Evidence) => {
    const isImage = evidence.type === "IMAGE";
    const isDocument = evidence.type === "DOCUMENT";
    const isBoundaryData = evidence.type === "BOUNDARY_DATA";

    return (
      <Card key={evidence.id} className="overflow-hidden">
        <CardContent className="p-0">
          {/* Preview */}
          <div className="bg-gray-100 aspect-video flex items-center justify-center relative group">
            {isImage ? (
              <>
                <img
                  src={evidence.url}
                  alt={evidence.description || evidence.filename}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setSelectedImage(evidence.url)}
                  >
                    <ZoomIn className="h-4 w-4 mr-2" />
                    View Full Size
                  </Button>
                </div>
              </>
            ) : isDocument ? (
              <div className="text-center p-6">
                <FileText className="h-16 w-16 mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-medium">{evidence.filename}</p>
              </div>
            ) : (
              <div className="text-center p-6">
                <FileText className="h-16 w-16 mx-auto text-blue-400 mb-2" />
                <p className="text-sm font-medium">Boundary Data</p>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-4 space-y-3">
            <div>
              <h4 className="font-medium text-sm truncate">{evidence.filename}</h4>
              {evidence.description && (
                <p className="text-xs text-gray-500 mt-1">{evidence.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Badge variant="outline" className="text-xs">
                {evidence.type}
              </Badge>
              {evidence.metadata?.fileSize && (
                <span>{formatFileSize(evidence.metadata.fileSize)}</span>
              )}
            </div>

            <div className="text-xs text-gray-500">
              <p>Uploaded by {evidence.uploadedByName}</p>
              <p>{format(new Date(evidence.uploadedAt), "PPp")}</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <a href={evidence.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open
                </a>
              </Button>
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <a href={evidence.url} download={evidence.filename}>
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Tabs defaultValue="original" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="original">
            Original Property Evidence ({originalPropertyEvidence.length})
          </TabsTrigger>
          <TabsTrigger value="duplicate">
            Disputed Property Evidence ({duplicatePropertyEvidence.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="original" className="mt-6">
          {originalPropertyEvidence.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ImageIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No evidence available for original property</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {originalPropertyEvidence.map(renderEvidenceCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="duplicate" className="mt-6">
          {duplicatePropertyEvidence.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ImageIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No evidence available for disputed property</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {duplicatePropertyEvidence.map(renderEvidenceCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-7xl max-h-full">
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4 z-10"
              onClick={() => setSelectedImage(null)}
            >
              Close
            </Button>
            <img
              src={selectedImage}
              alt="Evidence"
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}