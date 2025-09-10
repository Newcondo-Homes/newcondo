'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UploadDropzone } from '@uploadthing/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/card';
import { Button } from '@newcondo/ui/button';
import { Badge } from '@newcondo/ui/badge';
import { Textarea } from '@newcondo/ui/textarea';
import { Input } from '@newcondo/ui/input';
import { Label } from '@newcondo/ui/label';
import { Checkbox } from '@newcondo/ui/checkbox';
import { AlertCircle, CheckCircle2, Upload, X, FileText, User, Phone, Mail } from 'lucide-react';
import { Alert, AlertDescription } from '@newcondo/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@newcondo/ui/form';
import { useToast } from '@newcondo/ui/use-toast';
import { cn } from '@newcondo/ui/utils';

const agentPermissionSchema = z.object({
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
  ownerPhone: z.string().min(10, 'Please enter a valid phone number'),
  ownerEmail: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  relationshipToProperty: z.string().min(5, 'Please specify your relationship to the property'),
  permissionScope: z.array(z.string()).min(1, 'Please select at least one permission'),
  permissionDuration: z.string().min(1, 'Please specify the permission duration'),
  additionalNotes: z.string().optional(),
  confirmAccuracy: z.boolean().refine(val => val === true, 'You must confirm the accuracy of the information'),
  consentDocument: z.string().optional()
});

type AgentPermissionFormData = z.infer<typeof agentPermissionSchema>;

interface AgentPermissionDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  verificationNotes?: string;
}

interface AgentPermissionFormProps {
  propertyId: string;
  onSubmit?: (data: AgentPermissionFormData) => void;
  existingPermission?: Partial<AgentPermissionFormData>;
  existingDocument?: AgentPermissionDocument;
  className?: string;
  disabled?: boolean;
}

const PERMISSION_SCOPES = [
  { id: 'list', label: 'List property for rent' },
  { id: 'show', label: 'Show property to prospective tenants' },
  { id: 'negotiate', label: 'Negotiate rental terms' },
  { id: 'collect_documents', label: 'Collect tenant documents' },
  { id: 'sign_agreements', label: 'Sign rental agreements on behalf of owner' },
  { id: 'collect_payments', label: 'Collect rental payments' }
];

const DURATION_OPTIONS = [
  { value: '3_months', label: '3 Months' },
  { value: '6_months', label: '6 Months' },
  { value: '1_year', label: '1 Year' },
  { value: '2_years', label: '2 Years' },
  { value: 'indefinite', label: 'Indefinite (until revoked)' }
];

