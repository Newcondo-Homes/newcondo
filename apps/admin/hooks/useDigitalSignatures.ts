// apps/admin/src/hooks/useDigitalSignatures.ts

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  digitalSignaturesApi, 
  type DigitalSignature, 
  type CreateSignatureRequest,
  type SignatureVerificationResult,
  type SignatureTemplate
} from '../lib/api/digitalSignatures';
import { toast } from 'sonner';

interface UseDigitalSignaturesOptions {
  documentId?: string;
  userId?: string;
  enabled?: boolean;
}

interface SignatureState {
  isProcessing: boolean;
  currentSignature: DigitalSignature | null;
  verificationResult: SignatureVerificationResult | null;
}

export const useDigitalSignatures = (options: UseDigitalSignaturesOptions = {}) => {
  const { documentId, userId, enabled = true } = options;
  const queryClient = useQueryClient();
  
  const [signatureState, setSignatureState] = useState<SignatureState>({
    isProcessing: false,
    currentSignature: null,
    verificationResult: null
  });

  // Fetch digital signatures for a document or user
  const {
    data: signatures,
    isLoading: isLoadingSignatures,
    error: signaturesError,
    refetch: refetchSignatures
  } = useQuery({
    queryKey: ['digitalSignatures', { documentId, userId }],
    queryFn: () => digitalSignaturesApi.getSignatures({ documentId, userId }),
    enabled: enabled && (!!documentId || !!userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch signature templates
  const {
    data: templates,
    isLoading: isLoadingTemplates,
    error: templatesError
  } = useQuery({
    queryKey: ['signatureTemplates'],
    queryFn: digitalSignaturesApi.getSignatureTemplates,
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Create digital signature mutation
  const createSignatureMutation = useMutation({
    mutationFn: digitalSignaturesApi.createSignature,
    onMutate: () => {
      setSignatureState(prev => ({ ...prev, isProcessing: true }));
    },
    onSuccess: (signature) => {
      queryClient.invalidateQueries({ queryKey: ['digitalSignatures'] });
      setSignatureState(prev => ({ 
        ...prev, 
        isProcessing: false,
        currentSignature: signature 
      }));
      toast.success('Digital signature created successfully');
    },
    onError: (error: any) => {
      setSignatureState(prev => ({ ...prev, isProcessing: false }));
      toast.error(error.message || 'Failed to create digital signature');
    }
  });

  // Verify signature mutation
  const verifySignatureMutation = useMutation({
    mutationFn: digitalSignaturesApi.verifySignature,
    onMutate: () => {
      setSignatureState(prev => ({ ...prev, isProcessing: true }));
    },
    onSuccess: (result) => {
      setSignatureState(prev => ({ 
        ...prev, 
        isProcessing: false,
        verificationResult: result 
      }));
      if (result.isValid) {
        toast.success('Signature verified successfully');
      } else {
        toast.error('Signature verification failed');
      }
    },
    onError: (error: any) => {
      setSignatureState(prev => ({ ...prev, isProcessing: false }));
      toast.error(error.message || 'Failed to verify signature');
    }
  });

  // Update signature status mutation
  const updateSignatureStatusMutation = useMutation({
    mutationFn: digitalSignaturesApi.updateSignatureStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digitalSignatures'] });
      toast.success('Signature status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update signature status');
    }
  });

  // Create signature template mutation
  const createTemplateMutation = useMutation({
    mutationFn: digitalSignaturesApi.createSignatureTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signatureTemplates'] });
      toast.success('Signature template created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create signature template');
    }
  });

  // Callback functions
  const createSignature = useCallback(async (request: CreateSignatureRequest) => {
    return createSignatureMutation.mutateAsync(request);
  }, [createSignatureMutation]);

  const verifySignature = useCallback(async (signatureId: string) => {
    return verifySignatureMutation.mutateAsync(signatureId);
  }, [verifySignatureMutation]);

  const updateSignatureStatus = useCallback(async (
    signatureId: string, 
    status: 'VALID' | 'INVALID' | 'REVOKED'
  ) => {
    return updateSignatureStatusMutation.mutateAsync({ signatureId, status });
  }, [updateSignatureStatusMutation]);

  const createTemplate = useCallback(async (template: Omit<SignatureTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    return createTemplateMutation.mutateAsync(template);
  }, [createTemplateMutation]);

  const getSignaturesByStatus = useCallback((status: 'PENDING' | 'SIGNED' | 'REJECTED') => {
    return signatures?.filter(sig => sig.status === status) || [];
  }, [signatures]);

  const resetSignatureState = useCallback(() => {
    setSignatureState({
      isProcessing: false,
      currentSignature: null,
      verificationResult: null
    });
  }, []);

  // Get signature statistics
  const signatureStats = useCallback(() => {
    if (!signatures) return null;

    return {
      total: signatures.length,
      pending: signatures.filter(s => s.status === 'PENDING').length,
      signed: signatures.filter(s => s.status === 'SIGNED').length,
      rejected: signatures.filter(s => s.status === 'REJECTED').length,
      expired: signatures.filter(s => s.expiresAt && new Date(s.expiresAt) < new Date()).length
    };
  }, [signatures]);

  return {
    // Data
    signatures: signatures || [],
    templates: templates || [],
    signatureState,
    signatureStats: signatureStats(),

    // Loading states
    isLoading: isLoadingSignatures || isLoadingTemplates,
    isLoadingSignatures,
    isLoadingTemplates,
    isCreating: createSignatureMutation.isPending,
    isVerifying: verifySignatureMutation.isPending,
    isUpdating: updateSignatureStatusMutation.isPending,

    // Error states
    error: signaturesError || templatesError,
    signaturesError,
    templatesError,

    // Actions
    createSignature,
    verifySignature,
    updateSignatureStatus,
    createTemplate,
    refetchSignatures,
    resetSignatureState,
    
    // Utility functions
    getSignaturesByStatus,
    
    // Mutation objects (for direct access if needed)
    createSignatureMutation,
    verifySignatureMutation,
    updateSignatureStatusMutation,
    createTemplateMutation
  };
};

// Hook for managing signature workflow
export const useSignatureWorkflow = (documentId: string) => {
  const [currentStep, setCurrentStep] = useState<'upload' | 'sign' | 'verify' | 'complete'>('upload');
  const [signatureData, setSignatureData] = useState<any>(null);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => {
      switch (prev) {
        case 'upload': return 'sign';
        case 'sign': return 'verify';
        case 'verify': return 'complete';
        default: return prev;
      }
    });
  }, []);

  const previousStep = useCallback(() => {
    setCurrentStep(prev => {
      switch (prev) {
        case 'complete': return 'verify';
        case 'verify': return 'sign';
        case 'sign': return 'upload';
        default: return prev;
      }
    });
  }, []);

  const resetWorkflow = useCallback(() => {
    setCurrentStep('upload');
    setSignatureData(null);
  }, []);

  return {
    currentStep,
    signatureData,
    setSignatureData,
    nextStep,
    previousStep,
    resetWorkflow,
    isComplete: currentStep === 'complete'
  };
};

// Hook for signature validation
export const useSignatureValidation = () => {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateSignature = useCallback((signature: Partial<DigitalSignature>) => {
    const errors: string[] = [];

    if (!signature.signedData) {
      errors.push('Signature data is required');
    }

    if (!signature.signerEmail) {
      errors.push('Signer email is required');
    }

    if (!signature.documentHash) {
      errors.push('Document hash is required for verification');
    }

    if (signature.expiresAt && new Date(signature.expiresAt) < new Date()) {
      errors.push('Signature has expired');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  }, []);

  return {
    validationErrors,
    validateSignature,
    isValid: validationErrors.length === 0
  };
};