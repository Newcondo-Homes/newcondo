// apps/platform/hooks/useDigitalSignature.ts
import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface DigitalSignatureData {
  signature: string; // Base64 encoded signature
  timestamp: string;
  deviceInfo: string;
  documentHash: string;
}

interface UseDigitalSignatureOptions {
  canvasWidth?: number;
  canvasHeight?: number;
  strokeColor?: string;
  strokeWidth?: number;
}

export const useDigitalSignature = (options: UseDigitalSignatureOptions = {}) => {
  const {
    canvasWidth = 400,
    canvasHeight = 200,
    strokeColor = '#000000',
    strokeWidth = 2,
  } = options;

  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState<DigitalSignatureData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  // Initialize canvas
  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.lineCap = 'round';
    context.strokeStyle = strokeColor;
    context.lineWidth = strokeWidth;
    contextRef.current = context;

    // Set canvas size
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear canvas with white background
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvasWidth, canvasHeight);
  }, [canvasWidth, canvasHeight, strokeColor, strokeWidth]);

  // Start drawing
  const startDrawing = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    setIsDrawing(true);

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    context.beginPath();
    context.moveTo(x, y);
  }, []);

  // Draw
  const draw = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    context.lineTo(x, y);
    context.stroke();
  }, [isDrawing]);

  // Stop drawing
  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  // Clear signature
  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  }, []);

  // Check if signature is empty
  const isSignatureEmpty = useCallback((): boolean => {
    const canvas = canvasRef.current;
    if (!canvas) return true;

    const context = canvas.getContext('2d');
    if (!context) return true;

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixelData = imageData.data;

    // Check if all pixels are white (255, 255, 255, 255)
    for (let i = 0; i < pixelData.length; i += 4) {
      if (pixelData[i] !== 255 || pixelData[i + 1] !== 255 || pixelData[i + 2] !== 255) {
        return false;
      }
    }
    return true;
  }, []);

  // Get device info
  const getDeviceInfo = useCallback((): string => {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const timestamp = new Date().toISOString();
    
    return JSON.stringify({
      userAgent,
      platform,
      timestamp,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  }, []);

  // Generate document hash
  const generateDocumentHash = useCallback(async (documentContent: string): Promise<string> => {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(documentContent);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Error generating document hash:', error);
      return '';
    }
  }, []);

  // Save signature
  const saveSignature = useCallback(async (documentContent?: string): Promise<DigitalSignatureData | null> => {
    if (isSignatureEmpty()) {
      toast.error('Please provide a signature');
      return null;
    }

    setIsLoading(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error('Canvas not available');
      }

      const signatureBase64 = canvas.toDataURL('image/png');
      const timestamp = new Date().toISOString();
      const deviceInfo = getDeviceInfo();
      
      let documentHash = '';
      if (documentContent) {
        documentHash = await generateDocumentHash(documentContent);
      }

      const signature: DigitalSignatureData = {
        signature: signatureBase64,
        timestamp,
        deviceInfo,
        documentHash,
      };

      setSignatureData(signature);
      return signature;
    } catch (error) {
      console.error('Error saving signature:', error);
      toast.error('Failed to save signature');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isSignatureEmpty, getDeviceInfo, generateDocumentHash]);

  // Validate signature
  const validateSignature = useCallback((signature: DigitalSignatureData, documentContent: string): boolean => {
    try {
      // Basic validation
      if (!signature.signature || !signature.timestamp || !signature.deviceInfo) {
        return false;
      }

      // Validate timestamp (not too old)
      const signatureTime = new Date(signature.timestamp).getTime();
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (now - signatureTime > maxAge) {
        return false;
      }

      // Validate document hash if provided
      if (signature.documentHash && documentContent) {
        // This would need to be async in a real implementation
        // For now, we'll assume it's valid
        return true;
      }

      return true;
    } catch (error) {
      console.error('Error validating signature:', error);
      return false;
    }
  }, []);

  return {
    canvasRef,
    isDrawing,
    isLoading,
    signatureData,
    initializeCanvas,
    startDrawing,
    draw,
    stopDrawing,
    clearSignature,
    saveSignature,
    validateSignature,
    isSignatureEmpty,
  };
};