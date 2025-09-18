'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui'
import { Button } from '@newcondo/ui'
import { RadioGroup, RadioGroupItem } from '@newcondo/ui'
import { Label } from '@newcondo/ui'
import { Badge } from '@newcondo/ui'
import { CreditCard, Building2, Smartphone, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PaymentMethod {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  processingFee?: number
  isRecommended?: boolean
  isDisabled?: boolean
}

interface PaymentMethodsProps {
  selectedMethod: string
  onMethodSelect: (methodId: string) => void
  amount: number
  currency?: string
  className?: string
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'card',
    name: 'Debit/Credit Card',
    description: 'Pay with your Visa, Mastercard, or Verve card',
    icon: <CreditCard className="h-5 w-5" />,
    processingFee: 1.4,
    isRecommended: true,
  },
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    description: 'Direct bank transfer with instant confirmation',
    icon: <Building2 className="h-5 w-5" />,
    processingFee: 0,
  },
  {
    id: 'ussd',
    name: 'USSD',
    description: 'Pay using your bank USSD code (*901#, *737#, etc.)',
    icon: <Smartphone className="h-5 w-5" />,
    processingFee: 0,
  },
  {
    id: 'qr',
    name: 'QR Code',
    description: 'Scan QR code with your banking app',
    icon: <Wallet className="h-5 w-5" />,
    processingFee: 0,
  },
]

export default function PaymentMethods({
  selectedMethod,
  onMethodSelect,
  amount,
  currency = 'NGN',
  className,
}: PaymentMethodsProps) {
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null)

  const calculateTotal = (method: PaymentMethod) => {
    if (!method.processingFee) return amount
    return amount + (amount * method.processingFee) / 100
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Select Payment Method
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedMethod} onValueChange={onMethodSelect}>
          <div className="space-y-3">
            {PAYMENT_METHODS.map((method) => {
              const total = calculateTotal(method)
              const isSelected = selectedMethod === method.id
              const isHovered = hoveredMethod === method.id
              
              return (
                <div
                  key={method.id}
                  className={cn(
                    'relative flex items-center space-x-3 rounded-lg border p-4 transition-all duration-200 cursor-pointer',
                    {
                      'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2': isSelected,
                      'border-gray-200 hover:border-gray-300 hover:bg-gray-50': !isSelected && !method.isDisabled,
                      'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50': method.isDisabled,
                    }
                  )}
                  onMouseEnter={() => !method.isDisabled && setHoveredMethod(method.id)}
                  onMouseLeave={() => setHoveredMethod(null)}
                  onClick={() => !method.isDisabled && onMethodSelect(method.id)}
                >
                  {method.isRecommended && (
                    <Badge
                      variant="secondary"
                      className="absolute -top-2 -right-2 bg-green-100 text-green-800 text-xs"
                    >
                      Recommended
                    </Badge>
                  )}
                  
                  <RadioGroupItem
                    value={method.id}
                    id={method.id}
                    disabled={method.isDisabled}
                    className="data-[state=checked]:border-primary data-[state=checked]:text-primary"
                  />
                  
                  <div className="flex-1 flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'p-2 rounded-md transition-colors',
                        {
                          'bg-primary text-primary-foreground': isSelected,
                          'bg-gray-100 text-gray-600': !isSelected,
                        }
                      )}>
                        {method.icon}
                      </div>
                      
                      <div className="flex-1">
                        <Label
                          htmlFor={method.id}
                          className="text-base font-medium cursor-pointer"
                        >
                          {method.name}
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {method.description}
                        </p>
                        
                        {method.processingFee && method.processingFee > 0 && (
                          <div className="mt-2">
                            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                              Processing fee: {method.processingFee}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        {formatCurrency(total)}
                      </div>
                      {method.processingFee && method.processingFee > 0 && (
                        <div className="text-xs text-muted-foreground">
                          +{formatCurrency(total - amount)} fee
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </RadioGroup>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-800 font-medium">
                Secure Payment Processing
              </p>
              <p className="text-xs text-blue-600 mt-1">
                All payments are processed securely through Flutterwave with bank-grade encryption.
                Your payment information is never stored on our servers.
              </p>
            </div>
          </div>
        </div>
        
        {selectedMethod && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-green-800 font-medium">
                {PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name} selected
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}