"use client"

import { useState } from 'react'
import { X, FileText, AlertTriangle, Check } from 'lucide-react'
import { Button } from '@newcondo/ui/components/ui/button'
import { Checkbox } from '@newcondo/ui/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@newcondo/ui/components/ui/dialog'
import { ScrollArea } from '@newcondo/ui/components/ui/scroll-area'
import { Badge } from '@newcondo/ui/components/ui/badge'
import { Separator } from '@newcondo/ui/components/ui/separator'
import { Alert, AlertDescription } from '@newcondo/ui/components/ui/alert'

interface LegalDocument {
  id: string
  title: string
  type: 'TERMS_CONDITIONS' | 'PRIVACY_POLICY' | 'PROPERTY_AGREEMENT' | 'AGENT_AGREEMENT' | 'UNDERTAKING'
  content: string
  version: string
  isRequired: boolean
  lastUpdated: Date
}

interface LegalAgreementModalProps {
  isOpen: boolean
  onClose: () => void
  documents: LegalDocument[]
  userType: 'OWNER' | 'AGENT' | 'RENTER'
  onAccept: (acceptedDocuments: string[]) => Promise<void>
  isLoading?: boolean
}

export default function LegalAgreementModal({
  isOpen,
  onClose,
  documents,
  userType,
  onAccept,
  isLoading = false
}: LegalAgreementModalProps) {
  const [acceptedDocuments, setAcceptedDocuments] = useState<Set<string>>(new Set())
  const [currentDocumentIndex, setCurrentDocumentIndex] = useState(0)
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState<Set<string>>(new Set())

  const currentDocument = documents[currentDocumentIndex]
  const requiredDocuments = documents.filter(doc => doc.isRequired)
  const allRequiredAccepted = requiredDocuments.every(doc => acceptedDocuments.has(doc.id))

  const handleDocumentAccept = (documentId: string, accepted: boolean) => {
    const newAccepted = new Set(acceptedDocuments)
    if (accepted) {
      newAccepted.add(documentId)
    } else {
      newAccepted.delete(documentId)
    }
    setAcceptedDocuments(newAccepted)
  }

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10

    if (isAtBottom && currentDocument) {
      setHasScrolledToEnd(prev => new Set(prev).add(currentDocument.id))
    }
  }

  const handleNext = () => {
    if (currentDocumentIndex < documents.length - 1) {
      setCurrentDocumentIndex(currentDocumentIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentDocumentIndex > 0) {
      setCurrentDocumentIndex(currentDocumentIndex - 1)
    }
  }

  const handleFinalAccept = async () => {
    await onAccept(Array.from(acceptedDocuments))
  }

  const getDocumentTypeLabel = (type: LegalDocument['type']) => {
    const labels = {
      TERMS_CONDITIONS: 'Terms & Conditions',
      PRIVACY_POLICY: 'Privacy Policy',
      PROPERTY_AGREEMENT: 'Property Agreement',
      AGENT_AGREEMENT: 'Agent Agreement',
      UNDERTAKING: 'Legal Undertaking'
    }
    return labels[type]
  }

  const getDocumentIcon = (type: LegalDocument['type']) => {
    switch (type) {
      case 'TERMS_CONDITIONS':
        return <FileText className="h-4 w-4" />
      case 'PRIVACY_POLICY':
        return <FileText className="h-4 w-4" />
      case 'PROPERTY_AGREEMENT':
        return <FileText className="h-4 w-4" />
      case 'AGENT_AGREEMENT':
        return <FileText className="h-4 w-4" />
      case 'UNDERTAKING':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  if (!currentDocument) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getDocumentIcon(currentDocument.type)}
              {getDocumentTypeLabel(currentDocument.type)}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {currentDocumentIndex + 1} of {documents.length}
              </Badge>
              <Badge variant="secondary">v{currentDocument.version}</Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 px-6">
          {/* Document Navigation */}
          <div className="flex items-center gap-2 mb-4">
            {documents.map((doc, index) => (
              <div key={doc.id} className="flex items-center">
                <Button
                  variant={index === currentDocumentIndex ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentDocumentIndex(index)}
                  className="flex items-center gap-1"
                >
                  {acceptedDocuments.has(doc.id) && (
                    <Check className="h-3 w-3" />
                  )}
                  {index + 1}
                </Button>
                {index < documents.length - 1 && (
                  <div className="w-4 h-px bg-border mx-1" />
                )}
              </div>
            ))}
          </div>

          <Separator className="mb-4" />

          {/* Document Content */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{currentDocument.title}</h3>
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date(currentDocument.lastUpdated).toLocaleDateString()}
              </p>
            </div>

            <ScrollArea 
              className="h-96 w-full border rounded-md p-4"
              onScrollCapture={handleScroll}
            >
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {currentDocument.content}
              </div>
            </ScrollArea>

            {/* Acceptance Checkbox */}
            <div className="space-y-3">
              {!hasScrolledToEnd.has(currentDocument.id) && currentDocument.isRequired && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Please scroll to the end of the document to continue.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-start space-x-2">
                <Checkbox
                  id={`accept-${currentDocument.id}`}
                  checked={acceptedDocuments.has(currentDocument.id)}
                  onCheckedChange={(checked) => 
                    handleDocumentAccept(currentDocument.id, checked as boolean)
                  }
                  disabled={
                    currentDocument.isRequired && 
                    !hasScrolledToEnd.has(currentDocument.id)
                  }
                />
                <label
                  htmlFor={`accept-${currentDocument.id}`}
                  className="text-sm leading-5 cursor-pointer"
                >
                  I have read and accept the {getDocumentTypeLabel(currentDocument.type)}
                  {currentDocument.isRequired && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 pt-0">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentDocumentIndex === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={handleNext}
              disabled={currentDocumentIndex === documents.length - 1}
            >
              Next
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {acceptedDocuments.size} of {requiredDocuments.length} required documents accepted
            </p>
            
            {currentDocumentIndex === documents.length - 1 ? (
              <Button
                onClick={handleFinalAccept}
                disabled={!allRequiredAccepted || isLoading}
                className="min-w-24"
              >
                {isLoading ? 'Processing...' : 'Accept All'}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}