export function AgentPermissionForm({
  propertyId,
  onSubmit,
  existingPermission,
  existingDocument,
  className,
  disabled = false
}: AgentPermissionFormProps) {
  const [uploadedDocument, setUploadedDocument] = useState<AgentPermissionDocument | null>(existingDocument || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<AgentPermissionFormData>({
    resolver: zodResolver(agentPermissionSchema),
    defaultValues: {
      ownerName: existingPermission?.ownerName || '',
      ownerPhone: existingPermission?.ownerPhone || '',
      ownerEmail: existingPermission?.ownerEmail || '',
      relationshipToProperty: existingPermission?.relationshipToProperty || '',
      permissionScope: existingPermission?.permissionScope || [],
      permissionDuration: existingPermission?.permissionDuration || '',
      additionalNotes: existingPermission?.additionalNotes || '',
      confirmAccuracy: false,
      consentDocument: existingDocument?.fileUrl || ''
    }
  });

  const handleUploadComplete = async (res: any) => {
    try {
      setIsUploading(true);
      
      // Create document record via API
      const response = await fetch('/api/documents/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          fileName: res[0].name,
          fileUrl: res[0].url,
          fileSizeBytes: res[0].size,
          documentType: 'CONSENT_DOCUMENT'
        })
      });

      if (!response.ok) throw new Error('Failed to save document');

      const document = await response.json();
      setUploadedDocument(document);
      form.setValue('consentDocument', document.fileUrl);
      
      toast({
        title: 'Document uploaded successfully',
        description: 'Your consent document has been uploaded and is ready for submission.'
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'There was an error uploading your document. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveDocument = async () => {
    if (!uploadedDocument) return;

    try {
      const response = await fetch(`/api/documents/${uploadedDocument.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to remove document');

      setUploadedDocument(null);
      form.setValue('consentDocument', '');
      
      toast({
        title: 'Document removed',
        description: 'The consent document has been removed.'
      });
    } catch (error) {
      toast({
        title: 'Removal failed',
        description: 'There was an error removing the document. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleSubmit = async (data: AgentPermissionFormData) => {
    if (!uploadedDocument) {
      toast({
        title: 'Document required',
        description: 'Please upload a signed consent document from the property owner.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/properties/agent-permission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          ...data,
          documentId: uploadedDocument.id
        })
      });

      if (!response.ok) throw new Error('Failed to submit permission form');

      onSubmit?.(data);
      
      toast({
        title: 'Permission form submitted',
        description: 'Your agent permission form has been submitted for verification.'
      });
    } catch (error) {
      toast({
        title: 'Submission failed',
        description: 'There was an error submitting your form. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'REJECTED':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Upload className="h-4 w-4" />;
    }
  };

  return (
    <Card className={cn("w-full max-w-4xl", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Agent Permission Form
        </CardTitle>
        <CardDescription>
          This form grants permission to act as an agent for this property. 
          Both the form and a signed consent document from the property owner are required.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Property Owner Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Property Owner Information</h3>
              
              <FormField
                control={form.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Owner Full Name *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          {...field} 
                          className="pl-10" 
                          placeholder="Enter property owner's full name"
                          disabled={disabled}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ownerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            {...field} 
                            className="pl-10" 
                            placeholder="+234 xxx xxx xxxx"
                            disabled={disabled}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ownerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            {...field} 
                            className="pl-10" 
                            placeholder="owner@example.com"
                            disabled={disabled}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="relationshipToProperty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Relationship to Property *</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="e.g., Licensed real estate agent representing the owner, Property management company, Family member managing on behalf of owner"
                        disabled={disabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Permission Scope */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Permission Scope</h3>
              
              <FormField
                control={form.control}
                name="permissionScope"
                render={() => (
                  <FormItem>
                    <FormLabel>What are you authorized to do? *</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {PERMISSION_SCOPES.map((scope) => (
                        <FormField
                          key={scope.id}
                          control={form.control}
                          name="permissionScope"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(scope.id)}
                                  onCheckedChange={(checked) => {
                                    const updatedValue = checked
                                      ? [...(field.value || []), scope.id]
                                      : (field.value || []).filter((value) => value !== scope.id);
                                    field.onChange(updatedValue);
                                  }}
                                  disabled={disabled}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {scope.label}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="permissionDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permission Duration *</FormLabel>
                    <FormControl>
                      <select 
                        {...field} 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={disabled}
                      >
                        <option value="">Select duration</option>
                        {DURATION_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="additionalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Any additional information about the permission arrangement"
                        disabled={disabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Document Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Consent Document</h3>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You must upload a signed consent document from the property owner 
                  authorizing you to act as their agent. This document should include 
                  the owner's signature and contact information.
                </AlertDescription>
              </Alert>

              {uploadedDocument ? (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium text-sm">{uploadedDocument.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        Uploaded consent document
                      </p>
                      {uploadedDocument.verificationNotes && (
                        <p className="text-xs text-red-600 mt-1">
                          {uploadedDocument.verificationNotes}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getStatusColor(uploadedDocument.status)}>
                      {getStatusIcon(uploadedDocument.status)}
                      {uploadedDocument.status.toLowerCase()}
                    </Badge>
                    
                    {uploadedDocument.status !== 'APPROVED' && !disabled && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        type="button"
                        onClick={handleRemoveDocument}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                !disabled && (
                  <UploadDropzone
                    endpoint="documentUploader"
                    onClientUploadComplete={handleUploadComplete}
                    onUploadError={(error: Error) => {
                      toast({
                        title: 'Upload failed',
                        description: error.message,
                        variant: 'destructive'
                      });
                    }}
                    appearance={{
                      button: "bg-primary text-primary-foreground hover:bg-primary/90",
                      allowedContent: "text-muted-foreground",
                      label: "text-foreground"
                    }}
                    content={{
                      button: "Upload Consent Document",
                      allowedContent: "PDF, JPG, PNG (Max 5MB)",
                      label: "Click to upload or drag and drop the signed consent document"
                    }}
                  />
                )
              )}
            </div>

            {/* Confirmation */}
            <FormField
              control={form.control}
              name="confirmAccuracy"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={disabled || isSubmitting}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I confirm that all the information provided above is accurate and truthful to the best of my knowledge.
                    </FormLabel>
                    <FormDescription className="text-xs">
                      By submitting this form, you authorize NewCondo to verify the information and the attached document.
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit"
              className="w-full"
              disabled={isSubmitting || isUploading || disabled || !form.formState.isValid}
            >
              {(isSubmitting || isUploading) && <span className="animate-spin h-4 w-4 mr-2" />}
              {isSubmitting ? "Submitting..." : "Submit Permission Form"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}