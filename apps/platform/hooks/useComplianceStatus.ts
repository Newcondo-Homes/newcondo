import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { complianceApi } from '@/lib/api/compliance';
import { useComplianceStore } from '@/store/complianceStore';
import type {
  ComplianceReport,
  ComplianceRequirement,
  Role,
  PropertyType
} from '@/types/compliance';

import {ComplianceLevel} from '@/types/compliance';

import { toast } from 'sonner';

export const ComplianceStatusEnum = {
  COMPLIANT: 'COMPLIANT',
  PARTIAL: 'PARTIAL',
  NON_COMPLIANT: 'NON_COMPLIANT',
  PENDING_REVIEW: 'PENDING_REVIEW',
} as const;

export type ComplianceStatusValue =
  (typeof ComplianceStatusEnum)[keyof typeof ComplianceStatusEnum];

interface UseComplianceStatusOptions {
  propertyId?: string;
  userId?: string;
  userRole?: Role;
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
    setOverallStatus,
    setChecking,
    setRequirements,
    setError
  } = useComplianceStore();

  // Fetch compliance status
  const {
    data: complianceReport,
    isLoading,
    error,
    refetch
  } = useQuery<ComplianceReport, Error>({
    queryKey: ['compliance-status', propertyId, userId],
    queryFn: async () => {
      setChecking(true);
      try {
        const entityId = propertyId ?? userId!;
        const entityType: 'user' | 'property' | 'agent' = propertyId ? 'property' : 'user';

        const response = await complianceApi.getComplianceStatus(entityId, entityType);
        const report = response.data;

        const overallStatus = report.status as unknown as
          'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING' | 'PARTIAL';

        setOverallStatus(overallStatus);
        setError(null);
        return report;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch compliance status';
        setError(errorMsg);
        throw err;
      } finally {
        setChecking(false);
      }
    },
    enabled: !!(propertyId || userId),
    refetchInterval: autoCheck ? 60_000 : false, // Check every minute if auto-check is enabled
  });

  // Fetch compliance requirements
  const { data: requirements } = useQuery<ComplianceRequirement[], Error>({
    queryKey: ['compliance-requirements', userRole, propertyType],
    queryFn: async () => {

      // getComplianceRequirements(entityType, jurisdiction?)
      // entityType here is the user's role mapped to one of the accepted literals
      const entityType: 'user' | 'property' | 'agent' =
        userRole === 'AGENT' ? 'agent' : 'user';

      const response = await complianceApi.getComplianceRequirements(entityType);
      const reqs = response.data ?? [];
      setRequirements(reqs);
      return reqs;
    },
    enabled: !!(userRole || propertyType),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Run compliance check
  const runComplianceCheckMutation = useMutation({
    mutationFn: () => {
      const entityId = propertyId ?? userId!;
      const entityType: 'user' | 'property' | 'agent' = propertyId ? 'property' : 'user';
      return complianceApi.runComplianceCheck(entityId, entityType);

    },
    onSuccess: (response) => {
      const result = response.data;

      queryClient.setQueryData(
        ['compliance-status', propertyId, userId],
        (old: ComplianceReport | undefined) =>
          old ? { ...old, ...result, lastCheckedAt: new Date().toISOString() } : result
      );

      const overallStatus = result.status as unknown as
        'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING' | 'PARTIAL';
      setOverallStatus(overallStatus);

      if (overallStatus === 'COMPLIANT') {
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
      complianceApi.recordTermsAcceptance({ version: termsVersion, userId: userId! }),
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
      complianceApi.recordPrivacyConsent({ version: policyVersion, userId: userId! }),
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
    }) => complianceApi.recordPrivacyConsent({
      userId: userId!,
      version: 'undertaking-v1',
      ...undertakingData,
    }),
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
      complianceReport.completedRequirements?.some((r) => r.id === req.id)
    ).length;

    return totalRequirements > 0 ? (completedRequirements / totalRequirements) * 100 : 0;
  }, [complianceReport, requirements]);

  // Get missing requirements
  const missingRequirements = useMemo(() => {
    if (!complianceReport || !requirements) return [];

    return requirements.filter(req =>
      !complianceReport.completedRequirements?.some((r) => r.id === req.id)
    );
  }, [complianceReport, requirements]);

  // Get critical missing requirements
  const criticalMissingRequirements = useMemo(() => {
    return missingRequirements.filter(req => req.isCritical);
  }, [missingRequirements]);

  // Check if specific requirement is met
  const isRequirementMet = useCallback((requirementId: string): boolean => {
    return complianceReport?.completedRequirements?.some((r) => r.id === requirementId) ?? false;
  }, [complianceReport]);

  // Check if user can proceed with property listing
  const canListProperty = useMemo(() => {
    if (!complianceReport) return false;

    return complianceReport.isCompliant || criticalMissingRequirements.length === 0;
  }, [complianceReport, criticalMissingRequirements]);

  // Check if user can rent property
  const canRentProperty = useMemo(() => {
    if (!complianceReport) return false;

    // For renters, basic verification might be sufficient
    return complianceReport.isCompliant || complianceReport.level !== ComplianceLevel.CRITICAL;
  }, [complianceReport]);

  // Get next required action
  const nextRequiredAction = useMemo((): ComplianceRequirement | null => {
    const critical = criticalMissingRequirements[0];
    if (critical) return critical;

    return missingRequirements[0] || null;
  }, [criticalMissingRequirements, missingRequirements]);

  // Get compliance status color
  const getStatusColor = useCallback((status: ComplianceStatusValue) => {
    switch (status) {
      case ComplianceStatusEnum.COMPLIANT:
        return 'green';
      case ComplianceStatusEnum.PARTIAL:
        return 'yellow';
      case ComplianceStatusEnum.NON_COMPLIANT:
        return 'red';
      case ComplianceStatusEnum.PENDING_REVIEW:
        return 'blue';
      default:
        return 'gray';
    }
  }, []);

  // Get compliance status message
  const getStatusMessage = useCallback((status: ComplianceStatusValue) => {
    switch (status) {
      case ComplianceStatusEnum.COMPLIANT:
        return 'All compliance requirements have been met';
      case ComplianceStatusEnum.PARTIAL:
        return 'Some compliance requirements are missing';
      case ComplianceStatusEnum.NON_COMPLIANT:
        return 'Critical compliance requirements are missing';
      case ComplianceStatusEnum.PENDING_REVIEW:
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
    queryFn: () => complianceApi.getComplianceAudits({entityId, entityType}),
    enabled: !!(entityId && entityType),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for compliance notifications
export const useComplianceNotifications = () => {
  const queryClient = useQueryClient(); 

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['compliance-notifications'],
    queryFn: () => complianceApi.getComplianceAlerts(),
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      complianceApi.markAlertAsResolved(notificationId, 'read'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-notifications'] });
    }
  });

  const unreadCount = useMemo(() => {
   return notifications?.data.filter((n: any) => !n.isRead).length || 0;
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
  };
};