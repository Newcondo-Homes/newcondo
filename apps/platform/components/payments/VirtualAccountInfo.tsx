'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/card'
import { Button } from '@newcondo/ui/components/button'
import { Badge } from '@newcondo/ui/components/badge'
import { Separator } from '@newcondo/ui/components/separator'
import { Alert, AlertDescription, AlertTitle } from '@newcondo/ui/components/alert'
import { toast } from '@newcondo/ui/'
import { 
  Copy, 
  Eye, 
  EyeOff, 
  Banknote, 
  Building2, 
  User, 
  Shield,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface VirtualAccount {
  id: string
  accountNumber: string
  accountName: string
  bankCode: string
  balance: number
  currency: string
  isActive: boolean
  flutterwaveAccountId?: string
  property?: {
    id: string
    title: string
    address: string
  }
  createdAt: string
}

interface VirtualAccountInfoProps {
  virtualAccount: VirtualAccount
  className?: string
  showBalance?: boolean
  onRefresh?: () => void
  isLoading?: boolean
}

export default function VirtualAccountInfo({
  virtualAccount,
  className,
  showBalance = true,
  onRefresh,
  isLoading = false
}: VirtualAccountInfoProps) {
  const [showAccountDetails, setShowAccountDetails] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      toast.success("Copied", {
        description: `${fieldName} copied to clipboard`,
      })
      
      // Clear the copied state after 2 seconds
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      toast.error("Copy Failed",{
        description: "Unable to copy to clipboard",
      })
    }
  }

  const getBankName = (bankCode: string) => {
    const bankMap: Record<string, string> = {
      '044': 'Access Bank',
      '014': 'Afribank',
      '030': 'Heritage Bank',
      '301': 'Jaiz Bank',
      '050': 'Ecobank',
      '070': 'Fidelity Bank',
      '011': 'First Bank',
      '214': 'First City Monument Bank',
      '058': 'GTBank',
      '082': 'Keystone Bank',
      '526': 'Parallex Bank',
      '076': 'Polaris Bank',
      '101': 'Providus Bank',
      '221': 'Stanbic IBTC Bank',
      '068': 'Standard Chartered Bank',
      '232': 'Sterling Bank',
      '100': 'Suntrust Bank',
      '032': 'Union Bank',
      '033': 'United Bank for Africa',
      '215': 'Unity Bank',
      '035': 'Wema Bank',
      '057': 'Zenith Bank'
    }
    return bankMap[bankCode] || `Bank (${bankCode})`
  }

  const formatCurrency = (amount: number, currency: string = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-primary" />
            Virtual Account
          </CardTitle>
          <div className="flex items-center gap-2">
            {virtualAccount.isActive ? (
              <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Inactive
              </Badge>
            )}
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                className="h-8"
              >
                {isLoading ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  "Refresh"
                )}
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          Dedicated account for secure property transactions
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Account Status Alert */}
        {!virtualAccount.isActive && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Account Inactive</AlertTitle>
            <AlertDescription>
              This virtual account is currently inactive. Contact support for assistance.
            </AlertDescription>
          </Alert>
        )}

        {/* Property Information */}
        {virtualAccount.property && (
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {virtualAccount.property.title}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {virtualAccount.property.address}
              </p>
            </div>
          </div>
        )}

        {/* Account Balance */}
        {showBalance && (
          <div className="p-3 bg-primary/5 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Account Balance
              </span>
              <span className="text-lg font-bold text-primary">
                {formatCurrency(virtualAccount.balance, virtualAccount.currency)}
              </span>
            </div>
          </div>
        )}

        <Separator />

        {/* Account Details Toggle */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Account Details</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAccountDetails(!showAccountDetails)}
              className="h-8 px-2"
            >
              {showAccountDetails ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>

          {showAccountDetails && (
            <div className="space-y-3">
              {/* Account Number */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Account Number
                  </p>
                  <p className="text-sm font-mono font-medium">
                    {virtualAccount.accountNumber}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(virtualAccount.accountNumber, 'Account Number')}
                  className="h-8 w-8 p-0"
                >
                  <Copy className={cn(
                    "h-4 w-4",
                    copiedField === 'Account Number' && "text-green-600"
                  )} />
                </Button>
              </div>

              {/* Account Name */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Account Name
                  </p>
                  <p className="text-sm font-medium">
                    {virtualAccount.accountName}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(virtualAccount.accountName, 'Account Name')}
                  className="h-8 w-8 p-0"
                >
                  <Copy className={cn(
                    "h-4 w-4",
                    copiedField === 'Account Name' && "text-green-600"
                  )} />
                </Button>
              </div>

              {/* Bank Information */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Bank
                  </p>
                  <p className="text-sm font-medium">
                    {getBankName(virtualAccount.bankCode)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(getBankName(virtualAccount.bankCode), 'Bank Name')}
                  className="h-8 w-8 p-0"
                >
                  <Copy className={cn(
                    "h-4 w-4",
                    copiedField === 'Bank Name' && "text-green-600"
                  )} />
                </Button>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Account Information */}
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            <span>Secured by Flutterwave</span>
          </div>
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>Created on {formatDate(virtualAccount.createdAt)}</span>
          </div>
          {virtualAccount.flutterwaveAccountId && (
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 text-center">#</span>
              <span>ID: {virtualAccount.flutterwaveAccountId}</span>
            </div>
          )}
        </div>

        {/* Instructions */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Use this account for property-related payments only. 
            Funds are held securely until payment confirmation.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}