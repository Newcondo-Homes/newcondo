'use client';

import React, { useState } from 'react';
import { Button } from '@newcondo/ui/components/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@newcondo/ui/components/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@newcondo/ui/components/card';
import { Badge } from '@newcondo/ui/components/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@newcondo/ui/components/tabs';
import { ScrollArea } from '@newcondo/ui/components/scroll-area';
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  Building, 
  Scale,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink
} from 'lucide-react';

type DocumentTemplateType = 
  | 'UNDERTAKING' 
  | 'CONSENT' 
  | 'OWNERSHIP_PROOF' 
  | 'AGENT_PERMISSION' 
  | 'TERMS_CONDITIONS' 
  | 'PRIVACY_POLICY';

interface DocumentTemplateViewerProps {
  templateType: DocumentTemplateType;
  onClose?: () => void;
  onDownload?: (templateType: DocumentTemplateType) => void;
  onUseTemplate?: (templateType: DocumentTemplateType) => void;
  previewOnly?: boolean;
}

interface TemplateConfig {
  title: string;
  description: string;
  category: string;
  version: string;
  lastUpdated: string;
  requiredFields: string[];
  legalImplications: string[];
  downloadUrl: string;
  previewContent: {
    sections: {
      title: string;
      content: string;
      isRequired: boolean;
    }[];
  };
}

