'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@newcondo/ui/components/dialog'
import { Button } from '@newcondo/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/card'
import { Badge } from '@newcondo/ui/components/badge'
import { MapPin, Users, Clock, DollarSign, Shield, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@newcondo/ui/components/alert'

interface MarkingRequestModalProps {
  isOpen: boolean
  onClose: () => void
  propertyAddress: string
  onSelectOption: (option: 'known_person' | 'newcondo_agent') => void
}

export default function MarkingRequestModal({
  isOpen,
  onClose,
  propertyAddress,
  onSelectOption
}: MarkingRequestModalProps) {
  const [selectedOption, setSelectedOption] = useState<'known_person' | 'newcondo_agent' | null>(null)

  const handleContinue = () => {
    if (selectedOption) {
      onSelectOption(selectedOption)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Property Marking Required
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              To verify your property location and prevent duplicates, we need to mark your property boundaries on our satellite map.
            </AlertDescription>
          </Alert>

          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Property Address:</p>
            <p className="font-medium">{propertyAddress}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Known Person Option */}
            <Card 
              className={`cursor-pointer transition-all ${
                selectedOption === 'known_person' 
                  ? 'ring-2 ring-blue-500 border-blue-500' 
                  : 'hover:border-gray-300'
              }`}
              onClick={() => setSelectedOption('known_person')}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-green-600" />
                  Ask Someone You Know
                </CardTitle>
                <CardDescription>
                  Have a trusted person visit and mark your property
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">FREE</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Self-arranged timing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Your responsibility</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  Requires someone you trust
                </Badge>
              </CardContent>
            </Card>

            {/* Newcondo Agent Option */}
            <Card 
              className={`cursor-pointer transition-all ${
                selectedOption === 'newcondo_agent' 
                  ? 'ring-2 ring-blue-500 border-blue-500' 
                  : 'hover:border-gray-300'
              }`}
              onClick={() => setSelectedOption('newcondo_agent')}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Assign to Newcondo Agent
                </CardTitle>
                <CardDescription>
                  Professional agent will visit and mark your property
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">₦5,000</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Within 24-48 hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Fully insured</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Professional service
                </Badge>
              </CardContent>
            </Card>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Property boundaries will be marked on satellite map</li>
              <li>• Photos will be taken for verification</li>
              <li>• Property will be added to our database</li>
              <li>• You'll receive confirmation once complete</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleContinue}
              disabled={!selectedOption}
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}