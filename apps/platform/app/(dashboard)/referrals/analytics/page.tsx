// apps/platform/app/(dashboard)/referrals/analytics/page.tsx

import { Metadata } from 'next';
import { ReferralAnalytics } from '@/components/referrals/ReferralAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Referral Analytics | NewCondo',
  description: 'Track your referral performance and insights',
};

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Referral Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track your performance and optimize your referral strategy
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* Key Insights */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Best Performing Channel</p>
              <p className="text-lg font-semibold">WhatsApp</p>
              <p className="text-xs text-green-600">32% conversion rate</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Peak Activity Time</p>
              <p className="text-lg font-semibold">6PM - 9PM</p>
              <p className="text-xs text-blue-600">Most referrals occur</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Average Time to Qualify</p>
              <p className="text-lg font-semibold">3.5 days</p>
              <p className="text-xs text-purple-600">From signup to qualified</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Dashboard */}
      <ReferralAnalytics />

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
              <span className="text-2xl">💡</span>
              <div>
                <p className="font-medium text-sm">Share during peak hours</p>
                <p className="text-xs text-muted-foreground">
                  Your referrals are most likely to convert between 6PM-9PM
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
              <span className="text-2xl">📱</span>
              <div>
                <p className="font-medium text-sm">Focus on WhatsApp</p>
                <p className="text-xs text-muted-foreground">
                  WhatsApp has your highest conversion rate at 32%
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="font-medium text-sm">You&apos;re 2 referrals away from the next milestone</p>
                <p className="text-xs text-muted-foreground">
                  Earn ₦10,000 bonus when you reach 10 qualified referrals
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}