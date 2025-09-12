// apps/admin/src/hooks/useDocumentTemplates.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import * as api from '@/lib/api/documentTemplates';
import type { 
  DocumentTemplate, 
  DocumentTemplateFilter, 
  DocumentTemplateCreate,
  DocumentTemplateUpdate,
  TemplateVersion,
  TemplatePreviewData
} from '@/types/documentTemplate';

export const useDocumentTemplates = (initialFilters?: DocumentTemplateFilter) => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<DocumentTemplateFilter>(
    initialFilters || {
      category: undefined,
      isActive: undefined,
      search: undefined,
      page: 1,
      limit: 20,
    }
  );

  const [previewData, setPreviewData] = useState<TemplatePreviewData | null>(null);

  // Fetch document templates
  const {
    data: templatesData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['document-templates', filters],
    queryFn: () => api.getDocumentTemplates(filters),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Get single template
  const useDocumentTemplate = (templateId: string) => {
    return useQuery({
      queryKey: ['document-template', templateId],
      queryFn: () => api.getDocumentTemplate(templateId),
      enabled: !!templateId,
    });
  };

  // Get template versions
  const useTemplateVersions = (templateId: string) => {
    return useQuery({
      queryKey: ['template-versions', templateId],
      queryFn: () => api.getTemplateVersions(templateId),
      enabled: !!templateId,
    });
  };

  // Get active templates for dropdown/selection
  const { data: activeTemplates } = useQuery({
    queryKey: ['active-templates'],
    queryFn: () => api.getActiveTemplates(),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // Create template
  const createTemplateMutation = useMutation({
    mutationFn: (data: DocumentTemplateCreate) => api.createDocumentTemplate(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      queryClient.invalidateQueries({ queryKey: ['active-templates'] });
      toast.success('Template created successfully');
      return data;
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create template');
    },
  });

  // Update template
  const updateTemplateMutation = useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: DocumentTemplateUpdate }) =>
      api.updateDocumentTemplate(templateId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      queryClient.invalidateQueries({ queryKey: ['document-template', variables.templateId] });
      queryClient.invalidateQueries({ queryKey: ['template-versions', variables.templateId] });
      queryClient.invalidateQueries({ queryKey: ['active-templates'] });
      toast.success('Template updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update template');
    },
  });

  // Delete template
  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId: string) => api.deleteDocumentTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      queryClient.invalidateQueries({ queryKey: ['active-templates'] });
      toast.success('Template deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete template');
    },
  });

  // Duplicate template
  const duplicateTemplateMutation = useMutation({
    mutationFn: (templateId: string) => api.duplicateTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      toast.success('Template duplicated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to duplicate template');
    },
  });

  // Preview template
  const previewTemplateMutation = useMutation({
    mutationFn: ({ templateId, sampleData }: { templateId: string; sampleData: any }) =>
      api.previewTemplate(templateId, sampleData),
    onSuccess: (data) => {
      setPreviewData(data);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate preview');
    },
  });

  // Publish template version
  const publishVersionMutation = useMutation({
    mutationFn: ({ templateId, versionId }: { templateId: string; versionId: string }) =>
      api.publishTemplateVersion(templateId, versionId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      queryClient.invalidateQueries({ queryKey: ['document-template', variables.templateId] });
      queryClient.invalidateQueries({ queryKey: ['template-versions', variables.templateId] });
      queryClient.invalidateQueries({ queryKey: ['active-templates'] });
      toast.success('Template version published');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to publish version');
    },
  });

  // Archive template
  const archiveTemplateMutation = useMutation({
    mutationFn: (templateId: string) => api.archiveTemplate(templateId),
    onSuccess: (data, templateId) => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      queryClient.invalidateQueries({ queryKey: ['document-template', templateId] });
      queryClient.invalidateQueries({ queryKey: ['active-templates'] });
      toast.success('Template archived');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to archive template');
    },
  });

  // Restore template
  const restoreTemplateMutation = useMutation({
    mutationFn: (templateId: string) => api.restoreTemplate(templateId),
    onSuccess: (data, templateId) => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      queryClient.invalidateQueries({ queryKey: ['document-template', templateId] });
      queryClient.invalidateQueries({ queryKey: ['active-templates'] });
      toast.success('Template restored');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to restore template');
    },
  });

  // Export template
  const exportTemplateMutation = useMutation({
    mutationFn: (templateId: string) => api.exportTemplate(templateId),
    onSuccess: (blob, templateId) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template-${templateId}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Template exported successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to export template');
    },
  });

  // Import template
  const importTemplateMutation = useMutation({
    mutationFn: (file: File) => api.importTemplate(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      toast.success('Template imported successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to import template');
    },
  });

  // Utility functions
  const updateFilters = (newFilters: Partial<DocumentTemplateFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      category: undefined,
      isActive: undefined,
      search: undefined,
      page: 1,
      limit: 20,
    });
  };

  const clearPreview = () => {
    setPreviewData(null);
  };

  const handleCreateTemplate = async (data: DocumentTemplateCreate) => {
    try {
      const result = await createTemplateMutation.mutateAsync(data);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const handleUpdateTemplate = async (templateId: string, data: DocumentTemplateUpdate) => {
    try {
      await updateTemplateMutation.mutateAsync({ templateId, data });
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteTemplateMutation.mutateAsync(templateId);
    } catch (error) {
      throw error;
    }
  };

  const handleDuplicateTemplate = async (templateId: string) => {
    try {
      await duplicateTemplateMutation.mutateAsync(templateId);
    } catch (error) {
      throw error;
    }
  };

  const handlePreviewTemplate = async (templateId: string, sampleData: any) => {
    try {
      await previewTemplateMutation.mutateAsync({ templateId, sampleData });
    } catch (error) {
      throw error;
    }
  };

  const handlePublishVersion = async (templateId: string, versionId: string) => {
    try {
      await publishVersionMutation.mutateAsync({ templateId, versionId });
    } catch (error) {
      throw error;
    }
  };

  const handleArchiveTemplate = async (templateId: string) => {
    try {
      await archiveTemplateMutation.mutateAsync(templateId);
    } catch (error) {
      throw error;
    }
  };

  const handleRestoreTemplate = async (templateId: string) => {
    try {
      await restoreTemplateMutation.mutateAsync(templateId);
    } catch (error) {
      throw error;
    }
  };

  const handleExportTemplate = async (templateId: string) => {
    try {
      await exportTemplateMutation.mutateAsync(templateId);
    } catch (error) {
      throw error;
    }
  };

  const handleImportTemplate = async (file: File) => {
    try {
      await importTemplateMutation.mutateAsync(file);
    } catch (error) {
      throw error;
    }
  };

  return {
    // Data
    templates: templatesData?.templates || [],
    totalCount: templatesData?.totalCount || 0,
    totalPages: templatesData?.totalPages || 0,
    currentPage: templatesData?.currentPage || 1,
    activeTemplates: activeTemplates || [],
    previewData,
    
    // Loading states
    isLoading,
    isCreating: createTemplateMutation.isPending,
    isUpdating: updateTemplateMutation.isPending,
    isDeleting: deleteTemplateMutation.isPending,
    isDuplicating: duplicateTemplateMutation.isPending,
    isPreviewing: previewTemplateMutation.isPending,
    isPublishing: publishVersionMutation.isPending,
    isArchiving: archiveTemplateMutation.isPending,
    isRestoring: restoreTemplateMutation.isPending,
    isExporting: exportTemplateMutation.isPending,
    isImporting: importTemplateMutation.isPending,
    
    // Error states
    error,
    
    // Filters
    filters,
    updateFilters,
    clearFilters,
    
    // Actions
    handleCreateTemplate,
    handleUpdateTemplate,
    handleDeleteTemplate,
    handleDuplicateTemplate,
    handlePreviewTemplate,
    handlePublishVersion,
    handleArchiveTemplate,
    handleRestoreTemplate,
    handleExportTemplate,
    handleImportTemplate,
    
    // Utils
    refetch,
    clearPreview,
    useDocumentTemplate,
    useTemplateVersions,
  };
};