'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Button } from '@newcondo/ui/components/button';
import { Input } from '@newcondo/ui/components/input';
import { Label } from '@newcondo/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@newcondo/ui/components/select';
import { Textarea } from '@newcondo/ui/components/textarea';
import { Badge } from '@newcondo/ui/components/badge';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';
import { Separator } from '@newcondo/ui/components/separator';
import { RadioGroup, RadioGroupItem } from '@newcondo/ui/components/radio-group';
import { 
  CreditCard, 
  DollarSign, 
  Clock, 
  MapPin, 
  Shield,
  Info,
  CheckCircle,
  Calendar,
  User,
  Phone,
  AlertTriangle
} from 'lucide-react';
import { toast } from '@newcondo/ui/';
import { UrgencyLevel, PaymentStatus } from '@newcondo/db';

interface ContactPerson {
  name: string;
  phone: string;
  accessInstructions?: string;
  preferredTime?: Date;
}

interface MarkingPaymentDetails {
  baseFee: number;
  urgencyMultiplier: number;
  distanceMultiplier: number;
  totalFee: number;
  currency: string;
  estimatedTime: string;
  agentCount: number;
}

interface MarkingPaymentFormProps {
  propertyId: string;
  propertyAddress: string;
  contactPerson: ContactPerson;
  paymentDetails: MarkingPaymentDetails;
  onPaymentSubmit: (paymentData: any) => void;
  isLoading?: boolean;
  className?: string;
}

const URGENCY_LEVELS = [
  {
    value: UrgencyLevel.LOW,
    label: 'Low Priority',
    description: 'Within 5-7 days',
    multiplier: 1.0,
    icon: Clock
  },
  {
    value: UrgencyLevel.NORMAL,
    label: 'Normal Priority',
    description: 'Within 2-3 days',
    multiplier: 1.2,
    icon: Clock
  },
  {
    value: UrgencyLevel.HIGH,
    label: 'High Priority',
    description: 'Within 24 hours',
    multiplier: 1.5,
    icon: Clock
  },
  {
    value: UrgencyLevel.URGENT,
    label: 'Urgent',
    description: 'Within 6 hours',
    multiplier: 2.0,
    icon: Clock
  }
];

const PAYMENT_METHODS = [
  {
    value: 'card',
    label: 'Debit/Credit Card',
    description: 'Visa, Mastercard, Verve',
    icon: CreditCard
  },
  {
    value: 'bank_transfer',
    label: 'Bank Transfer',
    description: 'Direct bank transfer',
    icon: DollarSign
  },
  {
    value: 'ussd',
    label: 'USSD',
    description: '*737# and other USSD codes',
    icon: Phone
  }
];

