// apps/platform/components/referrals/PromotionLinkCard.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Button } from '@newcondo/ui/components/button';
import { Input } from '@newcondo/ui/components/input';
import { Badge } from '@newcondo/ui/components/badge';
import { toast } from '@newcondo/ui';
import {
  Link as LinkIcon,
  Copy,
  Check,
  Eye,
  MousePointerClick,
  DollarSign,
} from 'lucide-react';

interface PromotionLinkCardProps {
  propertyId?: string;
  propertyTitle: string;
  promotionLink: string;
  stats: {
    views: number;
    clicks: number;
    conversions: number;
    earnings: number;
  };
  isActive: boolean;
  currency?: string;
}

export function PromotionLinkCard({
  propertyTitle,
  promotionLink,
  stats,
  isActive,
  currency = 'NGN',
}: PromotionLinkCardProps) {
  const [isCopied, setIsCopied] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promotionLink);
      setIsCopied(true);
      toast.success('Link copied', {
        description: 'Promotion link copied to clipboard',
      });

      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Copy error:', error);
      toast.error('Copy failed', {
        description: 'Failed to copy link to clipboard',
      });
    }
  };

  const clickThroughRate =
    stats.views > 0 ? ((stats.clicks / stats.views) * 100).toFixed(1) : '0.0';
  const conversionRate =
    stats.clicks > 0 ? ((stats.conversions / stats.clicks) * 100).toFixed(1) : '0.0';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base mb-2 line-clamp-1">
              {propertyTitle}
            </CardTitle>
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Unique promotion link
              </span>
            </div>
          </div>
          {isActive ? (
            <Badge className="bg-green-500">Active</Badge>
          ) : (
            <Badge variant="outline" className="bg-gray-50 text-gray-700">
              Inactive
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Promotion Link */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={promotionLink}
              readOnly
              className="font-mono text-xs"
            />
            <Button
              onClick={handleCopy}
              variant="outline"
              size="icon"
              disabled={isCopied}
            >
              {isCopied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span>Views</span>
            </div>
            <p className="text-xl font-bold">{stats.views.toLocaleString()}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MousePointerClick className="h-4 w-4" />
              <span>Clicks</span>
            </div>
            <p className="text-xl font-bold">{stats.clicks.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              {clickThroughRate}% CTR
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Conversions</span>
            </div>
            <p className="text-xl font-bold">{stats.conversions}</p>
            <p className="text-xs text-muted-foreground">
              {conversionRate}% rate
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Earnings</span>
            </div>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(stats.earnings)}
            </p>
          </div>
        </div>

        {/* Performance Bar */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Performance</span>
            <span>
              {stats.conversions > 0 ? 'Good' : stats.clicks > 0 ? 'Fair' : 'Low'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${stats.conversions > 0
                  ? 'bg-green-500'
                  : stats.clicks > 0
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
              style={{
                width: `${Math.min(
                  100,
                  stats.conversions > 0
                    ? 100
                    : stats.clicks > 0
                      ? 50
                      : 10
                )}%`,
              }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}