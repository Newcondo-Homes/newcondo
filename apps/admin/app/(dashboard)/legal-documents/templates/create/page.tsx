'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Eye, Plus, Minus, FileText } from 'lucide-react';
import { Button } from '@newcondo/ui/button';
import { Input } from '@newcondo/ui/input';
import { Label } from '@newcondo/ui/label';
import { Textarea } from '@newcondo/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/card';
import { Badge } from '@newcondo/ui/badge';
import { Switch } from '@newcondo/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@newcondo/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@newcondo/ui/dialog';
import { toast } from '@newcondo/ui/use-toast';

interface TemplateFormData {
  name: string;
  type: string;
  version: string;
  content: string;
  requiredFields: string[];
  isActive: boolean;
  description: string;
}

const templateTypes = {
  CONSENT: 'Consent Document',
  UNDERTAKING: 'Legal Undertaking',
  TERMS_CONDITIONS: 'Terms & Conditions',
  PRIVACY_POLICY: 'Privacy Policy',
  AGENT_AGREEMENT: 'Agent Agreement'
};

const commonVariables = [
  '{{USER_NAME}}',
  '{{USER_EMAIL}}',
  '{{USER_PHONE}}',
  '{{PROPERTY_ADDRESS}}',
  '{{PROPERTY_TYPE}}',
  '{{CURRENT_DATE}}',
  '{{COMPANY_NAME}}',
  '{{AGENT_NAME}}',
  '{{AGENT_EMAIL}}',
  '{{PROPERTY_OWNER}}',
  '{{RENTAL_AMOUNT}}',
  '{{LEASE_START_DATE}}',
  '{{LEASE_END_DATE}}'
];

const templatePresets = {
  CONSENT: `
    <div class="legal-document">
      <h1>Property Listing Consent Document</h1>
      <p><strong>Date:</strong> {{CURRENT_DATE}}</p>
      
      <h2>Consent to List Property</h2>
      <p>I, <strong>{{USER_NAME}}</strong>, hereby give consent to list my property located at:</p>
      <p><strong>{{PROPERTY_ADDRESS}}</strong></p>
      
      <h3>Property Details:</h3>
      <ul>
        <li>Property Type: {{PROPERTY_TYPE}}</li>
        <li>Owner: {{USER_NAME}}</li>
        <li>Contact: {{USER_EMAIL}}</li>
      </ul>
      
      <h3>Terms:</h3>
      <p>I confirm that I am the rightful owner/authorized representative of the above property and have the legal right to list it for rental purposes.</p>
      
      <div class="signature-section">
        <p>Owner Signature: _________________________</p>
        <p>Date: {{CURRENT_DATE}}</p>
      </div>
    </div>
  `,
  UNDERTAKING: `
    <div class="legal-document">
      <h1>Legal Undertaking</h1>
      <p><strong>Date:</strong> {{CURRENT_DATE}}</p>
      
      <h2>Undertaking by Property Owner/Agent</h2>
      <p>I, <strong>{{USER_NAME}}</strong>, undertake and guarantee that:</p>
      
      <ol>
        <li>The property at {{PROPERTY_ADDRESS}} is legally owned/managed by me</li>
        <li>All information provided about the property is accurate and truthful</li>
        <li>I have the legal right to enter into rental agreements for this property</li>
        <li>The property is free from any legal disputes or encumbrances</li>
        <li>I will provide all necessary documentation upon request</li>
      </ol>
      
      <h3>Liability:</h3>
      <p>I accept full responsibility for any legal issues arising from false information or unauthorized listing of the property.</p>
      
      <div class="signature-section">
        <p>Signature: _________________________</p>
        <p>Name: {{USER_NAME}}</p>
        <p>Date: {{CURRENT_DATE}}</p>
      </div>
    </div>
  `,
  AGENT_AGREEMENT: `
    <div class="legal-document">
      <h1>Agent Agreement</h1>
      <p><strong>Date:</strong> {{CURRENT_DATE}}</p>
      
      <h2>Property Management Agreement</h2>
      <p>This agreement is between:</p>
      <p><strong>Property Owner:</strong> {{PROPERTY_OWNER}}</p>
      <p><strong>Agent:</strong> {{AGENT_NAME}}</p>
      <p><strong>Property:</strong> {{PROPERTY_ADDRESS}}</p>
      
      <h3>Agent Responsibilities:</h3>
      <ul>
        <li>Market and advertise the property</li>
        <li>Screen potential tenants</li>
        <li>Handle rental inquiries</li>
        <li>Facilitate property viewings</li>
        <li>Process rental applications</li>
      </ul>
      
      <h3>Commission:</h3>
      <p>Agent commission will be calculated as per platform terms.</p>
      
      <div class="signature-section">
        <div style="display: flex; justify-content: space-between;">
          <div>
            <p>Owner Signature: ________________</p>
            <p>{{PROPERTY_OWNER}}</p>
          </div>
          <div>
            <p>Agent Signature: ________________</p>
            <p>{{AGENT_NAME}}</p>
          </div>
        </div>
        <p>Date: {{CURRENT_DATE}}</p>
      </div>
    </div>
  `
};

