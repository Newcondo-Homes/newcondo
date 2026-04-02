'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, AlertTriangle, FileText, Users, Shield, ScrollText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Badge } from '@newcondo/ui/components/badge';
import { Progress } from '@newcondo/ui/components/progress';
import { Separator } from '@newcondo/ui/components/separator';
import { useRouter } from 'next/navigation';
import { DocumentType, UserType } from '@newcondo/db';

interface ComplianceItem {
  id: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
  documentType?: DocumentType;
  icon: React.ComponentType<{ className?: string }>;
  actionUrl?: string;
  status: 'completed' | 'pending' | 'rejected' | 'not_required';
  rejectionReason?: string;
}

interface ComplianceChecklistProps {
  userType: UserType;
  isAgent?: boolean;
  propertyId?: string;
  onItemClick?: (item: ComplianceItem) => void;
  className?: string;
}

export default function ComplianceChecklist({
  userType,
  isAgent = false,
  propertyId,
  onItemClick,
  className = ''
}: ComplianceChecklistProps) {
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Define compliance requirements based on user type and context
  const getComplianceRequirements = (): ComplianceItem[] => {
    const baseItems: ComplianceItem[] = [
      {
        id: 'terms-conditions',
        title: 'Terms & Conditions',
        description: 'Accept platform terms and conditions',
        required: true,
        completed: false,
        icon: ScrollText,
        status: 'pending'
      },
      {
        id: 'privacy-policy',
        title: 'Privacy Policy',
        description: 'Acknowledge privacy policy and data handling',
        required: true,
        completed: false,
        icon: Shield,
        status: 'pending'
      }
    ];

    // Owner-specific requirements
    if (userType === 'LANDLORD' || userType === 'PROPERTY_MANAGER') {
      baseItems.push(
        {
          id: 'ownership-proof',
          title: 'Proof of Ownership',
          description: 'Upload valid property ownership documents',
          required: true,
          completed: false,
          documentType: DocumentType.OWNERSHIP_DOCUMENT,
          icon: FileText,
          actionUrl: '/dashboard/profile/verification',
          status: 'pending'
        },
        {
          id: 'legal-undertaking',
          title: 'Legal Undertaking',
          description: 'Sign legal undertaking document',
          required: true,
          completed: false,
          documentType: DocumentType.UNDERTAKING_DOCUMENT,
          icon: ScrollText,
          status: 'pending'
        }
      );

      // Additional requirements for property managers
      if (userType === 'PROPERTY_MANAGER') {
        baseItems.push({
          id: 'business-registration',
          title: 'Business Registration',
          description: 'Valid business registration certificate',
          required: true,
          completed: false,
          documentType: DocumentType.BUSINESS_REGISTRATION,
          icon: FileText,
          status: 'pending'
        });
      }
    }

    // Agent-specific requirements
    if (isAgent || userType === 'AGENT') {
      baseItems.push(
        {
          id: 'consent-document',
          title: 'Owner Consent',
          description: 'Upload owner consent document for property listing',
          required: true,
          completed: false,
          documentType: DocumentType.CONSENT_DOCUMENT,
          icon: Users,
          actionUrl: `/dashboard/properties/${propertyId}/legal`,
          status: 'pending'
        },
        {
          id: 'agent-agreement',
          title: 'Agent Agreement',
          description: 'Sign agent service agreement',
          required: true,
          completed: false,
          icon: FileText,
          status: 'pending'
        }
      );
    }

    return baseItems;
  };

  // Fetch compliance status from API
  const fetchComplianceStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/legal/compliance-status?userType=${userType}&propertyId=${propertyId || ''}`);
      
      if (response.ok) {
        const data = await response.json();
        const requirements = getComplianceRequirements();
        
        // Update compliance items with actual status from API
        const updatedItems = requirements.map(item => ({
          ...item,
          completed: data.completedItems?.includes(item.id) || false,
          status: data.itemStatuses?.[item.id] || 'pending',
          rejectionReason: data.rejectionReasons?.[item.id]
        }));
        
        setComplianceItems(updatedItems);
      } else {
        // Fallback to default requirements
        setComplianceItems(getComplianceRequirements());
      }
    } catch (error) {
      console.error('Failed to fetch compliance status:', error);
      setComplianceItems(getComplianceRequirements());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplianceStatus();
  }, [userType, propertyId]);

  // Calculate progress
  const requiredItems = complianceItems.filter(item => item.required);
  const completedRequired = requiredItems.filter(item => item.completed);
  const progress = requiredItems.length > 0 ? (completedRequired.length / requiredItems.length) * 100 : 0;

  const handleItemClick = (item: ComplianceItem) => {
    if (onItemClick) {
      onItemClick(item);
      return;
    }

    if (item.actionUrl) {
      router.push(item.actionUrl);
    }
  };

  const getStatusIcon = (status: string, completed: boolean) => {
    if (completed) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    
    switch (status) {
      case 'rejected':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <Circle className="h-5 w-5 text-gray-400" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string, completed: boolean) => {
    if (completed) {
      return <Badge variant="default" className="ml-auto">Completed</Badge>;
    }
    
    switch (status) {
      case 'rejected':
        return <Badge variant="destructive" className="ml-auto">Rejected</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="ml-auto">Pending</Badge>;
      case 'not_required':
        return <Badge variant="outline" className="ml-auto">Not Required</Badge>;
      default:
        return <Badge variant="secondary" className="ml-auto">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Legal Compliance Checklist
        </CardTitle>
        <CardDescription>
          Complete all required legal documents to proceed
        </CardDescription>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-1">
          {complianceItems.map((item, index) => (
            <div key={item.id}>
              <div
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ${
                  item.status === 'rejected' ? 'border-red-200 bg-red-50' : ''
                }`}
                onClick={() => handleItemClick(item)}
              >
                <div className="flex-shrink-0">
                  {getStatusIcon(item.status, item.completed)}
                </div>
                
                <div className="flex-shrink-0">
                  <item.icon className="h-4 w-4 text-gray-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.title}
                    </p>
                    {item.required && (
                      <span className="text-red-500 text-xs">*</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 truncate">
                    {item.description}
                  </p>
                  
                  {item.status === 'rejected' && item.rejectionReason && (
                    <p className="text-xs text-red-600 mt-1">
                      Reason: {item.rejectionReason}
                    </p>
                  )}
                </div>
                
                <div className="flex-shrink-0">
                  {getStatusBadge(item.status, item.completed)}
                </div>
              </div>
              
              {index < complianceItems.length - 1 && (
                <Separator className="my-1" />
              )}
            </div>
          ))}
        </div>
        
        {/* Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {completedRequired.length} of {requiredItems.length} required items completed
            </span>
            {progress === 100 && (
              <Badge variant="default">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                All Complete
              </Badge>
            )}
          </div>
          
          {progress < 100 && (
            <p className="text-xs text-gray-600 mt-2">
              Complete all required items to proceed with property listing
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}