const templateConfigs: Record<DocumentTemplateType, TemplateConfig> = {
  UNDERTAKING: {
    title: 'Legal Undertaking Document',
    description: 'A legally binding document that certifies the accuracy of property information provided.',
    category: 'Legal Compliance',
    version: '2.1',
    lastUpdated: '2024-01-15',
    requiredFields: [
      'Full Legal Name',
      'Address',
      'Phone Number', 
      'Property Address',
      'Relationship to Property',
      'Witness Information',
      'Digital Signature'
    ],
    legalImplications: [
      'Legally binding commitment to information accuracy',
      'Potential liability for false or misleading information',
      'Subject to applicable property and contract laws',
      'May be used in legal proceedings if disputes arise'
    ],
    downloadUrl: '/templates/undertaking-template.pdf',
    previewContent: {
      sections: [
        {
          title: 'Declaration of Undertaking',
          content: 'I, [FULL_NAME], hereby undertake and declare that all information provided regarding the property located at [PROPERTY_ADDRESS] is true, accurate, and complete to the best of my knowledge.',
          isRequired: true
        },
        {
          title: 'Property Relationship',
          content: 'I confirm that my relationship to the above-mentioned property is as follows: [RELATIONSHIP_TYPE]. I have the legal authority to provide information about this property.',
          isRequired: true
        },
        {
          title: 'Accuracy Commitment',
          content: 'I understand and acknowledge that providing false, misleading, or incomplete information may result in legal consequences, including but not limited to contract termination and potential legal action.',
          isRequired: true
        },
        {
          title: 'Witness Declaration',
          content: 'This document has been witnessed by [WITNESS_NAME], who can be contacted at [WITNESS_CONTACT]. The witness confirms the identity of the declarant.',
          isRequired: true
        },
        {
          title: 'Digital Signature',
          content: 'By digitally signing this document, I acknowledge that this electronic signature has the same legal effect as a handwritten signature.',
          isRequired: true
        }
      ]
    }
  },
  CONSENT: {
    title: 'Property Consent Document',
    description: 'Consent form for property agents to list and manage properties on behalf of owners.',
    category: 'Authorization',
    version: '1.8',
    lastUpdated: '2024-01-10',
    requiredFields: [
      'Property Owner Name',
      'Agent Name',
      'Property Details',
      'Authorization Scope',
      'Duration of Consent',
      'Commission Terms'
    ],
    legalImplications: [
      'Grants legal authority to agent for property listing',
      'Defines scope of agent responsibilities and limitations',
      'Establishes commission and fee structures',
      'Creates binding agreement between owner and agent'
    ],
    downloadUrl: '/templates/consent-template.pdf',
    previewContent: {
      sections: [
        {
          title: 'Consent to List Property',
          content: 'I, [OWNER_NAME], being the lawful owner of the property located at [PROPERTY_ADDRESS], hereby give consent to [AGENT_NAME] to list, market, and manage rental inquiries for the above-mentioned property.',
          isRequired: true
        },
        {
          title: 'Scope of Authorization',
          content: 'The agent is authorized to: (1) Advertise the property on approved platforms, (2) Show the property to prospective tenants, (3) Collect initial deposits and documentation, (4) Negotiate rental terms within agreed parameters.',
          isRequired: true
        },
        {
          title: 'Commission and Fees',
          content: 'The agent shall receive a commission of [COMMISSION_RATE]% of the annual rent for successfully securing a tenant, payable upon lease signing and first rent payment.',
          isRequired: true
        },
        {
          title: 'Duration and Termination',
          content: 'This consent is valid for [DURATION] months from the date of signing and may be terminated by either party with [NOTICE_PERIOD] days written notice.',
          isRequired: true
        }
      ]
    }
  },
  OWNERSHIP_PROOF: {
    title: 'Proof of Ownership Template',
    description: 'Template for documenting proof of property ownership.',
    category: 'Verification',
    version: '1.5',
    lastUpdated: '2024-01-12',
    requiredFields: [
      'Property Owner Details',
      'Property Description',
      'Title Document Reference',
      'Purchase/Inheritance Details',
      'Supporting Documents'
    ],
    legalImplications: [
      'Establishes legal ownership claim',
      'Required for property transactions',
      'Subject to title verification processes',
      'May require notarization or legal attestation'
    ],
    downloadUrl: '/templates/ownership-proof-template.pdf',
    previewContent: {
      sections: [
        {
          title: 'Property Ownership Declaration',
          content: 'I, [OWNER_NAME], hereby declare that I am the lawful owner of the property described as [PROPERTY_DESCRIPTION] located at [PROPERTY_ADDRESS].',
          isRequired: true
        },
        {
          title: 'Title Information',
          content: 'The property is held under Title Document Number: [TITLE_NUMBER], registered at [REGISTRY_LOCATION] on [REGISTRATION_DATE].',
          isRequired: true
        },
        {
          title: 'Acquisition Details',
          content: 'The property was acquired through [ACQUISITION_METHOD] on [ACQUISITION_DATE] from [PREVIOUS_OWNER/SOURCE].',
          isRequired: true
        },
        {
          title: 'Supporting Documentation',
          content: 'Attached herewith are copies of: (1) Certificate of Occupancy, (2) Survey Plan, (3) Purchase Agreement/Deed of Assignment, (4) Tax Receipts.',
          isRequired: false
        }
      ]
    }
  },
  AGENT_PERMISSION: {
    title: 'Agent Permission Form',
    description: 'Authorization form for real estate agents to operate on the platform.',
    category: 'Professional Authorization',
    version: '2.0',
    lastUpdated: '2024-01-08',
    requiredFields: [
      'Agent Credentials',
      'License Information',
      'Professional References',
      'Insurance Details',
      'Code of Conduct Acceptance'
    ],
    legalImplications: [
      'Establishes professional credentials',
      'Creates accountability for agent actions',
      'Defines platform usage terms for agents',
      'Establishes dispute resolution procedures'
    ],
    downloadUrl: '/templates/agent-permission-template.pdf',
    previewContent: {
      sections: [
        {
          title: 'Professional Credentials',
          content: 'I, [AGENT_NAME], am a licensed real estate professional with License Number [LICENSE_NUMBER] issued by [LICENSING_AUTHORITY] and valid until [EXPIRY_DATE].',
          isRequired: true
        },
        {
          title: 'Platform Authorization',
          content: 'I request permission to operate as a real estate agent on the NewCondo platform and agree to abide by all platform policies, procedures, and code of conduct.',
          isRequired: true
        },
        {
          title: 'Professional Insurance',
          content: 'I maintain professional indemnity insurance with [INSURANCE_PROVIDER], Policy Number [POLICY_NUMBER], covering professional liabilities up to [COVERAGE_AMOUNT].',
          isRequired: true
        },
        {
          title: 'Code of Conduct',
          content: 'I commit to maintaining the highest standards of professional conduct, including honest dealings, client confidentiality, and compliance with all applicable laws and regulations.',
          isRequired: true
        }
      ]
    }
  },
  TERMS_CONDITIONS: {
    title: 'Terms and Conditions',
    description: 'Platform terms of service and user agreement.',
    category: 'Legal Agreement',
    version: '3.2',
    lastUpdated: '2024-01-20',
    requiredFields: [
      'User Acceptance',
      'Platform Usage Rules',
      'Privacy Acknowledgment',
      'Limitation of Liability'
    ],
    legalImplications: [
      'Creates binding agreement between user and platform',
      'Defines rights and responsibilities of all parties',
      'Establishes dispute resolution mechanisms',
      'Contains limitation of liability clauses'
    ],
    downloadUrl: '/templates/terms-conditions.pdf',
    previewContent: {
      sections: [
        {
          title: 'Acceptance of Terms',
          content: 'By using the NewCondo platform, you agree to be bound by these Terms and Conditions and our Privacy Policy.',
          isRequired: true
        },
        {
          title: 'Platform Usage',
          content: 'Users must provide accurate information, respect intellectual property rights, and use the platform only for lawful purposes.',
          isRequired: true
        },
        {
          title: 'User Responsibilities',
          content: 'Users are responsible for maintaining account security, ensuring information accuracy, and complying with all applicable laws.',
          isRequired: true
        },
        {
          title: 'Limitation of Liability',
          content: 'NewCondo\'s liability is limited as set forth in the full terms document. Users acknowledge the inherent risks in property transactions.',
          isRequired: true
        }
      ]
    }
  },
  PRIVACY_POLICY: {
    title: 'Privacy Policy',
    description: 'Data protection and privacy policy for the platform.',
    category: 'Privacy Compliance',
    version: '2.8',
    lastUpdated: '2024-01-20',
    requiredFields: [
      'Data Collection',
      'Data Usage',
      'Data Sharing',
      'User Rights',
      'Security Measures'
    ],
    legalImplications: [
      'Governs the collection and use of personal data',
      'Ensures compliance with data protection laws',
      'Informs users of their rights regarding their data',
      'Establishes accountability for data breaches'
    ],
    downloadUrl: '/templates/privacy-policy.pdf',
    previewContent: {
      sections: [
        {
          title: 'Information Collection',
          content: 'We collect information you provide directly to us, such as your name, email address, phone number, and any information related to properties you list or inquire about.',
          isRequired: true
        },
        {
          title: 'Use of Information',
          content: 'The information we collect is used to provide, maintain, and improve our services, process transactions, and communicate with you about your account and our services.',
          isRequired: true
        },
        {
          title: 'Data Sharing',
          content: 'We do not share your personal information with third parties except as necessary to provide our services, comply with legal obligations, or with your explicit consent.',
          isRequired: true
        },
        {
          title: 'User Rights',
          content: 'You have the right to access, correct, or delete your personal data. You may also have the right to object to or restrict certain processing activities.',
          isRequired: true
        },
        {
          title: 'Data Security',
          content: 'We implement robust security measures to protect your information from unauthorized access, alteration, disclosure, or destruction.',
          isRequired: true
        }
      ]
    }
  }
};

