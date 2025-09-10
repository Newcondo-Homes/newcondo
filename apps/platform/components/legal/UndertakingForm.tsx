'use client';

import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@newcondo/ui/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@newcondo/ui/components/ui/card';
import { Checkbox } from '@newcondo/ui/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@newcondo/ui/components/ui/form';
import { Input } from '@newcondo/ui/components/ui/input';
import { Textarea } from '@newcondo/ui/components/ui/textarea';
import { Alert, AlertDescription } from '@newcondo/ui/components/ui/alert';
import { Badge } from '@newcondo/ui/components/ui/badge';
import { FileText, Download, Upload, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { DocumentTemplateViewer } from './DocumentTemplateViewer';

const undertakingSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phoneNumber: z.string().min(10, 'Phone number must be valid'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  propertyAddress: z.string().min(10, 'Property address must be at least 10 characters'),
  relationshipToProperty: z.enum(['OWNER', 'AGENT', 'MANAGER'], {
    required_error: 'Please select your relationship to the property'
  }),
  witnessName: z.string().min(2, 'Witness name is required'),
  witnessContact: z.string().min(10, 'Witness contact is required'),
  additionalTerms: z.string().optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions'
  }),
  acceptResponsibility: z.boolean().refine((val) => val === true, {
    message: 'You must accept full responsibility for the information provided'
  }),
  acceptLegalConsequences: z.boolean().refine((val) => val === true, {
    message: 'You must acknowledge potential legal consequences for false information'
  }),
  digitallySigned: z.boolean().refine((val) => val === true, {
    message: 'Digital signature is required'
  }),
  documentFile: z.any().optional()
});

type UndertakingFormData = z.infer<typeof undertakingSchema>;

interface UndertakingFormProps {
  propertyId?: string;
  onSuccess?: (documentId: string) => void;
  onCancel?: () => void;
  existingDocument?: {
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
  };
}

export function UndertakingForm({ 
  propertyId, 
  onSuccess, 
  onCancel, 
  existingDocument 
}: UndertakingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const form = useForm<UndertakingFormData>({
    resolver: zodResolver(undertakingSchema),
    defaultValues: {
      fullName: '',
      phoneNumber: '',
      address: '',
      propertyAddress: '',
      witnessName: '',
      witnessContact: '',
      additionalTerms: '',
      acceptTerms: false,
      acceptResponsibility: false,
      acceptLegalConsequences: false,
      digitallySigned: false
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type and size
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PDF, JPEG, or PNG file');
        return;
      }

      if (file.size > maxSize) {
        alert('File size must be less than 10MB');
        return;
      }

      setUploadedFile(file);
      form.setValue('documentFile', file);
    }
  };

  const onSubmit = async (data: UndertakingFormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      
      // Add form data
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'documentFile' && value !== undefined) {
          formData.append(key, String(value));
        }
      });

      // Add file if uploaded
      if (uploadedFile) {
        formData.append('documentFile', uploadedFile);
      }

      // Add metadata
      if (propertyId) {
        formData.append('propertyId', propertyId);
      }
      formData.append('documentType', 'UNDERTAKING_DOCUMENT');

      const response = await fetch('/api/legal/undertaking', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to submit undertaking');
      }

      const result = await response.json();
      onSuccess?.(result.documentId);
      
    } catch (error) {
      console.error('Error submitting undertaking:', error);
      alert('Failed to submit undertaking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadTemplate = () => {
    // This would typically download a PDF template
    const link = document.createElement('a');
    link.href = '/templates/undertaking-template.pdf';
    link.download = 'undertaking-template.pdf';
    link.click();
  };

  const getStatusBadge = () => {
    if (!existingDocument) return null;

    const statusConfig = {
      PENDING: { variant: 'secondary' as const, icon: Clock, text: 'Under Review' },
      APPROVED: { variant: 'success' as const, icon: CheckCircle, text: 'Approved' },
      REJECTED: { variant: 'destructive' as const, icon: AlertTriangle, text: 'Rejected' }
    };

    const config = statusConfig[existingDocument.status];
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Document Status */}
      {existingDocument && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Undertaking Document Status</h4>
                <p className="text-sm text-muted-foreground">
                  Document ID: {existingDocument.id}
                </p>
              </div>
              {getStatusBadge()}
            </div>
            
            {existingDocument.status === 'REJECTED' && existingDocument.rejectionReason && (
              <Alert className="mt-4" variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Rejection Reason: {existingDocument.rejectionReason}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Legal Undertaking Form
          </CardTitle>
          <CardDescription>
            This legal undertaking certifies the accuracy of information provided about the property.
            Please complete all fields accurately as this document has legal implications.
          </CardDescription>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowTemplate(true)}
            >
              <FileText className="h-4 w-4 mr-2" />
              View Template
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Legal Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Address *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter your full address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="propertyAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Address *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter the property address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="relationshipToProperty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship to Property *</FormLabel>
                    <FormControl>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="">Select relationship</option>
                        <option value="OWNER">Property Owner</option>
                        <option value="AGENT">Real Estate Agent</option>
                        <option value="MANAGER">Property Manager</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Witness Information */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">Witness Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="witnessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Witness Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter witness name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="witnessContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Witness Contact *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter witness phone/email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Additional Terms */}
              <FormField
                control={form.control}
                name="additionalTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Terms (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional terms or conditions you wish to include"
                        className="min-h-20"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* File Upload */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">Document Upload (Optional)</h4>
                <p className="text-sm text-muted-foreground">
                  You can upload a signed physical copy of the undertaking document if available.
                </p>
                
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>

                {uploadedFile && (
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700">
                      File uploaded: {uploadedFile.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Legal Acknowledgments */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">Legal Acknowledgments</h4>
                
                <FormField
                  control={form.control}
                  name="acceptTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I accept the terms and conditions *
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          I have read and agree to abide by all platform terms and conditions.
                        </p>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="acceptResponsibility"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I accept full responsibility *
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          I take full responsibility for the accuracy of all information provided.
                        </p>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="acceptLegalConsequences"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I acknowledge legal consequences *
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          I understand that providing false information may result in legal action.
                        </p>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="digitallySigned"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Digital signature *
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          By checking this box, I confirm this serves as my digital signature.
                        </p>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Legal Undertaking'}
          </Button>
        </CardFooter>
      </Card>

      {/* Template Viewer Modal */}
      {showTemplate && (
        <DocumentTemplateViewer
          templateType="UNDERTAKING"
          onClose={() => setShowTemplate(false)}
        />
      )}
    </div>
  );
}