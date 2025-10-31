"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@newcondo/ui/card";
import { Button } from "@newcondo/ui/button";
import { Textarea } from "@newcondo/ui/textarea";
import { Badge } from "@newcondo/ui/badge";
import { 
  CheckCircle, XCircle, AlertCircle, FileText, 
  Eye, Download, ZoomIn 
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@newcondo/ui/alert-dialog";
import { adminApi } from "@/lib/api/admin";
import { useToast } from "@newcondo/ui/use-toast";
import { DocumentViewer } from "./DocumentViewer";

interface Document {
  id: string;
  documentType: string;
  documentSide?: string;
  documentNumber?: string;
  fileName?: string;
  fileUrl?: string;
  status: string;
  verificationNotes?: string;
  createdAt: string;
}

interface DocumentReviewProps {
  userId: string;
  documents: Document[];
  onReviewComplete?: () => void;
}

export function DocumentReview({ userId, documents, onReviewComplete }: DocumentReviewProps) {
  const { toast } = useToast();
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [actionDialog, setActionDialog] = useState(false);
  const [currentAction, setCurrentAction] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleApprove = (doc: Document) => {
    setSelectedDoc(doc);
    setCurrentAction("approve");
    setActionDialog(true);
  };

  const handleReject = (doc: Document) => {
    setSelectedDoc(doc);
    setCurrentAction("reject");
    setRejectionReason("");
    setActionDialog(true);
  };

  const handleViewDocument = (doc: Document) => {
    setSelectedDoc(doc);
    setViewerOpen(true);
  };

  const executeAction = async () => {
    if (!selectedDoc) return;

    try {
      setLoading(true);
      
      if (currentAction === "approve") {
        await adminApi.approveDocument(selectedDoc.id);
        toast({
          title: "Document Approved",
          description: "The document has been successfully approved",
        });
      } else if (currentAction === "reject") {
        if (!rejectionReason.trim()) {
          toast({
            title: "Rejection Reason Required",
            description: "Please provide a reason for rejection",
            variant: "destructive",
          });
          return;
        }
        
        await adminApi.rejectDocument(selectedDoc.id, rejectionReason);
        toast({
          title: "Document Rejected",
          description: "The document has been rejected",
          variant: "destructive",
        });
      }
      
      setActionDialog(false);
      setSelectedDoc(null);
      setRejectionReason("");
      
      if (onReviewComplete) {
        onReviewComplete();
      }
    } catch (error: any) {
      toast({
        title: "Action Failed",
        description: error.message || "Failed to process document",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDocumentType = (type: string) => {
    return type.replace(/_/g, " ").toLowerCase()
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <>
      <div className="space-y-4">
        {documents.map((doc) => (
          <Card key={doc.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 rounded-lg bg-blue-100">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">
                          {formatDocumentType(doc.documentType)}
                        </h4>
                        {doc.documentSide && (
                          <p className="text-sm text-muted-foreground">
                            {doc.documentSide}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(doc.status)}
                    </div>

                    {doc.documentNumber && (
                      <p className="text-sm">
                        <span className="font-medium">Document Number:</span>{" "}
                        {doc.documentNumber}
                      </p>
                    )}

                    {doc.fileName && (
                      <p className="text-sm text-muted-foreground">
                        {doc.fileName}
                      </p>
                    )}

                    {doc.verificationNotes && doc.status === "REJECTED" && (
                      <div className="p-3 rounded-md bg-red-50 border border-red-200">
                        <p className="text-sm text-red-800">
                          <strong>Rejection Reason:</strong> {doc.verificationNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {doc.fileUrl && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDocument(doc)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(doc.fileUrl, "_blank")}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  
                  {doc.status === "PENDING" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:text-green-700"
                        onClick={() => handleApprove(doc)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleReject(doc)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {documents.length === 0 && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No documents submitted</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Document Viewer Dialog */}
      {selectedDoc && viewerOpen && (
        <DocumentViewer
          document={selectedDoc}
          open={viewerOpen}
          onOpenChange={setViewerOpen}
        />
      )}

      {/* Action Confirmation Dialog */}
      <AlertDialog open={actionDialog} onOpenChange={setActionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {currentAction === "approve" ? "Approve Document" : "Reject Document"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {currentAction === "approve" ? (
                "Are you sure you want to approve this document?"
              ) : (
                <div className="space-y-3">
                  <p>Please provide a reason for rejecting this document:</p>
                  <Textarea
                    placeholder="Enter rejection reason..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                  />
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeAction} disabled={loading}>
              {loading ? "Processing..." : currentAction === "approve" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}