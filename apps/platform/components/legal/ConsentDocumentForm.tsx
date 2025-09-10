"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Upload, File, X, AlertTriangle, Check } from 'lucide-react'
import { Button } from '@newcondo/ui/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@newcondo/ui/components/ui/form'
import { Input } from '@newcondo/ui/components/ui/input'
import { Textarea } from '@newcondo/ui/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@newcondo/ui/components/ui/select'
import { Checkbox } from '@newcondo/ui/components/ui/checkbox'
import { Alert, AlertDescription } from '@newcondo/ui/components/ui/alert'
import { Badge } from '@newcondo/ui/components/ui/badge'
import { Progress } from '@newcondo/ui/components/ui/progress'

const consentDocumentSchema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  documentType: z.enum(['CONSENT_TO_MANAGE', 'CONSENT_TO_MARKET', 'CONSENT_TO_RENT', 'GENERAL_CONSENT']),
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
  ownerIdNumber: z.string().min(1, 'Owner ID number is required'),
  ownerIdType: z.enum(['NIN', 'BVN', 'PASSPORT', 'VOTERS_CARD', 'DRIVERS_LICENSE']),
  agentName: z.string().min(2, 'Agent name must be at least 2 characters'),
  agentLicenseNumber: z.string().optional(),
  consentScope: z.array(z.string()).min(1, 'At least one consent scope is required'),
  validityPeriod: z.string().min(1, 'Validity period is required'),
  specialConditions: z.string().optional(),
  ownerSignature: z.string().min(1, 'Owner signature is required'),
  documentFile: z.any().optional(),
  acknowledgment: z.boolean().refine((val) => val === true, {
    message: 'You must acknowledge the consent terms'
  })
})

type ConsentDocumentData = z.infer<typeof consentDocumentSchema>

interface Property {
  id: string
  title: string
  address: string
  city: string
  state: string
}

interface ConsentDocumentFormProps {
  properties: Property[]
  onSubmit: (data: ConsentDocumentData & { file?: File }) => Promise<void>
  isLoading?: boolean
  initialData?: Partial<ConsentDocumentData>
}

const consentScopeOptions = [
  { id: 'marketing', label: 'Marketing and Advertisement' },
  { id: 'showing', label: 'Property Showing/Viewing' },
  { id: 'negotiation', label: 'Price Negotiation' },
  { id: 'documentation', label: 'Legal Documentation' },
  { id: 'key_management', label: 'Key Management' },
  { id: 'maintenance', label: 'Basic Maintenance Coordination' },
  { id: 'tenant_screening', label: 'Tenant Screening' },
  { id: 'rent_collection', label: 'Rent Collection' }
]

