'use client';

import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@newcondo/ui/components/dialog';
import { Input } from '@newcondo/ui/components/input';
import { Label } from '@newcondo/ui/components/label';
// import { Separator } from '@newcondo/ui/components/separator';
// import { Badge } from '@newcondo/ui/components/badge';
// import { Textarea } from '@newcondo/ui/components/textarea';
import { PenTool, RotateCcw, Check, X, Download, Upload, Smartphone } from 'lucide-react';
import { toast } from '@newcondo/ui/';

interface DigitalSignatureProps {
  documentTitle: string;
  documentContent?: string;
  signerName: string;
  signerEmail: string;
  onSignatureComplete: (signatureData: SignatureData) => void;
  onCancel?: () => void;
  isOpen: boolean;
  className?: string;
  signatureType?: 'canvas' | 'text' | 'upload';
}

interface SignatureData {
  signature: string; // Base64 encoded signature image or text
  signerName: string;
  signerEmail: string;
  timestamp: string;
  ipAddress?: string;
  signatureType: 'canvas' | 'text' | 'upload';
  deviceInfo?: string;
}

export default function DigitalSignature({
  documentTitle,
  documentContent,
  signerName,
  signerEmail,
  onSignatureComplete,
  onCancel,
  isOpen,
  className = '',
  signatureType = 'canvas'
}: DigitalSignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureText, setSignatureText] = useState('');
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);
  const [currentSignatureType, setCurrentSignatureType] = useState<'canvas' | 'text' | 'upload'>(signatureType);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize canvas
  useEffect(() => {
    if (currentSignatureType === 'canvas' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Set canvas background to white
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Set drawing properties
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
      }
    }
  }, [currentSignatureType, isOpen]);

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const isCanvasEmpty = (): boolean => {
    if (!canvasRef.current) return true;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return true;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Check if all pixels are white (255, 255, 255, 255)
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) {
        return false;
      }
    }
    
    return true;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file type', {
        description: 'Please upload an image file.',
      });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error( 'File too large',{
        description: 'Please upload an image smaller than 5MB.',
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedSignature(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validateSignature = (): boolean => {
    switch (currentSignatureType) {
      case 'canvas':
        return !isCanvasEmpty();
      case 'text':
        return signatureText.trim().length > 0;
      case 'upload':
        return uploadedSignature !== null;
      default:
        return false;
    }
  };

  const getSignatureData = (): string => {
    switch (currentSignatureType) {
      case 'canvas':
        return canvasRef.current?.toDataURL() || '';
      case 'text':
        return signatureText;
      case 'upload':
        return uploadedSignature || '';
      default:
        return '';
    }
  };

  const handleSign = () => {
    if (!validateSignature()) {
      toast.error('Signature Required', {
        description: 'Please provide your signature before continuing.',
      });
      return;
    }
    
    setIsConfirmDialogOpen(true);
  };

  const confirmSignature = async () => {
    try {
      setLoading(true);
      
      // Get device information
      const deviceInfo = navigator.userAgent;
      
      const signatureData: SignatureData = {
        signature: getSignatureData(),
        signerName,
        signerEmail,
        timestamp: new Date().toISOString(),
        signatureType: currentSignatureType,
        deviceInfo
      };
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSignatureComplete(signatureData);
      
      toast.success('Document Signed',{
        description: 'Your digital signature has been successfully recorded.',
      });
      
    } catch (error) {
      toast.error('Signature Failed', {
        description: 'There was an error processing your signature. Please try again.',
      });
    } finally {
      setLoading(false);
      setIsConfirmDialogOpen(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onCancel}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5" />
              Digital Signature Required
            </DialogTitle>
            <DialogDescription>
              Please sign the document: {documentTitle}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Document Preview */}
            {documentContent && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Document Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-40 overflow-y-auto border rounded p-4 bg-gray-50">
                    <pre className="text-sm whitespace-pre-wrap">
                      {documentContent}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Signer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Signer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <p className="text-sm font-medium">{signerName}</p>
                  </div>
                  <div>
                    <Label>Email Address</Label>
                    <p className="text-sm font-medium">{signerEmail}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Signature Type Selection */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Signature Method</Label>
              <div className="flex gap-2">
                <Button
                  variant={currentSignatureType === 'canvas' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentSignatureType('canvas')}
                  className="flex items-center gap-2"
                >
                  <PenTool className="h-4 w-4" />
                  Draw
                </Button>
                <Button
                  variant={currentSignatureType === 'text' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentSignatureType('text')}
                  className="flex items-center gap-2"
                >
                  Type
                </Button>
                <Button
                  variant={currentSignatureType === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentSignatureType('upload')}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload
                </Button>
              </div>
            </div>
            
            {/* Signature Input */}
            <Card>
              <CardContent className="pt-6">
                {currentSignatureType === 'canvas' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Draw Your Signature</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearCanvas}
                        className="flex items-center gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Clear
                      </Button>
                    </div>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <canvas
                        ref={canvasRef}
                        width={600}
                        height={200}
                        className="w-full border rounded cursor-crosshair touch-none"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <Smartphone className="h-3 w-3" />
                        Use your mouse or touch to sign above
                      </p>
                    </div>
                  </div>
                )}
                
                {currentSignatureType === 'text' && (
                  <div className="space-y-4">
                    <Label htmlFor="signature-text">Type Your Full Name</Label>
                    <Input
                      id="signature-text"
                      value={signatureText}
                      onChange={(e) => setSignatureText(e.target.value)}
                      placeholder="Enter your full legal name"
                      className="font-serif text-lg"
                    />
                    {signatureText && (
                      <div className="p-4 border rounded bg-gray-50">
                        <Label className="text-sm text-gray-600">Preview:</Label>
                        <p className="font-serif text-2xl mt-2">{signatureText}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {currentSignatureType === 'upload' && (
                  <div className="space-y-4">
                    <Label htmlFor="signature-upload">Upload Signature Image</Label>
                    <Input
                      id="signature-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="cursor-pointer"
                    />
                    {uploadedSignature && (
                      <div className="p-4 border rounded bg-gray-50">
                        <Label className="text-sm text-gray-600">Preview:</Label>
                        <img
                          src={uploadedSignature}
                          alt="Uploaded signature"
                          className="max-h-32 mt-2 border rounded"
                        />
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Supported formats: JPG, PNG, GIF. Max size: 5MB
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Legal Notice */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Legal Notice:</strong> By signing this document electronically, you agree that your electronic signature 
                is the legal equivalent of your manual signature and that you are legally bound by the terms of this document.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleSign}
              disabled={!validateSignature()}
              className="flex items-center gap-2"
            >
              <PenTool className="h-4 w-4" />
              Sign Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Signature</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 border rounded bg-gray-50">
              <Label className="text-sm font-medium">Document:</Label>
              <p className="text-sm">{documentTitle}</p>
            </div>
            
            <div className="p-4 border rounded bg-gray-50">
              <Label className="text-sm font-medium">Signer:</Label>
              <p className="text-sm">{signerName} ({signerEmail})</p>
            </div>
            
            <div className="p-4 border rounded bg-gray-50">
              <Label className="text-sm font-medium">Timestamp:</Label>
              <p className="text-sm">{new Date().toLocaleString()}</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmSignature}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>Loading...</>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Confirm & Sign
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}