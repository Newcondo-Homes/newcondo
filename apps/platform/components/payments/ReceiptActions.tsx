// apps/platform/components/payments/ReceiptActions.tsx
'use client'

import { Printer, Share2 } from 'lucide-react'
import { Button } from '@newcondo/ui'

interface ReceiptActionsProps {
  paymentId: string
}

export function ReceiptActions({ paymentId }: ReceiptActionsProps) {
  const handlePrint = () => {
    window.print()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Payment Receipt',
          text: `Payment receipt for transaction ${paymentId}`,
          url: window.location.href,
        })
      } catch {
        // Fallback to copying URL
        navigator.clipboard.writeText(window.location.href)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        className="print:hidden"
      >
        <Printer className="h-4 w-4 mr-2" />
        Print
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        className="print:hidden"
      >
        <Share2 className="h-4 w-4 mr-2" />
        Share
      </Button>
    </div>
  )
}