export default function ConsentDocumentForm({
  properties,
  onSubmit,
  isLoading = false,
  initialData
}: ConsentDocumentFormProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const form = useForm<ConsentDocumentData>({
    resolver: zodResolver(consentDocumentSchema),
    defaultValues: {
      propertyId: initialData?.propertyId || '',
      documentType: initialData?.documentType || 'CONSENT_TO_MANAGE',
      ownerName: initialData?.ownerName || '',
      ownerIdNumber: initialData?.ownerIdNumber || '',
      ownerIdType: initialData?.ownerIdType || 'NIN',
      agentName: initialData?.agentName || '',
      agentLicenseNumber: initialData?.agentLicenseNumber || '',
      consentScope: initialData?.consentScope || [],
      validityPeriod: initialData?.validityPeriod || '12',
      specialConditions: initialData?.specialConditions || '',
      ownerSignature: initialData?.ownerSignature || '',
      acknowledgment: initialData?.acknowledgment || false
    }
  })

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type and size
      if (!file.type.includes('pdf') && !file.type.includes('image')) {
        alert('Please upload a PDF or image file')
        return
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File size must be less than 5MB')
        return
      }

      setUploadedFile(file)
      
      // Create preview for images
      if (file.type.includes('image')) {
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      }

      // Simulate upload progress
      let progress = 0
      const interval = setInterval(() => {
        progress += 10
        setUploadProgress(progress)
        if (progress >= 100) {
          clearInterval(interval)
        }
      }, 100)
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    setPreviewUrl(null)
    setUploadProgress(0)
  }

  const handleFormSubmit = async (data: ConsentDocumentData) => {
    await onSubmit({ ...data, file: uploadedFile || undefined })
  }

  const getDocumentTypeLabel = (type: string) => {
    const labels = {
      'CONSENT_TO_MANAGE': 'Consent to Manage Property',
      'CONSENT_TO_MARKET': 'Consent to Market Property',
      'CONSENT_TO_RENT': 'Consent to Rent Property',
      'GENERAL_CONSENT': 'General Consent Agreement'
    }
    return labels[type as keyof typeof labels]
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <File className="h-5 w-5" />
          Consent Document Form
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Property Selection */}
            <FormField
              control={form.control}
              name="propertyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a property" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          <div>
                            <div className="font-medium">{property.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {property.address}, {property.city}, {property.state}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Document Type */}
            <FormField
              control={form.control}
              name="documentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CONSENT_TO_MANAGE">Consent to Manage Property</SelectItem>
                      <SelectItem value="CONSENT_TO_MARKET">Consent to Market Property</SelectItem>
                      <SelectItem value="CONSENT_TO_RENT">Consent to Rent Property</SelectItem>
                      <SelectItem value="GENERAL_CONSENT">General Consent Agreement</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Owner Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Owner Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Full name as on ID" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ownerIdType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner ID Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NIN">National ID Number (NIN)</SelectItem>
                        <SelectItem value="BVN">Bank Verification Number (BVN)</SelectItem>
                        <SelectItem value="PASSPORT">International Passport</SelectItem>
                        <SelectItem value="VOTERS_CARD">Voter's Card</SelectItem>
                        <SelectItem value="DRIVERS_LICENSE">Driver's License</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="ownerIdNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner ID Number *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter ID number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Agent Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="agentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Agent's full name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agentLicenseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent License Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="License number (if applicable)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Consent Scope */}
            <FormField
              control={form.control}
              name="consentScope"
              render={() => (
                <FormItem>
                  <FormLabel>Consent Scope *</FormLabel>
                  <div className="grid grid-cols-2 gap-3">
                    {consentScopeOptions.map((option) => (
                      <FormField
                        key={option.id}
                        control={form.control}
                        name="consentScope"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={option.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(option.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, option.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== option.id
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {option.label}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Validity Period */}
            <FormField
              control={form.control}
              name="validityPeriod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Validity Period (Months) *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="6">6 Months</SelectItem>
                      <SelectItem value="12">12 Months</SelectItem>
                      <SelectItem value="24">24 Months</SelectItem>
                      <SelectItem value="36">36 Months</SelectItem>
                      <SelectItem value="indefinite">Indefinite</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Special Conditions */}
            <FormField
              control={form.control}
              name="specialConditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Conditions</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Any special conditions or restrictions..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Document Upload */}
            <div className="space-y-3">
              <FormLabel>Signed Consent Document</FormLabel>
              
              {!uploadedFile ? (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <div className="mt-4">
                    <label htmlFor="document-upload" className="cursor-pointer">
                      <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                        Upload a file
                      </span>
                      <input
                        id="document-upload"
                        type="file"
                        className="sr-only"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                      />
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, JPEG, PNG up to 5MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <File className="h-4 w-4" />
                      <span className="text-sm font-medium">{uploadedFile.name}</span>
                      <Badge variant="secondary">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {uploadProgress < 100 ? (
                    <Progress value={uploadProgress} className="w-full" />
                  ) : (
                    <div className="flex items-center gap-1 text-green-600">
                      <Check className="h-4 w-4" />
                      <span className="text-xs">Upload complete</span>
                    </div>
                  )}

                  {previewUrl && (
                    <div className="mt-3">
                      <img 
                        src={previewUrl} 
                        alt="Document preview" 
                        className="max-w-xs max-h-40 object-contain border rounded"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Digital Signature */}
            <FormField
              control={form.control}
              name="ownerSignature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Digital Signature *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Type your full name as digital signature" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Acknowledgment */}
            <FormField
              control={form.control}
              name="acknowledgment"
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
                      Consent Acknowledgment *
                    </FormLabel>
                    <div className="text-sm text-muted-foreground">
                      I acknowledge that I have read and understood the terms of this consent 
                      document and hereby grant the specified permissions to the named agent.
                    </div>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {/* Warning Alert */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This consent document will be legally binding. Please ensure all information 
                is accurate and complete before submitting.
              </AlertDescription>
            </Alert>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Submitting...' : 'Submit Consent Document'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}