export default function CreateTemplatePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    type: '',
    version: '1.0',
    content: '',
    requiredFields: [],
    isActive: false,
    description: ''
  });
  const [saving, setSaving] = useState(false);
  const [newRequiredField, setNewRequiredField] = useState('');

  const handleInputChange = (field: keyof TemplateFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTypeChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      type,
      content: templatePresets[type as keyof typeof templatePresets] || prev.content
    }));
  };

  const addRequiredField = () => {
    if (newRequiredField.trim() && !formData.requiredFields.includes(newRequiredField.trim())) {
      setFormData(prev => ({
        ...prev,
        requiredFields: [...prev.requiredFields, newRequiredField.trim()]
      }));
      setNewRequiredField('');
    }
  };

  const removeRequiredField = (field: string) => {
    setFormData(prev => ({
      ...prev,
      requiredFields: prev.requiredFields.filter(f => f !== field)
    }));
  };

  const insertVariable = (variable: string) => {
    const textarea = document.querySelector('textarea[name="content"]') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const content = formData.content;
      const newContent = content.substring(0, start) + variable + content.substring(end);
      handleInputChange('content', newContent);
      
      // Set cursor position after inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.type || !formData.content.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/legal-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Legal template created successfully',
        });
        router.push('/legal-documents/templates');
      } else {
        throw new Error('Failed to create template');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create template',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Legal Template</h1>
          <p className="text-gray-600 mt-2">Create a new legal document template</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Template Preview</DialogTitle>
              </DialogHeader>
              <div 
                className="mt-4 p-4 border rounded-lg bg-gray-50"
                dangerouslySetInnerHTML={{ __html: formData.content }}
              />
            </DialogContent>
          </Dialog>
          
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter template name"
                />
              </div>

              <div>
                <Label htmlFor="type">Template Type *</Label>
                <Select value={formData.type} onValueChange={handleTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(templateTypes).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) => handleInputChange('version', e.target.value)}
                  placeholder="1.0"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of the template"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                />
                <Label htmlFor="isActive">Active (available for use)</Label>
              </div>
            </CardContent>
          </Card>

          {/* Template Content */}
          <Card>
            <CardHeader>
              <CardTitle>Template Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="content">HTML Content *</Label>
                <Textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder="Enter the template HTML content..."
                  rows={20}
                  className="font-mono"
                />
              </div>
            </CardContent>
          </Card>

          {/* Required Fields */}
          <Card>
            <CardHeader>
              <CardTitle>Required Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Fields required from users when using this template</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newRequiredField}
                      onChange={(e) => setNewRequiredField(e.target.value)}
                      placeholder="Add required field"
                      onKeyPress={(e) => e.key === 'Enter' && addRequiredField()}
                    />
                    <Button onClick={addRequiredField} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {formData.requiredFields.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.requiredFields.map((field) => (
                      <Badge key={field} variant="secondary" className="pl-3 pr-1 py-1">
                        {field}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRequiredField(field)}
                          className="h-4 w-4 p-0 ml-1"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Common Variables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {commonVariables.map(variable => (
                  <Button
                    key={variable}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => insertVariable(variable)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {variable}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}