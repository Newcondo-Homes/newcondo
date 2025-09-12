'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@newcondo/ui/components/ui/button';
import { Input } from '@newcondo/ui/components/ui/input';
import { Textarea } from '@newcondo/ui/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@newcondo/ui/components/ui/select';
import { Checkbox } from '@newcondo/ui/components/ui/checkbox';
import { Label } from '@newcondo/ui/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/ui/card';
import { Badge } from '@newcondo/ui/components/ui/badge';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@newcondo/ui/components/ui/form';
import { 
  FileText, 
  Plus, 
  X, 
  Save, 
  Eye,
  AlertCircle,
  Info
} from 'lucide-react';
import { toast } from '@newcondo/ui/components/ui/use-toast';
import { cn } from '@newcondo/ui/lib/utils';
import { documentTemplateSchema, type DocumentTemplateFormData } from '../../lib/validations/documentTemplate';
import { DocumentType, Role } from '@newcondo/db';

interface DocumentTemplateFormProps {
  initialData?: Partial<DocumentTemplateFormData> & { id?: string };
  onSubmit: (data: DocumentTemplateFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface TemplateVariable {
  key: string;
  label: string;
  description: string;
  required: boolean;
}

const AVAILABLE_VARIABLES: TemplateVariable[] = [
  { key: '{{user_name}}', label: 'User Name', description: 'Full name of the user', required: false },
  { key: '{{user_email}}', label: 'User Email', description: 'Email address of the user', required: false },
  { key: '{{property_title}}', label: 'Property Title', description: 'Title of the property', required: false },
  { key: '{{property_address}}', label: 'Property Address', description: 'Full address of the property', required: false },
  { key: '{{current_date}}', label: 'Current Date', description: 'Current date when document is generated', required: false },
  { key: '{{signature_date}}', label: 'Signature Date', description: 'Date when document is signed', required: false },
  { key: '{{company_name}}', label: 'Company Name', description: 'Name of the company', required: false },
  { key: '{{agent_name}}', label: 'Agent Name', description: 'Name of the assigned agent', required: false },
];

export function DocumentTemplateForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: DocumentTemplateFormProps) {
  const [selectedVariables, setSelectedVariables] = useState<string[]>(
    initialData?.templateVariables || []
  );
  const [previewMode, setPreviewMode] = useState(false);

  const form = useForm<DocumentTemplateFormData>({
    resolver: zodResolver(documentTemplateSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      documentType: initialData?.documentType || 'OTHER',
      templateContent: initialData?.templateContent || '',
      templateVariables: initialData?.templateVariables || [],
      applicableRoles: initialData?.applicableRoles || ['OWNER'],
      requiresSignature: initialData?.requiresSignature || false,
      isActive: initialData?.isActive ?? true,
      version: initialData?.version || '1.0',
      tags: initialData?.tags || [],
    },
  });

  const handleVariableToggle = (variableKey: string) => {
    const updated = selectedVariables.includes(variableKey)
      ? selectedVariables.filter(v => v !== variableKey)
      : [...selectedVariables, variableKey];
    
    setSelectedVariables(updated);
    form.setValue('templateVariables', updated);
  };

  const insertVariable = (variableKey: string) => {
    const currentContent = form.getValues('templateContent');
    const newContent = currentContent + variableKey;
    form.setValue('templateContent', newContent, { shouldDirty: true, shouldTouch: true });
    form.trigger('templateContent');
  };

  const addTag = (tag: string) => {
    const currentTags = form.getValues('tags') || [];
    if (tag.trim() && !currentTags.includes(tag.trim())) {
      form.setValue('tags', [...currentTags, tag.trim()], { shouldDirty: true, shouldTouch: true });
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags') || [];
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove), { shouldDirty: true, shouldTouch: true });
  };

  const handleSubmit = async (data: DocumentTemplateFormData) => {
    try {
      await onSubmit({
        ...data,
        templateVariables: selectedVariables,
      });
      toast({
        title: 'Template Saved',
        description: 'Document template has been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save document template. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const renderPreview = () => {
    const content = form.watch('templateContent');
    let previewContent = content;
    
    // Replace variables with sample data for preview
    AVAILABLE_VARIABLES.forEach(variable => {
      const sampleData = {
        '{{user_name}}': 'John Doe',
        '{{user_email}}': 'john.doe@example.com',
        '{{property_title}}': 'Beautiful 3BR Apartment',
        '{{property_address}}': '123 Main Street, Lagos',
        '{{current_date}}': new Date().toLocaleDateString(),
        '{{signature_date}}': new Date().toLocaleDateString(),
        '{{company_name}}': 'NewCondo Ltd',
        '{{agent_name}}': 'Jane Smith',
      }[variable.key] || variable.key;
      
      previewContent = previewContent.replace(new RegExp(variable.key.replace(/[{}]/g, '\\$&'), 'g'), sampleData);
    });

    return (
      <div className="prose dark:prose-invert max-w-none p-4 border rounded-md min-h-[300px] overflow-auto">
        {/* Render HTML content */}
        <div dangerouslySetInnerHTML={{ __html: previewContent }} />
      </div>
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {initialData?.id ? 'Edit Template' : 'Create New Template'}
          </h2>
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Eye className="mr-2 h-4 w-4" />
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? 'Saving...' : 'Save Template'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content & Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Tenancy Agreement" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Brief description of the template" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="documentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a document type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(DocumentType).map(type => (
                              <SelectItem key={type} value={type}>
                                {type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="version"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Version</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 1.0" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Template Content</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {previewMode ? (
                  renderPreview()
                ) : (
                  <FormField
                    control={form.control}
                    name="templateContent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Body (HTML is supported)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Paste your document content here. Use {{variable_name}} for dynamic data."
                            rows={15}
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="requiresSignature"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Requires Signature</FormLabel>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available Variables</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                  <Info className="h-4 w-4" />
                  Click to insert into content.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_VARIABLES.map(variable => (
                    <Button
                      key={variable.key}
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariable(variable.key)}
                      className="justify-start text-xs h-auto py-2"
                      disabled={isLoading || previewMode}
                    >
                      {variable.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Applicable Roles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                  <Info className="h-4 w-4" />
                  Select the roles this template applies to.
                </p>
                {Object.values(Role).map(role => (
                  <FormField
                    key={role}
                    control={form.control}
                    name="applicableRoles"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value.includes(role)}
                            onCheckedChange={checked => {
                              return checked
                                ? field.onChange([...field.value, role])
                                : field.onChange(field.value.filter(value => value !== role));
                            }}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.watch('tags')?.map(tag => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 ml-1"
                        onClick={() => removeTag(tag)}
                        disabled={isLoading}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add a new tag"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="Add a new tag"]') as HTMLInputElement;
                      if (input) {
                        addTag(input.value);
                        input.value = '';
                      }
                    }}
                    disabled={isLoading}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}