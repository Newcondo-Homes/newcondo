"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Copy,
  Download,
  Star,
  StarOff,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  metrics: string[];
  format: string;
  isFavorite: boolean;
  createdAt: string;
  lastUsed?: string;
  useCount: number;
}

const TEMPLATE_PRESETS: Omit<ReportTemplate, 'id' | 'createdAt' | 'lastUsed' | 'useCount' | 'isFavorite'>[] = [
  {
    name: 'Monthly User Growth',
    description: 'Track new user registrations and verification rates',
    type: 'users',
    metrics: ['newRegistrations', 'verifiedUsers', 'usersByRole', 'activeUsers'],
    format: 'pdf'
  },
  {
    name: 'Revenue Summary',
    description: 'Complete financial overview with transaction details',
    type: 'payments',
    metrics: ['totalRevenue', 'transactionCount', 'commissionEarned', 'successRate'],
    format: 'excel'
  },
  {
    name: 'Agent Performance',
    description: 'Agent listings, marking jobs, and earnings',
    type: 'agents',
    metrics: ['activeAgents', 'agentListings', 'markingJobsCompleted', 'commissionEarned', 'topPerformers'],
    format: 'pdf'
  },
  {
    name: 'Property Analytics',
    description: 'Property listings and engagement metrics',
    type: 'properties',
    metrics: ['newListings', 'propertiesByType', 'viewsAndEngagement', 'availabilityRate'],
    format: 'excel'
  }
];

export default function ReportTemplate() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: ''
  });

  const handleCreateFromPreset = async (preset: typeof TEMPLATE_PRESETS[0]) => {
    try {
      const response = await fetch('/api/admin/reports/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...preset,
          isFavorite: false
        }),
      });

      if (!response.ok) throw new Error('Failed to create template');

      const data = await response.json();
      setTemplates([...templates, data.template]);

      toast({
        title: 'Success',
        description: 'Template created successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create template.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleFavorite = async (templateId: string) => {
    try {
      const response = await fetch(`/api/admin/reports/templates/${templateId}/favorite`, {
        method: 'PATCH',
      });

      if (!response.ok) throw new Error('Failed to update favorite');

      setTemplates(templates.map(t => 
        t.id === templateId ? { ...t, isFavorite: !t.isFavorite } : t
      ));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update favorite status.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/admin/reports/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete template');

      setTemplates(templates.filter(t => t.id !== templateId));

      toast({
        title: 'Success',
        description: 'Template deleted successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete template.',
        variant: 'destructive',
      });
    }
  };

  const handleDuplicateTemplate = async (template: ReportTemplate) => {
    try {
      const response = await fetch('/api/admin/reports/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...template,
          name: `${template.name} (Copy)`,
          isFavorite: false
        }),
      });

      if (!response.ok) throw new Error('Failed to duplicate template');

      const data = await response.json();
      setTemplates([...templates, data.template]);

      toast({
        title: 'Success',
        description: 'Template duplicated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to duplicate template.',
        variant: 'destructive',
      });
    }
  };

  const handleUseTemplate = (template: ReportTemplate) => {
    // Navigate to report generator with pre-filled template
    window.location.href = `/admin/reports/generate?templateId=${template.id}`;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      users: 'User Analytics',
      properties: 'Property Performance',
      payments: 'Financial',
      agents: 'Agent Performance',
      rentals: 'Rental Activity',
      marking: 'Property Marking',
      referrals: 'Referrals',
      platform: 'Platform Overview'
    };
    return labels[type] || type;
  };

  const getFormatIcon = (format: string) => {
    const icons: Record<string, string> = {
      pdf: '📄',
      excel: '📊',
      csv: '📋',
      json: '{ }'
    };
    return icons[format] || '📄';
  };

  const favoriteTemplates = templates.filter(t => t.isFavorite);
  const otherTemplates = templates.filter(t => !t.isFavorite);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Report Templates</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Save and reuse report configurations
          </p>
        </div>

        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Quick Start Presets */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TEMPLATE_PRESETS.map((preset, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-grow">
                    <h3 className="font-semibold">{preset.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {preset.description}
                    </p>
                  </div>
                  <Badge variant="outline">{getTypeLabel(preset.type)}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{preset.metrics.length} metrics</span>
                    <span>•</span>
                    <span>{getFormatIcon(preset.format)} {preset.format.toUpperCase()}</span>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCreateFromPreset(preset)}
                  >
                    <Plus className="h-3 w-3 mr-2" />
                    Use Template
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Favorite Templates */}
      {favoriteTemplates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              Favorite Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {favoriteTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onToggleFavorite={handleToggleFavorite}
                  onDelete={handleDeleteTemplate}
                  onDuplicate={handleDuplicateTemplate}
                  onUse={handleUseTemplate}
                  onEdit={(t) => {
                    setSelectedTemplate(t);
                    setShowEditDialog(true);
                  }}
                  getTypeLabel={getTypeLabel}
                  getFormatIcon={getFormatIcon}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Templates */}
      <Card>
        <CardHeader>
          <CardTitle>My Templates</CardTitle>
        </CardHeader>
        <CardContent>
          {otherTemplates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No templates created yet</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Template
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {otherTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onToggleFavorite={handleToggleFavorite}
                  onDelete={handleDeleteTemplate}
                  onDuplicate={handleDuplicateTemplate}
                  onUse={handleUseTemplate}
                  onEdit={(t) => {
                    setSelectedTemplate(t);
                    setShowEditDialog(true);
                  }}
                  getTypeLabel={getTypeLabel}
                  getFormatIcon={getFormatIcon}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Report Template</DialogTitle>
            <DialogDescription>
              Save your report configuration as a template for future use.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                placeholder="e.g., Monthly User Report"
                className="mt-2"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of what this template includes"
                className="mt-2"
                rows={3}
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // Handle create
              setShowCreateDialog(false);
            }}>
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Template Card Component
interface TemplateCardProps {
  template: ReportTemplate;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (template: ReportTemplate) => void;
  onUse: (template: ReportTemplate) => void;
  onEdit: (template: ReportTemplate) => void;
  getTypeLabel: (type: string) => string;
  getFormatIcon: (format: string) => string;
}

function TemplateCard({
  template,
  onToggleFavorite,
  onDelete,
  onDuplicate,
  onUse,
  onEdit,
  getTypeLabel,
  getFormatIcon
}: TemplateCardProps) {
  return (
    <div className="flex items-start gap-4 p-4 border rounded-lg hover:border-primary transition-colors">
      <div className="flex-grow space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              {template.name}
              {template.isFavorite && (
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              )}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {template.description}
            </p>
          </div>
          <Badge variant="outline">{getTypeLabel(template.type)}</Badge>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {template.metrics.length} metrics
          </span>
          <span>{getFormatIcon(template.format)} {template.format.toUpperCase()}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Used {template.useCount} times
          </span>
          {template.lastUsed && (
            <span>Last used {format(new Date(template.lastUsed), 'PP')}</span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onToggleFavorite(template.id)}
        >
          {template.isFavorite ? (
            <StarOff className="h-4 w-4" />
          ) : (
            <Star className="h-4 w-4" />
          )}
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => onEdit(template)}
        >
          <Edit className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDuplicate(template)}
        >
          <Copy className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(template.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          onClick={() => onUse(template)}
        >
          <Download className="h-4 w-4 mr-2" />
          Use
        </Button>
      </div>
    </div>
  );
}