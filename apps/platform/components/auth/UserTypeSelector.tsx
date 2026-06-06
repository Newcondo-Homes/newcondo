'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from '@newcondo/ui'
import { CheckCircle, Home, Building, Users } from 'lucide-react'
import type { UserType } from '@/types/api'


interface UserTypeSelectorProps {
  selectedType: UserType | null
  onSelect: (type: UserType) => void
  disabled?: boolean
}

const userTypes = [
  {
    type: 'RENTER' as UserType,
    title: 'I want to rent',
    description: 'Looking for properties to rent',
    icon: Home,
    features: [
      'Browse available properties',
      'Book property viewings',
      'Apply for rentals',
      'Make secure payments'
    ],
    badge: 'Most Popular'
  },
  {
    type: 'OWNER' as UserType,
    title: 'I own properties',
    description: 'List and manage my properties',
    icon: Building,
    features: [
      'List properties for rent',
      'Manage tenant applications',
      'Track rental payments',
      'Property verification services'
    ]
  },
  {
    type: 'AGENT' as UserType,
    title: 'I\'m a real estate agent',
    description: 'Help others find and manage properties',
    icon: Users,
    features: [
      'List client properties',
      'Earn commission on rentals',
      'Property marking services',
      'Manage multiple listings'
    ]
  }
]

export default function UserTypeSelector({ selectedType, onSelect, disabled }: UserTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">What brings you to NewCondo?</h2>
        <p className="text-muted-foreground">
          Choose your account type to get started with the right features
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {userTypes.map((userType) => {
          const Icon = userType.icon
          const isSelected = selectedType === userType.type
          
          return (
            <Card
              key={userType.type}
              className={`relative cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-primary shadow-md' : ''
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !disabled && onSelect(userType.type)}
            >
              {userType.badge && (
                <div className="absolute -top-2 left-4">
                  <Badge variant="secondary" className="text-xs">
                    {userType.badge}
                  </Badge>
                </div>
              )}
              
              {isSelected && (
                <div className="absolute -top-2 -right-2">
                  <CheckCircle className="h-6 w-6 text-primary bg-white rounded-full" />
                </div>
              )}

              <CardHeader className="text-center pb-3">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{userType.title}</CardTitle>
                <CardDescription className="text-sm">
                  {userType.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {userType.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {selectedType && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            You can change your account type later in your profile settings
          </p>
        </div>
      )}
    </div>
  )
}