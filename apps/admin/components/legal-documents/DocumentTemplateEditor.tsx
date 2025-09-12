'use client';

import { useState, useEffect } from 'react';
import { Button } from '@newcondo/ui/button';
import { Input } from '@newcondo/ui/input';
import { Textarea } from '@newcondo/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/card';
import { Label } from '@newcondo/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@newcondo/ui/select';
import { Switch } from '@newcondo/ui/switch';
import { Badge } from '@newcondo/ui/badge';
import { Alert, AlertDescription } from '@newcondo/ui/alert';
import { Separator } from '@newcondo/ui/separator';
import { ScrollArea } from '@newcondo/ui/scroll-area';
import { 
  Save, 
  Eye, 
  FileText, 
  Code, 
  Type, 
  Hash, 
  Calendar,
  User,
  Building,
  MapPin,
  Phone,
  Mail,
  Plus,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface DocumentVariable {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'email' | 'phone' | 'address';
  required: boolean;
  defaultValue?: string;
  placeholder?: string;
}

interface DocumentTemplate {
  id?: string;
  name: string;
  description: string;
  documentType: string;
  category: string;
  content: string;
  variables: DocumentVariable[];
  isActive: boolean;
  requiresSignature: boolean;
  expirationDays?: number;
  version: number;
}

interface DocumentTemplateEditorProps {
  template?: DocumentTemplate;
  onSave: (template: DocumentTemplate) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const DOCUMENT_TYPES = [
  { value: 'OWNERSHIP_DOCUMENT', label: 'Ownership Document' },
  { value: 'CONSENT_DOCUMENT', label: 'Consent Document' },
  { value: 'UNDERTAKING_DOCUMENT', label: 'Undertaking Document' },
  { value: 'AGENT_PERMISSION', label: 'Agent Permission' },
  { value: 'TERMS_CONDITIONS', label: 'Terms & Conditions' },
  { value: 'PRIVACY_POLICY', label: 'Privacy Policy' },
  { value: 'RENTAL_AGREEMENT', label: 'Rental Agreement' },
  { value: 'OTHER', label: 'Other' }
];

const DOCUMENT_CATEGORIES = [
  { value: 'PROPERTY', label: 'Property Related' },
  { value: 'USER', label: 'User Related' },
  { value: 'LEGAL', label: 'Legal Compliance' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'SYSTEM', label: 'System Generated' }
];

const VARIABLE_TYPES = [
  { value: 'text', label: 'Text', icon: Type },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'phone', label: 'Phone', icon: Phone },
  { value: 'address', label: 'Address', icon: MapPin }
];

const COMMON_VARIABLES: DocumentVariable[] = [
  { id: 'user_name', name: 'user_name', label: 'User Full Name', type: 'text', required: true },
  { id: 'user_email', name: 'user_email', label: 'User Email', type: 'email', required: true },
  { id: 'user_phone', name: 'user_phone', label: 'User Phone', type: 'phone', required: false },
  { id: 'property_title', name: 'property_title', label: 'Property Title', type: 'text', required: false },
  { id: 'property_address', name: 'property_address', label: 'Property Address', type: 'address', required: false },
  { id: 'current_date', name: 'current_date', label: 'Current Date', type: 'date', required: true },
  { id: 'company_name', name: 'company_name', label: 'Company Name', type: 'text', required: false },
];

export default function DocumentTemplateEditor({ 
  template, 
  onSave, 
  onCancel, 
  isLoading = false 
}: DocumentTemplateEditorProps) {
  const [formData, setFormData] = useState<DocumentTemplate>({
    name: '',
    description: '',
    documentType: '',
    category: '',
    content: '',
    variables: [],
    isActive: true,
    requiresSignature: false,
    version: 1,
    ...template
  });

  const [activeTab, setActiveTab] = useState<'content' | 'variables' | 'settings'>('content');
  const [previewMode, setPreviewMode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (template) {
      setFormData(template);
    }
  }, [template]);

  const handleInputChange = (field: keyof DocumentTemplate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleVariableChange = (index: number, field: keyof DocumentVariable, value: any) => {
    const updatedVariables = [...formData.variables];
    updatedVariables[index] = { ...updatedVariables[index], [field]: value };
    setFormData(prev => ({ ...prev, variables: updatedVariables }));
  };

  const addVariable = (variable?: DocumentVariable) => {
    const newVariable: DocumentVariable = variable || {
      id: `var_${Date.now()}`,
      name: '',
      label: '',
      type: 'text',
      required: false
    };
    setFormData(prev => ({
      ...prev,
      variables: [...prev.variables, newVariable]
    }));
  };

  const removeVariable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index)
    }));
  };

  const insertVariableIntoContent = (variableName: string) => {
    const textarea = document.getElementById('template-content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const variable = `{{${variableName}}}`;
      const newContent = formData.content.substring(0, start) + variable + formData.content.substring(end);
      setFormData(prev => ({ ...prev, content: newContent }));
      // Reset cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    }

    if (!formData.documentType) {
      newErrors.documentType = 'Document type is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Template content is required';
    }

    // Validate variables
    formData.variables.forEach((variable, index) => {
      if (!variable.name.trim()) {
        newErrors[`variable_${index}_name`] = 'Variable name is required';
      }
      if (!variable.label.trim()) {
        newErrors[`variable_${index}_label`] = 'Variable label is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  const renderPreview = () => {
    let previewContent = formData.content;
    formData.variables.forEach(variable => {
      const placeholder = variable.placeholder || `[${variable.label}]`;
      previewContent = previewContent.replace(
        new RegExp(`{{${variable.name}}}`, 'g'),
        placeholder
      );
    });

    return (
      <div className="prose max-w-none">
        <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md border">
          {previewContent}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {template ? 'Edit Template' : 'Create Template'}
          </h2>
          <p className="text-muted-foreground">
            Create and manage legal document templates
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Save className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Template
              </>
            )}
          </Button>
        </div>
      </div>

      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please fix the validation errors before saving.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Button
                  variant={activeTab === 'content' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('content')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Content
                </Button>
                <Button
                  variant={activeTab === 'variables' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('variables')}
                >
                  <Code className="h-4 w-4 mr-2" />
                  Variables
                </Button>
                <Button
                  variant={activeTab === 'settings' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('settings')}
                >
                  Settings
                </Button>
                <div className="ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewMode(!previewMode)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {previewMode ? 'Edit' : 'Preview'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activeTab === 'content' && (
                <div className="space-y-4">
                  {previewMode ? (
                    renderPreview()
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="template-name">Template Name</Label>
                          <Input
                            id="template-name"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="e.g., Property Ownership Consent"
                            className={errors.name ? 'border-red-500' : ''}
                          />
                          {errors.name && (
                            <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="template-type">Document Type</Label>
                          <Select 
                            value={formData.documentType} 
                            onValueChange={(value) => handleInputChange('documentType', value)}
                          >
                            <SelectTrigger className={errors.documentType ? 'border-red-500' : ''}>
                              <SelectValue placeholder="Select document type" />
                            </SelectTrigger>
                            <SelectContent>
                              {DOCUMENT_TYPES.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.documentType && (
                            <p className="text-sm text-red-500 mt-1">{errors.documentType}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="template-category">Category</Label>
                          <Select 
                            value={formData.category} 
                            onValueChange={(value) => handleInputChange('category', value)}
                          >
                            <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {DOCUMENT_CATEGORIES.map(category => (
                                <SelectItem key={category.value} value={category.value}>
                                  {category.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.category && (
                            <p className="text-sm text-red-500 mt-1">{errors.category}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="template-version">Version</Label>
                          <Input
                            id="template-version"
                            type="number"
                            value={formData.version}
                            onChange={(e) => handleInputChange('version', parseInt(e.target.value))}
                            min="1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="template-description">Description</Label>
                        <Textarea
                          id="template-description"
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          placeholder="Brief description of this template"
                          rows={2}
                        />
                      </div>

                      <div>
                        <Label htmlFor="template-content">Template Content</Label>
                        <Textarea
                          id="template-content"
                          value={formData.content}
                          onChange={(e) => handleInputChange('content', e.target.value)}
                          placeholder="Enter your template content here. Use {{variable_name}} for dynamic content."
                          rows={15}
                          className={`font-mono ${errors.content ? 'border-red-500' : ''}`}
                        />
                        {errors.content && (
                          <p className="text-sm text-red-500 mt-1">{errors.content}</p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">
                          Use double curly braces to insert variables: {`{{variable_name}}`}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'variables' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Template Variables</h3>
                    <Button size="sm" onClick={() => addVariable()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Variable
                    </Button>
                  </div>

                  {formData.variables.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No variables added yet. Add variables to make your template dynamic.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.variables.map((variable, index) => (
                        <Card key={variable.id || index}>
                          <CardContent className="pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <Label>Variable Name</Label>
                                <Input
                                  value={variable.name}
                                  onChange={(e) => handleVariableChange(index, 'name', e.target.value)}
                                  placeholder="variable_name"
                                  className={errors[`variable_${index}_name`] ? 'border-red-500' : ''}
                                />
                                {errors[`variable_${index}_name`] && (
                                  <p className="text-sm text-red-500 mt-1">
                                    {errors[`variable_${index}_name`]}
                                  </p>
                                )}
                              </div>
                              <div>
                                <Label>Display Label</Label>
                                <Input
                                  value={variable.label}
                                  onChange={(e) => handleVariableChange(index, 'label', e.target.value)}
                                  placeholder="Display Label"
                                  className={errors[`variable_${index}_label`] ? 'border-red-500' : ''}
                                />
                                {errors[`variable_${index}_label`] && (
                                  <p className="text-sm text-red-500 mt-1">
                                    {errors[`variable_${index}_label`]}
                                  </p>
                                )}
                              </div>
                              <div>
                                <Label>Type</Label>
                                <Select
                                  value={variable.type}
                                  onValueChange={(value) => handleVariableChange(index, 'type', value as DocumentVariable['type'])}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {VARIABLE_TYPES.map(type => (
                                      <SelectItem key={type.value} value={type.value}>
                                        <div className="flex items-center gap-2">
                                          <type.icon className="h-4 w-4" />
                                          {type.label}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={variable.required}
                                    onCheckedChange={(checked) => handleVariableChange(index, 'required', checked)}
                                  />
                                  <Label>Required</Label>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => insertVariableIntoContent(variable.name)}
                                  disabled={!variable.name}
                                >
                                  <Code className="h-4 w-4 mr-2" />
                                  Insert
                                </Button>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeVariable(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Template Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Active Template</Label>
                        <p className="text-sm text-muted-foreground">
                          Inactive templates won't be available for use
                        </p>
                      </div>
                      <Switch
                        checked={formData.isActive}
                        onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Requires Digital Signature</Label>
                        <p className="text-sm text-muted-foreground">
                          Documents generated from this template will require digital signatures
                        </p>
                      </div>
                      <Switch
                        checked={formData.requiresSignature}
                        onCheckedChange={(checked) => handleInputChange('requiresSignature', checked)}
                      />
                    </div>

                    <Separator />

                    <div>
                      <Label htmlFor="expiration-days">Document Expiration (Days)</Label>
                      <Input
                        id="expiration-days"
                        type="number"
                        value={formData.expirationDays || ''}
                        onChange={(e) => handleInputChange('expirationDays', e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="Leave blank for no expiration"
                        min="1"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Number of days after which documents expire (optional)
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Common Variables</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {COMMON_VARIABLES.map(variable => (
                    <div
                      key={variable.id}
                      className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted"
                      onClick={() => addVariable(variable)}
                    >
                      <div>
                        <p className="text-sm font-medium">{variable.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {`{{${variable.name}}}`}
                        </p>
                      </div>
                      <Plus className="h-4 w-4" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Template Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <Badge variant="outline">
                  {DOCUMENT_TYPES.find(t => t.value === formData.documentType)?.label || 'Not selected'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category:</span>
                <Badge variant="outline">
                  {DOCUMENT_CATEGORIES.find(c => c.value === formData.category)?.label || 'Not selected'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Variables:</span>
                <Badge>{formData.variables.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version:</span>
                <Badge>v{formData.version}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={formData.isActive ? 'default' : 'secondary'}>
                  {formData.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {formData.requiresSignature && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Signature:</span>
                  <Badge variant="outline">Required</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}