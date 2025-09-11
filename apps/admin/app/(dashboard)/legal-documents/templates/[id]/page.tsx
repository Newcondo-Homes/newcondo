'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui'
import { Button } from '@newcondo/ui'
import { Badge } from '@newcondo/ui'
import { Textarea } from '@newcondo/ui'
import { Input } from '@newcondo/ui'
import { Label } from '@newcondo/ui'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@newcondo/ui'
import { Switch } from '@newcondo/ui'
import { ArrowLeft, Edit, Save, X, FileText, Download, Copy } from 'lucide-react'
import { toast } from 'sonner'

interface LegalTemplate {
  id: string
  title: string
  type: string
  category: 'CONSENT' | 'OWNERSHIP' | 'UNDERTAKING' | 'PERMISSION' | 'TERMS' | 'PRIVACY'
  content: string
  variables: string[]
  isActive: boolean
  version: string
  createdBy: string
  createdAt: string
  updatedAt: string
  usageCount: number
  lastUsed: string | null
}

export default function LegalTemplateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const templateId = params.id as string

  const [template, setTemplate] = useState<LegalTemplate | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    content: '',
    variables: [] as string[],
    isActive: true
  })

  useEffect(() => {
    fetchTemplate()
  }, [templateId])

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/admin/legal-templates/${templateId}`)
      if (!response.ok) throw new Error('Failed to fetch template')
      
      const data = await response.json()
      setTemplate(data)
      setFormData({
        title: data.title,
        category: data.category,
        content: data.content,
        variables: data.variables,
        isActive: data.isActive
      })
    } catch (error) {
      toast.error('Failed to load template')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/legal-templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to update template')

      const updatedTemplate = await response.json()
      setTemplate(updatedTemplate)
      setIsEditing(false)
      toast.success('Template updated successfully')
    } catch (error) {
      toast.error('Failed to update template')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (template) {
      setFormData({
        title: template.title,
        category: template.category,
        content: template.content,
        variables: template.variables,
        isActive: template.isActive
      })
    }
    setIsEditing(false)
  }

  const handleCopyContent = () => {
    if (template) {
      navigator.clipboard.writeText(template.content)
      toast.success('Template content copied to clipboard')
    }
  }

  const handleDownload = () => {
    if (template) {
      const blob = new Blob([template.content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${template.title.toLowerCase().replace(/\s+/g, '-')}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const addVariable = () => {
    const variableName = prompt('Enter variable name (e.g., "user_name", "property_address"):')
    if (variableName && !formData.variables.includes(variableName)) {
      setFormData(prev => ({
        ...prev,
        variables: [...prev.variables, variableName]
      }))
    }
  }

  const removeVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter(v => v !== variable)
    }))
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Template not found</h3>
            <p className="text-gray-500">The requested template could not be found.</p>
            <Button 
              onClick={() => router.back()} 
              className="mt-4"
              variant="outline"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{template.title}</h1>
            <p className="text-gray-500">Legal Document Template</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!isEditing && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyContent}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                onClick={() => setIsEditing(true)}
                size="sm"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </>
          )}
          
          {isEditing && (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Template Content</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={20}
                  className="font-mono text-sm"
                  placeholder="Enter template content with variables like {{user_name}}, {{property_address}}, etc."
                />
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {template.content}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Template Details */}
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CONSENT">Consent Document</SelectItem>
                        <SelectItem value="OWNERSHIP">Ownership Proof</SelectItem>
                        <SelectItem value="UNDERTAKING">Undertaking</SelectItem>
                        <SelectItem value="PERMISSION">Permission</SelectItem>
                        <SelectItem value="TERMS">Terms & Conditions</SelectItem>
                        <SelectItem value="PRIVACY">Privacy Policy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                    />
                    <Label>Active</Label>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Version</p>
                    <p className="font-medium">{template.version}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge variant={template.isActive ? "default" : "secondary"}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Usage Count</p>
                    <p className="font-medium">{template.usageCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="font-medium">
                      {new Date(template.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Updated</p>
                    <p className="font-medium">
                      {new Date(template.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Variables */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Variables</CardTitle>
                {isEditing && (
                  <Button size="sm" variant="outline" onClick={addVariable}>
                    Add Variable
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {formData.variables.length > 0 ? (
                <div className="space-y-2">
                  {formData.variables.map((variable) => (
                    <div key={variable} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <code className="text-sm">{'{{' + variable + '}}'}</code>
                      {isEditing && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeVariable(variable)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No variables defined</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}