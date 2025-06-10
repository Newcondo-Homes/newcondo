'use client'

import { Button } from '@newcondo/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui'
import { Home, Building, Users } from 'lucide-react'

type UserType = 'RENTER' | 'OWNER' | 'AGENT'

interface UserTypeSelectorProps {
  onSelect: (type: UserType) => void
}

export default function UserTypeSelector({ onSelect }: UserTypeSelectorProps) {
  const userTypes = [
    {
      type: 'RENTER' as UserType,
      title: 'I want to rent',
      description: 'Find and rent properties',
      icon: Home,
      color: 'text-blue-600'
    },
    {
      type: 'OWNER' as UserType,
      title: 'I own properties',
      description: 'List and manage my properties',
      icon: Building,
      color: 'text-green-600'
    },
    {
      type: 'AGENT' as UserType,
      title: 'I am an agent',
      description: 'Manage properties for others',
      icon: Users,
      color: 'text-purple-600'
    }
  ]

  return (
    <div className="space-y-3">
      {userTypes.map((userType) => {
        const Icon = userType.icon
        return (
          <Button
            key={userType.type}
            variant="outline"
            className="w-full h-auto p-0 hover:bg-muted/50"
            onClick={() => onSelect(userType.type)}
          >
            <Card className="w-full border-0 shadow-none">
              <CardContent className="flex items-center space-x-4 p-4">
                <div className={`flex-shrink-0 ${userType.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 text-left">
                  <CardTitle className="text-base font-medium">
                    {userType.title}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {userType.description}
                  </CardDescription>
                </div>
              </CardContent>
            </Card>
          </Button>
        )
      })}
    </div>
  )
}