const TemplateSection: React.FC<{ title: string; content: string; isRequired: boolean }> = ({ title, content, isRequired }) => (
  <div className="space-y-1 mb-4">
    <h4 className="flex items-center gap-2 text-md font-semibold text-gray-800 dark:text-gray-200">
      {title}
      {isRequired && <Badge variant="secondary">Required</Badge>}
    </h4>
    <p className="text-sm text-gray-600 dark:text-gray-400">{content}</p>
  </div>
);

export function DocumentTemplateViewer({
  templateType,
  onClose,
  onDownload,
  onUseTemplate,
  previewOnly = false,
}: DocumentTemplateViewerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const config = templateConfigs[templateType];
  const [activeTab, setActiveTab] = useState('preview');

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open && onClose) {
      onClose();
    }
  };

  const renderContent = () => {
    if (!config) {
      return (
        <div className="text-center p-8">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-lg font-medium">Template Not Found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            The requested document template could not be found.
          </p>
        </div>
      );
    }

    return (
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" /> Preview
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Details
          </TabsTrigger>
          <TabsTrigger value="legal" className="flex items-center gap-2">
            <Scale className="h-4 w-4" /> Legal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Document Preview</CardTitle>
              <CardDescription>
                A quick look at the content of the {config.title} template.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] rounded-md border p-4">
                <div className="space-y-4">
                  <div className="text-center font-bold text-lg mb-4">{config.title.toUpperCase()}</div>
                  {config.previewContent.sections.map((section, index) => (
                    <TemplateSection key={index} {...section} />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Template Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium"><Calendar className="h-4 w-4" /> Version: <Badge variant="outline">{config.version}</Badge></div>
                <div className="flex items-center gap-2 text-sm font-medium"><Clock className="h-4 w-4" /> Last Updated: <Badge variant="outline">{config.lastUpdated}</Badge></div>
                <div className="flex items-center gap-2 text-sm font-medium"><Building className="h-4 w-4" /> Category: <Badge variant="outline">{config.category}</Badge></div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> Required Information:</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground pl-4">
                  {config.requiredFields.map((field, index) => (
                    <li key={index}>{field}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Legal Implications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="list-disc list-inside text-sm text-muted-foreground pl-4">
                {config.legalImplications.map((implication, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                    <span>{implication}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{config?.title || 'Document Template'}</DialogTitle>
          <DialogDescription>
            {config?.description || 'View the details and content of this legal document template.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {renderContent()}
        </div>

        {!previewOnly && (
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => onDownload?.(templateType)}>
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
            {onUseTemplate && (
              <Button onClick={() => onUseTemplate(templateType)}>
                <ExternalLink className="h-4 w-4 mr-2" /> Use Template
              </Button>
            )}
            <Button onClick={() => handleOpenChange(false)} variant="secondary">
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}