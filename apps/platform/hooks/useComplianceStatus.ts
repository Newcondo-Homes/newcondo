import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { complianceApi } from '@/lib/api/compliance';
import { useComplianceStore } from '@/store/complianceStore';
import type { 
  ComplianceStatus,
  ComplianceReport,
  ComplianceCheckResult,
  ComplianceRequirement,
  UserRole,
  PropertyType 
} from '@/types/compliance';
import { toast } from 'sonner';

interface UseComplianceStatusOptions {
  propertyId?: string;
  userId?: string;
  userRole?: UserRole;
  propertyType?: PropertyType;
  autoCheck?: boolean;
}

export const useComplianceStatus = (options: UseComplianceStatusOptions = {}) => {
  const {
    propertyId,
    userId,
    userRole,
    propertyType,
    autoCheck = true
  } = options;

  const queryClient = useQueryClient();
  const { 
    setComplianceStatus, 
    setRequirements, 
    setLoading, 
    setError 
  } = useComplianceStore();

  // Fetch compliance status
  const {
    data: complianceReport,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['compliance-status', propertyId, userId],
    queryFn: async () => {
      setLoading(true);
      try {
        const report = await complianceApi.getComplianceStatus({
          propertyId,
          userId
        });
        setComplianceStatus(report.status);
        setError(null);
        return report;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch compliance status';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    enabled: !!(propertyId || userId),
    refetchInterval: autoCheck ? 60000 : false, // Check every minute if auto-check is enabled
  });

  // Fetch compliance requirements
  const { data: requirements } = useQuery({
    queryKey: ['compliance-requirements', userRole, propertyType],
    queryFn: async () => {
      const reqs = await complianceApi.getRequirements({
        userRole,
        propertyType
      });
      setRequirements(reqs);
      return reqs;
    },
    enabled: !!(userRole || propertyType),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Run compliance check
  const runComplianceCheckMutation = useMutation({
    mutationFn: () => complianceApi.runComplianceCheck({
      propertyId,
      userId
    }),
    onSuccess: (result) => {
      queryClient.setQueryData(
        ['compliance-status', propertyId, userId],
        (old: ComplianceReport | undefined) => 
          old ? { ...old, ...result, lastCheckedAt: new Date().toISOString() } : result
      );
      setComplianceStatus(result.status);
      
      if (result.status === ComplianceStatus.COMPLIANT) {
        toast.success('All compliance requirements met!');
      } else {
        toast.warning(`${result.missingRequirements?.length || 0} compliance issues found`);
      }
    },
    onError: (error) => {
      const errorMsg = error instanceof Error ? error.message : 'Compliance check failed';
      toast.error(errorMsg);
      setError(errorMsg);
    }
  });

  // Accept terms and conditions
  const acceptTermsMutation = useMutation({
    mutationFn: (termsVersion: string) => 
      complianceApi.acceptTerms(termsVersion),
    onSuccess: () => {
      toast.success('Terms and conditions accepted');
      refetch(); // Refresh compliance status
    },
    onError: (error) => {
      const errorMsg = error instanceof Error ? error.message : 'Failed to accept terms';
      toast.error(errorMsg);
    }
  });

  // Accept privacy policy
  const acceptPrivacyPolicyMutation = useMutation({
    mutationFn: (policyVersion: string) => 
      complianceApi.acceptPrivacyPolicy(policyVersion),
    onSuccess: () => {
      toast.success('Privacy policy accepted');
      refetch();
    },
    onError: (error) => {
      const errorMsg = error instanceof Error ? error.message : 'Failed to accept privacy policy';
      toast.error(errorMsg);
    }
  });

  // Submit undertaking
  const submitUndertakingMutation = useMutation({
    mutationFn: (undertakingData: {
      documentUrl?: string;
      digitalSignature?: string;
      agreementText: string;
    }) => complianceApi.submitUndertaking(undertakingData),
    onSuccess: () => {
      toast.success('Undertaking submitted successfully');
      refetch();
    },
    onError: (error) => {
      const errorMsg = error instanceof Error ? error.message : 'Failed to submit undertaking';
      toast.error(errorMsg);
    }
  });

  // Calculate compliance score
  const complianceScore = useMemo(() => {
    if (!complianceReport || !requirements) return 0;

    const totalRequirements = requirements.length;
    const completedRequirements = requirements.filter(req => 
      complianceReport.completedRequirements?.includes(req.id)
    ).length;

    return totalRequirements > 0 ? (completedRequirements / totalRequirements) * 100 : 0;
  }, [complianceReport, requirements]);

  // Get missing requirements
  const missingRequirements = useMemo(() => {
    if (!complianceReport || !requirements) return [];

    return requirements.filter(req => 
      !complianceReport.completedRequirements?.includes(req.id)
    );
  }, [complianceReport, requirements]);

  // Get critical missing requirements
  const criticalMissingRequirements = useMemo(() => {
    return missingRequirements.filter(req => req.isCritical);
  }, [missingRequirements]);

  // Check if specific requirement is met
  const isRequirementMet = useCallback((requirementId: string): boolean => {
    return complianceReport?.completedRequirements?.includes(requirementId) || false;
  }, [complianceReport]);

  // Check if user can proceed with property listing
  const canListProperty = useMemo(() => {
    if (!complianceReport) return false;
    
    return complianceReport.status === ComplianceStatus.COMPLIANT ||
           criticalMissingRequirements.length === 0;
  }, [complianceReport, criticalMissingRequirements]);

  // Check if user can rent property
  const canRentProperty = useMemo(() => {
    if (!complianceReport) return false;
    
    // For renters, basic verification might be sufficient
    return complianceReport.status === ComplianceStatus.COMPLIANT ||
           complianceReport.status === ComplianceStatus.PARTIAL;
  }, [complianceReport]);

  // Get next required action
  const nextRequiredAction = useMemo((): ComplianceRequirement | null => {
    const critical = criticalMissingRequirements[0];
    if (critical) return critical;
    
    return missingRequirements[0] || null;
  }, [criticalMissingRequirements, missingRequirements]);

  // Get compliance status color
  const getStatusColor = useCallback((status: ComplianceStatus) => {
    switch (status) {
      case ComplianceStatus.COMPLIANT:
        return 'green';
      case ComplianceStatus.PARTIAL:
        return 'yellow';
      case ComplianceStatus.NON_COMPLIANT:
        return 'red';
      case ComplianceStatus.PENDING_REVIEW:
        return 'blue';
      default:
        return 'gray';
    }
  }, []);

  // Get compliance status message
  const getStatusMessage = useCallback((status: ComplianceStatus) => {
    switch (status) {
      case ComplianceStatus.COMPLIANT:
        return 'All compliance requirements have been met';
      case ComplianceStatus.PARTIAL:
        return 'Some compliance requirements are missing';
      case ComplianceStatus.NON_COMPLIANT:
        return 'Critical compliance requirements are missing';
      case ComplianceStatus.PENDING_REVIEW:
        return 'Your documents are under review';
      default:
        return 'Compliance status unknown';
    }
  }, []);

  return {
    // Data
    complianceReport,
    requirements,
    isLoading,
    error,

    // Computed values
    complianceScore,
    missingRequirements,
    criticalMissingRequirements,
    nextRequiredAction,
    canListProperty,
    canRentProperty,

    // Actions
    runComplianceCheck: runComplianceCheckMutation.mutate,
    acceptTerms: acceptTermsMutation.mutate,
    acceptPrivacyPolicy: acceptPrivacyPolicyMutation.mutate,
    submitUndertaking: submitUndertakingMutation.mutate,

    // Mutation states
    isCheckingCompliance: runComplianceCheckMutation.isPending,
    isAcceptingTerms: acceptTermsMutation.isPending,
    isAcceptingPrivacy: acceptPrivacyPolicyMutation.isPending,
    isSubmittingUndertaking: submitUndertakingMutation.isPending,

    // Utilities
    refetch,
    isRequirementMet,
    getStatusColor,
    getStatusMessage,
  };
};

// Hook for compliance history and audit trail
export const useComplianceHistory = (entityId?: string, entityType?: 'user' | 'property') => {
  return useQuery({
    queryKey: ['compliance-history', entityId, entityType],
    queryFn: () => complianceApi.getComplianceHistory(entityId!, entityType!),
    enabled: !!(entityId && entityType),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for compliance notifications
export const useComplianceNotifications = () => {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['compliance-notifications'],
    queryFn: () => complianceApi.getNotifications(),
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => 
      complianceApi.markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-notifications'] });
    }
  });

  const unreadCount = useMemo(() => {
    return notifications?.filter(n => !n.isRead).length || 0;
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
  };
};