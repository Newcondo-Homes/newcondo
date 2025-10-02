import { Metadata } from 'next';
import { Suspense } from 'react';
import { PaymentQueueTable } from '@/components/admin/payments/PaymentQueueTable';
import { QueueStats } from '@/components/admin/payments/QueueStats';
import { QueueControls } from '@/components/admin/payments/QueueControls';
import { QueueMetrics } from '@/components/admin/payments/QueueMetrics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui';
import { Badge } from '@newcondo/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@newcondo/ui';
import { LoadingSpinner } from '@/components/shared/feedback/LoadingSpinner';
import { Clock, TrendingUp, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Payment Queue Management | Admin Dashboard',
  description: 'Monitor and manage payment processing queue',
};

export default function PaymentQueuePage() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Queue Management</h1>
          <p className="text-muted-foreground mt-2">
            Monitor payment processing queue and manage concurrent payment attempts
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Clock className="mr-2 h-4 w-4" />
          Real-time Updates
        </Badge>
      </div>

      {/* Queue Statistics */}
      <Suspense fallback={<LoadingSpinner />}>
        <QueueStats />
      </Suspense>

      {/* Queue Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Controls</CardTitle>
          <CardDescription>
            Manage queue settings and override locks if necessary
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QueueControls />
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            <Users className="mr-2 h-4 w-4" />
            Active Queue
          </TabsTrigger>
          <TabsTrigger value="metrics">
            <TrendingUp className="mr-2 h-4 w-4" />
            Performance Metrics
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="mr-2 h-4 w-4" />
            Queue History
          </TabsTrigger>
        </TabsList>

        {/* Active Queue Tab */}
        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Payment Queue</CardTitle>
              <CardDescription>
                Active payment attempts and their queue positions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<LoadingSpinner />}>
                <PaymentQueueTable filter="active" />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <Suspense fallback={<LoadingSpinner />}>
            <QueueMetrics />
          </Suspense>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Queue History</CardTitle>
              <CardDescription>
                Historical payment queue data and processing times
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<LoadingSpinner />}>
                <PaymentQueueTable filter="history" />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}