'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { User, Phone, Clock, MapPin, FileText, AlertCircle } from 'lucide-react'

const contactPersonSchema = z.object({
  contactPersonName: z.string().min(2, 'Name must be at least 2 characters'),
  contactPersonPhone: z.string().regex(/^(\+234|0)[789]\d{9}$/, 'Please enter a valid Nigerian phone number'),
  relationship: z.string().min(1, 'Please select your relationship'),
  accessInstructions: z.string().min(10, 'Please provide detailed access instructions'),
  preferredTimeSlot: z.string().min(1, 'Please select a preferred time slot'),
  preferredDate: z.string().min(1, 'Please select a preferred date'),
  emergencyContact: z.string().optional(),
  hasPermission: z.boolean().refine(val => val === true, 'You must confirm you have permission'),
  understands: z.boolean().refine(val => val === true, 'You must confirm you understand the process')
})

type ContactPersonFormData = z.infer<typeof contactPersonSchema>

interface ContactPersonFormProps {
  propertyAddress: string
  onSubmit: (data: ContactPersonFormData) => void
  onBack: () => void
  isSubmitting?: boolean
}

export default function ContactPersonForm({
  propertyAddress,
  onSubmit,
  onBack,
  isSubmitting = false
}: ContactPersonFormProps) {
  const [selectedDate, setSelectedDate] = useState<string>('')
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<ContactPersonFormData>({
    resolver: zodResolver(contactPersonSchema)
  })

  const hasPermission = watch('hasPermission')
  const understands = watch('understands')

  const handleFormSubmit = (data: ContactPersonFormData) => {
    onSubmit(data)
  }

  const timeSlots = [
    { value: 'morning', label: 'Morning (8:00 AM - 12:00 PM)' },
    { value: 'afternoon', label: 'Afternoon (12:00 PM - 4:00 PM)' },
    { value: 'evening', label: 'Evening (4:00 PM - 6:00 PM)' }
  ]

  const relationships = [
    { value: 'family', label: 'Family Member' },
    { value: 'friend', label: 'Friend' },
    { value: 'neighbor', label: 'Neighbor' },
    { value: 'caretaker', label: 'Caretaker' },
    { value: 'tenant', label: 'Tenant' },
    { value: 'other', label: 'Other' }
  ]

  // Generate next 7 days for date selection
  const getNextSevenDays = () => {
    const days = []
    const today = new Date()
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      days.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'short', 
          day: 'numeric' 
        })
      })
    }
    
    return days
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-blue-600" />
          Contact Person Details
        </CardTitle>
        <CardDescription>
          Provide details for the person who will assist with property marking
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">Property Address:</p>
          <p className="font-medium">{propertyAddress}</p>
          <Badge variant="outline" className="mt-2">
            <MapPin className="h-3 w-3 mr-1" />
            Free Marking Service
          </Badge>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Contact Person Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Contact Person Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactPersonName">Full Name *</Label>
                <Input
                  id="contactPersonName"
                  {...register('contactPersonName')}
                  placeholder="Enter contact person's name"
                  className={errors.contactPersonName ? 'border-red-500' : ''}
                />
                {errors.contactPersonName && (
                  <p className="text-sm text-red-500 mt-1">{errors.contactPersonName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="contactPersonPhone">Phone Number *</Label>
                <Input
                  id="contactPersonPhone"
                  {...register('contactPersonPhone')}
                  placeholder="08012345678"
                  className={errors.contactPersonPhone ? 'border-red-500' : ''}
                />
                {errors.contactPersonPhone && (
                  <p className="text-sm text-red-500 mt-1">{errors.contactPersonPhone.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="relationship">Relationship to You *</Label>
              <Select onValueChange={(value) => setValue('relationship', value)}>
                <SelectTrigger className={errors.relationship ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {relationships.map((rel) => (
                    <SelectItem key={rel.value} value={rel.value}>
                      {rel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.relationship && (
                <p className="text-sm text-red-500 mt-1">{errors.relationship.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="emergencyContact">Emergency Contact (Optional)</Label>
              <Input
                id="emergencyContact"
                {...register('emergencyContact')}
                placeholder="Alternative contact number"
              />
            </div>
          </div>

          {/* Scheduling */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Preferred Schedule</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="preferredDate">Preferred Date *</Label>
                <Select onValueChange={(value) => setValue('preferredDate', value)}>
                  <SelectTrigger className={errors.preferredDate ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select date" />
                  </SelectTrigger>
                  <SelectContent>
                    {getNextSevenDays().map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.preferredDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.preferredDate.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="preferredTimeSlot">Preferred Time *</Label>
                <Select onValueChange={(value) => setValue('preferredTimeSlot', value)}>
                  <SelectTrigger className={errors.preferredTimeSlot ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.preferredTimeSlot && (
                  <p className="text-sm text-red-500 mt-1">{errors.preferredTimeSlot.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Access Instructions */}
          <div>
            <Label htmlFor="accessInstructions">Access Instructions *</Label>
            <Textarea
              id="accessInstructions"
              {...register('accessInstructions')}
              placeholder="Provide detailed instructions on how to access the property, including landmarks, gate codes, security details, etc."
              rows={4}
              className={errors.accessInstructions ? 'border-red-500' : ''}
            />
            {errors.accessInstructions && (
              <p className="text-sm text-red-500 mt-1">{errors.accessInstructions.message}</p>
            )}
          </div>

          {/* Confirmations */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Confirmations</h3>
            
            <div className="flex items-start space-x-2">
              <Checkbox
                id="hasPermission"
                checked={hasPermission}
                onCheckedChange={(checked) => setValue('hasPermission', checked as boolean)}
              />
              <Label htmlFor="hasPermission" className="text-sm">
                I confirm that I have permission to arrange for someone to access this property for marking purposes *
              </Label>
            </div>
            {errors.hasPermission && (
              <p className="text-sm text-red-500 ml-6">{errors.hasPermission.message}</p>
            )}

            <div className="flex items-start space-x-2">
              <Checkbox
                id="understands"
                checked={understands}
                onCheckedChange={(checked) => setValue('understands', checked as boolean)}
              />
              <Label htmlFor="understands" className="text-sm">
                I understand that the contact person will use our mobile app to mark the property boundaries on the satellite map *
              </Label>
            </div>
            {errors.understands && (
              <p className="text-sm text-red-500 ml-6">{errors.understands.message}</p>
            )}
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Your contact person will need to download the Newcondo app and follow the boundary marking instructions. They will receive a link via SMS once you submit this form.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}