export default function MarkingPaymentForm({
  propertyId,
  propertyAddress,
  contactPerson,
  paymentDetails,
  onPaymentSubmit,
  isLoading = false,
  className = ''
}: MarkingPaymentFormProps) {
  const [selectedUrgency, setSelectedUrgency] = useState<UrgencyLevel>(UrgencyLevel.NORMAL);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [calculatedFee, setCalculatedFee] = useState(paymentDetails.totalFee);
  const [paymentStep, setPaymentStep] = useState(1);

  const calculateFee = (urgency: UrgencyLevel) => {
    const urgencyConfig = URGENCY_LEVELS.find(level => level.value === urgency);
    if (!urgencyConfig) return paymentDetails.totalFee;

    const baseAmount = paymentDetails.baseFee * paymentDetails.distanceMultiplier;
    return baseAmount * urgencyConfig.multiplier;
  };

  const handleUrgencyChange = (urgency: UrgencyLevel) => {
    setSelectedUrgency(urgency);
    setCalculatedFee(calculateFee(urgency));
  };

  const handlePaymentSubmit = async () => {
    if (!agreeToTerms) {
      toast('Terms and Conditions',{
        description: 'Please agree to the terms and conditions to proceed',
      });
      return;
    }

    const paymentData = {
      propertyId,
      contactPerson,
      urgencyLevel: selectedUrgency,
      paymentMethod: selectedPaymentMethod,
      amount: calculatedFee,
      currency: paymentDetails.currency,
      markingFee: calculatedFee,
      paymentType: 'PROPERTY_MARKING',
      description: `Property marking service for ${propertyAddress}`
    };

    try {
      await onPaymentSubmit(paymentData);
      setPaymentStep(2);
    } catch (error) {
      toast.error('Payment Failed',{
        description: 'Failed to process payment. Please try again.',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: paymentDetails.currency
    }).format(amount);
  };

  const getEstimatedTime = () => {
    const urgencyConfig = URGENCY_LEVELS.find(level => level.value === selectedUrgency);
    return urgencyConfig?.description || 'Within 2-3 days';
  };

  if (paymentStep === 2) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-green-900">Payment Successful!</h3>
                <p className="text-gray-600">Your property marking request has been submitted</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-800">
                  You'll receive a confirmation email shortly with your booking details and agent assignment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Service Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span>Property Marking Service</span>
          </CardTitle>
          <CardDescription>
            Professional property boundary marking and verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Property Address</Label>
              <p className="text-sm text-gray-900">{propertyAddress}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Contact Person</Label>
              <p className="text-sm text-gray-900">{contactPerson.name}</p>
              <p className="text-sm text-gray-500">{contactPerson.phone}</p>
            </div>
          </div>
          {contactPerson.accessInstructions && (
            <div>
              <Label className="text-sm font-medium text-gray-700">Access Instructions</Label>
              <p className="text-sm text-gray-900">{contactPerson.accessInstructions}</p>
            </div>
          )}
          {contactPerson.preferredTime && (
            <div>
              <Label className="text-sm font-medium text-gray-700">Preferred Time</Label>
              <p className="text-sm text-gray-900">
                {new Date(contactPerson.preferredTime).toLocaleString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Urgency Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <span>Service Priority</span>
          </CardTitle>
          <CardDescription>
            Choose your preferred service timeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={selectedUrgency} 
            onValueChange={handleUrgencyChange}
            className="space-y-3"
          >
            {URGENCY_LEVELS.map((level) => {
              const Icon = level.icon;
              const isSelected = selectedUrgency === level.value;
              
              return (
                <div key={level.value} className="space-y-2">
                  <div className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <RadioGroupItem value={level.value} id={level.value} />
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                    <div className="flex-1">
                      <Label htmlFor={level.value} className="cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{level.label}</span>
                          <span className="text-sm text-gray-500">{level.description}</span>
                        </div>
                      </Label>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCurrency(calculateFee(level.value))}
                      </div>
                      {level.multiplier > 1 && (
                        <div className="text-xs text-orange-600">
                          +{Math.round((level.multiplier - 1) * 100)}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-green-600" />
            <span>Payment Method</span>
          </CardTitle>
          <CardDescription>
            Choose your preferred payment method
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={selectedPaymentMethod} 
            onValueChange={setSelectedPaymentMethod}
            className="space-y-3"
          >
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedPaymentMethod === method.value;
              
              return (
                <div key={method.value} className="space-y-2">
                  <div className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <RadioGroupItem value={method.value} id={method.value} />
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                    <div className="flex-1">
                      <Label htmlFor={method.value} className="cursor-pointer">
                        <div className="font-medium">{method.label}</div>
                        <div className="text-sm text-gray-500">{method.description}</div>
                      </Label>
                    </div>
                  </div>
                </div>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Base marking fee</span>
            <span>{formatCurrency(paymentDetails.baseFee)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Distance adjustment</span>
            <span>×{paymentDetails.distanceMultiplier}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Priority adjustment</span>
            <span>×{URGENCY_LEVELS.find(l => l.value === selectedUrgency)?.multiplier || 1}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>{formatCurrency(calculatedFee)}</span>
          </div>
          <div className="text-sm text-gray-500">
            Estimated completion: {getEstimatedTime()}
          </div>
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="terms"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="mt-1"
              />
              <Label htmlFor="terms" className="text-sm cursor-pointer">
                I agree to the <a href="/terms" className="text-blue-600 hover:underline">terms and conditions</a> and understand that:
                <ul className="mt-2 space-y-1 text-gray-600">
                  <li>• Payment is non-refundable once agent is assigned</li>
                  <li>• Property access must be provided at scheduled time</li>
                  <li>• Marking completion is subject to weather conditions</li>
                  <li>• Additional fees may apply for difficult access locations</li>
                </ul>
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button 
          onClick={handlePaymentSubmit}
          disabled={!agreeToTerms || isLoading}
          className="bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          {isLoading ? 'Processing...' : `Pay ${formatCurrency(calculatedFee)}`}
        </Button>
      </div>

      {/* Service Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Service Information:</strong> Our certified agents will arrive at your property 
          to professionally mark the boundaries using GPS technology and create a verified property mask. 
          You'll receive photos and coordinates upon completion.
        </AlertDescription>
      </Alert>
    </div>
  );
}