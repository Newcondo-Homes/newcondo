// apps/admin/src/hooks/useCompliance.ts

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  complianceApi, 
  type ComplianceRecord, 
  type ComplianceCheckResult,
  type ComplianceRequirement,
  type ComplianceReport,
  type CreateComplianceRecordRequest,
  type UpdateComplianceStatusRequest
} from '../lib/api/compliance';
import { toast } from 'sonner';

interface UseComplianceOptions {
  userId?: string;
  propertyId?: string;
  documentId?: string;
  enabled?: boolean;
}

interface ComplianceState {
  isProcessing: boolean;
  currentRecord: ComplianceRecord | null;
  lastCheckResult: ComplianceCheckResult | null;
  pendingRequirements: ComplianceRequirement[];
}

export const useCompliance = (options: UseComplianceOptions = {}) => {
  const { userId, propertyId, documentId, enabled = true } = options;
  const queryClient = useQueryClient();
  
  const [complianceState, setComplianceState] = useState<ComplianceState>({
    isProcessing: false,
    currentRecord: null,
    lastCheckResult: null,
    pendingRequirements: []
  });

  // Fetch compliance records
  const {
    data: complianceRecords,
    isLoading: isLoadingRecords,
    error: recordsError,
    refetch: refetchRecords
  } = useQuery({
    queryKey: ['complianceRecords', { userId, propertyId, documentId }],
    queryFn: () => complianceApi.getComplianceRecords({ userId, propertyId, documentId }),
    enabled: enabled && (!!userId || !!propertyId || !!documentId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch compliance requirements
  const {
    data: requirements,
    isLoading: isLoadingRequirements,
    error: requirementsError
  } = useQuery({
    queryKey: ['complianceRequirements'],
    queryFn: complianceApi.getComplianceRequirements,
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch compliance reports
  const {
    data: reports,
    isLoading: isLoadingReports,
    error: reportsError
  } = useQuery({
    queryKey: ['complianceReports'],
    queryFn: complianceApi.getComplianceReports,
    enabled,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  // Create compliance record mutation
  const createRecordMutation = useMutation({
    mutationFn: complianceApi.createComplianceRecord,
    onMutate: () => {
      setComplianceState(prev => ({ ...prev, isProcessing: true }));
    },
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: ['complianceRecords'] });
      setComplianceState(prev => ({ 
        ...prev, 
        isProcessing: false,
        currentRecord: record 
      }));
      toast.success('Compliance record created successfully');
    },
    onError: (error: any) => {
      setComplianceState(prev => ({ ...prev, isProcessing: false }));
      toast.error(error.message || 'Failed to create compliance record');
    }
  });

  // Update compliance status mutation
  const updateStatusMutation = useMutation({
    mutationFn: complianceApi.updateComplianceStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complianceRecords'] });
      toast.success('Compliance status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update compliance status');
    }
  });

  // Run compliance check mutation
  const runCheckMutation = useMutation({
    mutationFn: complianceApi.runComplianceCheck,
    onMutate: () => {
      setComplianceState(prev => ({ ...prev, isProcessing: true }));
    },
    onSuccess: (result) => {
      setComplianceState(prev => ({ 
        ...prev, 
        isProcessing: false,
        lastCheckResult: result,
        pendingRequirements: result.failedRequirements || []
      }));
      
      if (result.isCompliant) {
        toast.success('Compliance check passed');
      } else {
        toast.warning(`Compliance check failed: ${result.failedRequirements?.length || 0} issues found`);
      }
    },
    onError: (error: any) => {
      setComplianceState(prev => ({ ...prev, isProcessing: false }));
      toast.error(error.message || 'Failed to run compliance check');
    }
  });

  // Generate compliance report mutation
  const generateReportMutation = useMutation({
    mutationFn: complianceApi.generateComplianceReport,
    onSuccess: (report) => {
      queryClient.invalidateQueries({ queryKey: ['complianceReports'] });
      toast.success('Compliance report generated successfully');
      
      // Auto-download if browser supports it
      if (report.downloadUrl) {
        const link = document.createElement('a');
        link.href = report.downloadUrl;
        link.download = `compliance-report-${report.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate compliance report');
    }
  });

  // Callback functions
  const createRecord = useCallback(async (request: CreateComplianceRecordRequest) => {
    return createRecordMutation.mutateAsync(request);
  }, [createRecordMutation]);

  const updateStatus = useCallback(async (request: UpdateComplianceStatusRequest) => {
    return updateStatusMutation.mutateAsync(request);
  }, [updateStatusMutation]);

  const runComplianceCheck = useCallback(async (entityId: string, entityType: 'user' | 'property' | 'document') => {
    return runCheckMutation.mutateAsync({ entityId, entityType });
  }, [runCheckMutation]);

  const generateReport = useCallback(async (filters?: { 
    startDate?: Date; 
    endDate?: Date; 
    status?: string; 
    entityType?: string 
  }) => {
    return generateReportMutation.mutateAsync(filters || {});
  }, [generateReportMutation]);

  // Get compliance statistics
  const getComplianceStats = useCallback(() => {
    if (!complianceRecords) return null;

    const total = complianceRecords.length;
    const compliant = complianceRecords.filter(r => r.status === 'COMPLIANT').length;
    const nonCompliant = complianceRecords.filter(r => r.status === 'NON_COMPLIANT').length;
    const pending = complianceRecords.filter(r => r.status === 'PENDING').length;

    return {
      total,
      compliant,
      nonCompliant,
      pending,
      complianceRate: total > 0 ? (compliant / total) * 100 : 0
    };
  }, [complianceRecords]);

  // Get records by status
  const getRecordsByStatus = useCallback((status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING') => {
    return complianceRecords?.filter(record => record.status === status) || [];
  }, [complianceRecords]);

  // Get overdue compliance items
  const getOverdueItems = useCallback(() => {
    if (!complianceRecords || !requirements) return [];

    return complianceRecords.filter(record => {
      const requirement = requirements.find(r => r.id === record.requirementId);
      return requirement?.deadline && 
             new Date(requirement.deadline) < new Date() && 
             record.status !== 'COMPLIANT';
    });
  }, [complianceRecords, requirements]);

  // Check if entity is compliant
  const isEntityCompliant = useCallback((entityId: string, entityType: 'user' | 'property' | 'document') => {
    if (!complianceRecords) return false;
    
    const entityRecords = complianceRecords.filter(
      r => r.entityId === entityId && r.entityType === entityType
    );
    
    return entityRecords.length > 0 && entityRecords.every(r => r.status === 'COMPLIANT');
  }, [complianceRecords]);

  // Reset compliance state
  const resetState = useCallback(() => {
    setComplianceState({
      isProcessing: false,
      currentRecord: null,
      lastCheckResult: null,
      pendingRequirements: []
    });
  }, []);

  return {
    // Data
    complianceRecords: complianceRecords || [],
    requirements: requirements || [],
    reports: reports || [],
    complianceState,

    // Statistics
    stats: getComplianceStats(),
    overdueItems: getOverdueItems(),

    // Loading states
    isLoading: isLoadingRecords || isLoadingRequirements || isLoadingReports,
    isLoadingRecords,
    isLoadingRequirements,
    isLoadingReports,
    isCreating: createRecordMutation.isPending,
    isUpdating: updateStatusMutation.isPending,
    isRunningCheck: runCheckMutation.isPending,
    isGeneratingReport: generateReportMutation.isPending,

    // Error states
    error: recordsError || requirementsError || reportsError,
    recordsError,
    requirementsError,
    reportsError,

    // Actions
    createRecord,
    updateStatus,
    runComplianceCheck,
    generateReport,
    refetchRecords,
    resetState,

    // Utility functions
    getRecordsByStatus,
    isEntityCompliant,

    // Mutation objects
    createRecordMutation,
    updateStatusMutation,
    runCheckMutation,
    generateReportMutation
  };
};

// Hook for compliance workflow management
export const useComplianceWorkflow = (entityId: string, entityType: 'user' | 'property' | 'document') => {
  const [currentStep, setCurrentStep] = useState<'assessment' | 'documentation' | 'verification' | 'approval'>('assessment');
  const [workflowData, setWorkflowData] = useState<any>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const nextStep = useCallback(() => {
    setCurrentStep(prev => {
      const steps = ['assessment', 'documentation', 'verification', 'approval'] as const;
      const currentIndex = steps.indexOf(prev);
      return currentIndex < steps.length - 1 ? steps[currentIndex + 1] : prev;
    });
  }, []);

  const previousStep = useCallback(() => {
    setCurrentStep(prev => {
      const steps = ['assessment', 'documentation', 'verification', 'approval'] as const;
      const currentIndex = steps.indexOf(prev);
      return currentIndex > 0 ? steps[currentIndex - 1] : prev;
    });
  }, []);

  const completeStep = useCallback((step: string) => {
    setCompletedSteps(prev => new Set([...prev, step]));
  }, []);

  const resetWorkflow = useCallback(() => {
    setCurrentStep('assessment');
    setWorkflowData(null);
    setCompletedSteps(new Set());
  }, []);

  return {
    currentStep,
    workflowData,
    completedSteps,
    setWorkflowData,
    nextStep,
    previousStep,
    completeStep,
    resetWorkflow,
    isStepCompleted: (step: string) => completedSteps.has(step),
    isWorkflowComplete: currentStep === 'approval' && completedSteps.has('approval')
  };
};

// Hook for compliance alerts and notifications
export const useComplianceAlerts = () => {
  const { complianceRecords, requirements } = useCompliance();
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (!complianceRecords || !requirements) return;

    const newAlerts: any[] = [];

    // Check for overdue items
    complianceRecords.forEach(record => {
      const requirement = requirements.find(r => r.id === record.requirementId);
      if (requirement?.deadline && 
          new Date(requirement.deadline) < new Date() && 
          record.status !== 'COMPLIANT') {
        newAlerts.push({
          id: `overdue-${record.id}`,
          type: 'overdue',
          severity: 'high',
          title: 'Overdue Compliance Item',
          message: `${requirement.name} is past its deadline`,
          entityId: record.entityId,
          entityType: record.entityType
        });
      }
    });

    // Check for items due soon (within 7 days)
    complianceRecords.forEach(record => {
      const requirement = requirements.find(r => r.id === record.requirementId);
      if (requirement?.deadline) {
        const daysUntilDeadline = Math.ceil(
          (new Date(requirement.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysUntilDeadline <= 7 && daysUntilDeadline > 0 && record.status !== 'COMPLIANT') {
          newAlerts.push({
            id: `due-soon-${record.id}`,
            type: 'due_soon',
            severity: 'medium',
            title: 'Compliance Item Due Soon',
            message: `${requirement.name} is due in ${daysUntilDeadline} day(s)`,
            entityId: record.entityId,
            entityType: record.entityType
          });
        }
      }
    });

    setAlerts(newAlerts);
  }, [complianceRecords, requirements]);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  const getAlertsByEntityType = useCallback((entityType: 'user' | 'property' | 'document') => {
    return alerts.filter(alert => alert.entityType === entityType);
  }, [alerts]);

  const getAlertsBySeverity = useCallback((severity: 'low' | 'medium' | 'high') => {
    return alerts.filter(alert => alert.severity === severity);
  }, [alerts]);

  return {
    alerts,
    dismissAlert,
    getAlertsByEntityType,
    getAlertsBySeverity,
    hasHighSeverityAlerts: alerts.some(a => a.severity === 'high'),
    totalAlerts: alerts.length
  };
};