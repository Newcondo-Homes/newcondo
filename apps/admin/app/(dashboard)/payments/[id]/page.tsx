'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PaymentDetails } from '@/components/payments/PaymentDetails';
import { RefundManager } from '@/components/payments/RefundManager';
import { 
  ArrowLeft, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  DollarSign,
  Clock,
  User,
  Building,
  CreditCard,
  Calendar,
  MapPin,
  FileText
} from 'lucide-react';
import { getPaymentById, getPaymentTimeline } from '@/lib/api/payments';

interface PaymentData {
  id: string;
  userId: string;
  rentalId?: string;
  markingJobId?: string;
  amount: number;
  currency: string;
  paymentType: string;
  status: string;
  paymentMethod?: string;
  flutterwaveRef?: string;
  transactionId?: string;
  description?: string;
  failureReason?: string;
  paidAt?: string;
  confirmationPeriodEnd?: string;
  isReleased: boolean;
  releasedAt?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name?: string;
    email: string;
    phone?: string;
  };
  rental?: {
    id: string;
    property: {
      id: string;
      title: string;
      address: string;
      city: string;
      state: string;
    };
    monthlyRent: number;
    startDate: string;
    endDate?: string;
  };
}

interface TimelineEvent {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

const statusColors = {
  SUCCESS: 'bg-green-100 text-green-800 border-green-200',
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  FAILED: 'bg-red-100 text-red-800 border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
  REFUNDED: 'bg-blue-100 text-blue-800 border-blue-200',
  HELD: 'bg-orange-100 text-orange-800 border-orange-200',
  RELEASED: 'bg-purple-100 text-purple-800 border-purple-200'
};

export default function PaymentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const paymentId = params?.id as string;

  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPaymentData = async () => {
    try {
      setRefreshing(true);
      const [paymentData, timelineData] = await Promise.all([
        getPaymentById(paymentId),
        getPaymentTimeline(paymentId)
      ]);
      setPayment(paymentData);
      setTimeline(timelineData);
    } catch (error) {
      console.error('Error fetching payment data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (paymentId) {
      fetchPaymentData();
    }
  }, [paymentId]);

  const handleRefresh = () => {
    fetchPaymentData();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'FAILED':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Payments
        </Button>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Payment not found or you don't have permission to view it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Payment Details
            </h1>
            <p className="text-muted-foreground">
              Payment ID: {payment.id}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Payment Status Alert */}
      {payment.status === 'FAILED' && payment.failureReason && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Payment Failed:</strong> {payment.failureReason}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Payment Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Status</span>
              <div className="flex items-center space-x-2">
                {getStatusIcon(payment.status)}
                <Badge 
                  variant="outline"
                  className={statusColors[payment.status as keyof typeof statusColors]}
                >
                  {payment.status}
                </Badge>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-medium">Amount</span>
              <span className="text-lg font-bold">
                {payment.currency} {payment.amount.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-medium">Type</span>
              <Badge variant="secondary">{payment.paymentType}</Badge>
            </div>

            {payment.paymentMethod && (
              <div className="flex justify-between items-center">
                <span className="font-medium">Method</span>
                <div className="flex items-center space-x-1">
                  <CreditCard className="h-4 w-4" />
                  <span>{payment.paymentMethod}</span>
                </div>
              </div>
            )}

            {payment.transactionId && (
              <div className="flex justify-between items-center">
                <span className="font-medium">Transaction ID</span>
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {payment.transactionId}
                </code>
              </div>
            )}

            {payment.flutterwaveRef && (
              <div className="flex justify-between items-center">
                <span className="font-medium">Flutterwave Ref</span>
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {payment.flutterwaveRef}
                </code>
              </div>
            )}

            <Separator />

            <div className="flex justify-between items-center">
              <span className="font-medium">Created</span>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(payment.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {payment.paidAt && (
              <div className="flex justify-between items-center">
                <span className="font-medium">Paid At</span>
                <span>{new Date(payment.paidAt).toLocaleString()}</span>
              </div>
            )}

            {payment.description && (
              <div>
                <span className="font-medium">Description</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {payment.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Customer Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Name</span>
              <span>{payment.user.name || 'N/A'}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-medium">Email</span>
              <a 
                href={`mailto:${payment.user.email}`}
                className="text-blue-600 hover:underline"
              >
                {payment.user.email}
              </a>
            </div>

            {payment.user.phone && (
              <div className="flex justify-between items-center">
                <span className="font-medium">Phone</span>
                <a 
                  href={`tel:${payment.user.phone}`}
                  className="text-blue-600 hover:underline"
                >
                  {payment.user.phone}
                </a>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="font-medium">User ID</span>
              <code className="text-sm bg-muted px-2 py-1 rounded">
                {payment.user.id}
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Rental Information (if applicable) */}
        {payment.rental && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Rental Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <span className="font-medium">Property</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    {payment.rental.property.title}
                  </p>
                </div>

                <div>
                  <span className="font-medium">Monthly Rent</span>
                  <p className="text-sm font-medium mt-1">
                    ₦{payment.rental.monthlyRent.toLocaleString()}
                  </p>
                </div>

                <div>
                  <span className="font-medium flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>Address</span>
                  </span>
                  <p className="text-sm text-muted-foreground mt-1">
                    {payment.rental.property.address}, {payment.rental.property.city}, {payment.rental.property.state}
                  </p>
                </div>

                <div>
                  <span className="font-medium">Rental Period</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(payment.rental.startDate).toLocaleDateString()} - 
                    {payment.rental.endDate ? new Date(payment.rental.endDate).toLocaleDateString() : 'Ongoing'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Details Component */}
        <div className="md:col-span-2">
          <PaymentDetails 
            payment={payment} 
            timeline={timeline}
            onRefresh={handleRefresh}
          />
        </div>

        {/* Refund Manager (if applicable) */}
        {(payment.status === 'SUCCESS' || payment.status === 'HELD') && (
          <div className="md:col-span-2">
            <RefundManager 
              payment={payment}
              onRefresh={handleRefresh}
            />
          </div>
        )}
      </div>
    </div>
  );
}