'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@newcondo/ui/components/ui/card';
import { Button } from '@newcondo/ui/components/ui/button';
import { Badge } from '@newcondo/ui/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@newcondo/ui/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@newcondo/ui/components/ui/popover';
import { Calendar } from '@newcondo/ui/components/ui/calendar';
import { Checkbox } from '@newcondo/ui/components/ui/checkbox';
import {
  Filter,
  Calendar as CalendarIcon,
  X,
  SlidersHorizontal,
  Clock,
  Shield,
  AlertTriangle,
  FileText,
  Users,
  Building
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@newcondo/ui/lib/utils';

// Types from your schema and previous components
export type DocumentStatus = 
  | 'PENDING'
  | 'APPROVED' 
  | 'REJECTED'
  | 'EXPIRED'
  | 'UNDER_REVIEW'
  | 'REQUIRES_SIGNATURE'
  | 'SIGNED'
  | 'VERIFIED'
  | 'INCOMPLETE'
  | 'ARCHIVED';

export type DocumentType = 
  | 'NIN'
  | 'BVN'
  | 'PASSPORT'
  | 'VOTERS_CARD'
  | 'DRIVERS_LICENSE'
  | 'SELFIE'
  | 'OWNERSHIP_DOCUMENT'
  | 'CONSENT_DOCUMENT'
  | 'UNDERTAKING_DOCUMENT'
  | 'BUSINESS_REGISTRATION'
  | 'TAX_CERTIFICATE'
  | 'UTILITY_BILL'
  | 'BANK_STATEMENT'
  | 'OTHER';

export type UserRole = 'OWNER' | 'AGENT' | 'RENTER' | 'ADMIN';
export type UserType = 'LANDLORD' | 'PROPERTY_MANAGER' | 'AGENT' | 'RENTER' | 'ADMIN';

export interface DocumentFilters {
  status: DocumentStatus[];
  documentType: DocumentType[];
  userRole: UserRole[];
  userType: UserType[];
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  expiringWithin: number | null; // days
  isUrgent: boolean | null;
  requiresSignature: boolean | null;
  isDigitallySigned: boolean | null;
  verificationStatus: ('PENDING' | 'VERIFIED' | 'INVALID' | 'EXPIRED')[];
  hasPropertyAssociation: boolean | null;
}

interface LegalDocumentFiltersProps {
  filters: DocumentFilters;
  onFiltersChange: (filters: DocumentFilters) => void;
  documentCounts?: {
    total: number;
    byStatus: Record<DocumentStatus, number>;
    byType: Record<DocumentType, number>;
    urgent: number;
    expiring: number;
  };
  className?: string;
}

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  'NIN': 'NIN',
  'BVN': 'BVN',
  'PASSPORT': 'Passport',
  'VOTERS_CARD': 'Voter\'s Card',
  'DRIVERS_LICENSE': 'Driver\'s License',
  'SELFIE': 'Selfie',
  'OWNERSHIP_DOCUMENT': 'Ownership',
  'CONSENT_DOCUMENT': 'Consent',
  'UNDERTAKING_DOCUMENT': 'Undertaking',
  'BUSINESS_REGISTRATION': 'Business Reg.',
  'TAX_CERTIFICATE': 'Tax Cert.',
  'UTILITY_BILL': 'Utility Bill',
  'BANK_STATEMENT': 'Bank Statement',
  'OTHER': 'Other'
};

const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  'PENDING': 'Pending',
  'APPROVED': 'Approved',
  'REJECTED': 'Rejected',
  'EXPIRED': 'Expired',
  'UNDER_REVIEW': 'Under Review',
  'REQUIRES_SIGNATURE': 'Needs Signature',
  'SIGNED': 'Signed',
  'VERIFIED': 'Verified',
  'INCOMPLETE': 'Incomplete',
  'ARCHIVED': 'Archived'
};

export default function LegalDocumentFilters({
  filters,
  onFiltersChange,
  documentCounts,
  className
}: LegalDocumentFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper function to update filters
  const updateFilters = useCallback((updates: Partial<DocumentFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  }, [filters, onFiltersChange]);

  // Helper for array-based filters (status, documentType, etc.)
  const handleToggleArrayFilter = useCallback(<T,>(key: keyof DocumentFilters, value: T) => {
    const currentArray = filters[key] as T[];
    if (currentArray.includes(value)) {
      updateFilters({ [key]: currentArray.filter(item => item !== value) });
    } else {
      updateFilters({ [key]: [...currentArray, value] });
    }
  }, [filters, updateFilters]);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    onFiltersChange({
      status: [],
      documentType: [],
      userRole: [],
      userType: [],
      dateRange: { from: null, to: null },
      expiringWithin: null,
      isUrgent: null,
      requiresSignature: null,
      isDigitallySigned: null,
      verificationStatus: [],
      hasPropertyAssociation: null,
    });
    setIsExpanded(false);
  }, [onFiltersChange]);

  // Check if any filters are active
  const hasActiveFilters = useCallback(() => {
    return (
      filters.status.length > 0 ||
      filters.documentType.length > 0 ||
      filters.userRole.length > 0 ||
      filters.userType.length > 0 ||
      filters.dateRange.from !== null ||
      filters.dateRange.to !== null ||
      filters.expiringWithin !== null ||
      filters.isUrgent !== null ||
      filters.requiresSignature !== null ||
      filters.isDigitallySigned !== null ||
      filters.verificationStatus.length > 0 ||
      filters.hasPropertyAssociation !== null
    );
  }, [filters]);

  return (
    <Card className={cn("p-4 transition-all duration-300", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          Document Filters
          {hasActiveFilters() && (
            <Badge variant="secondary" className="ml-2">
              <X className="h-3 w-3 mr-1 cursor-pointer" onClick={handleResetFilters} />
              Clear All
            </Badge>
          )}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <SlidersHorizontal className={cn("h-5 w-5 transition-transform", isExpanded ? "rotate-90" : "rotate-0")} />
        </Button>
      </div>

      <div className={cn("grid gap-4 overflow-hidden transition-all duration-300 ease-in-out", isExpanded ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
        <div className="min-h-0 space-y-4">
          {/* Status Filter */}
          <div>
            <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
              <Shield className="h-4 w-4" /> Status
            </h4>
            <div className="flex flex-wrap gap-2">
              {Object.keys(DOCUMENT_STATUS_LABELS).map((status) => (
                <Badge
                  key={status}
                  variant={filters.status.includes(status as DocumentStatus) ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => handleToggleArrayFilter('status', status as DocumentStatus)}
                >
                  {DOCUMENT_STATUS_LABELS[status as DocumentStatus]}
                  {documentCounts?.byStatus[status as DocumentStatus] !== undefined && (
                    <span className="ml-1 opacity-70">
                      ({documentCounts.byStatus[status as DocumentStatus]})
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Document Type Filter */}
          <div>
            <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
              <FileText className="h-4 w-4" /> Document Type
            </h4>
            <div className="flex flex-wrap gap-2">
              {Object.keys(DOCUMENT_TYPE_LABELS).map((type) => (
                <Badge
                  key={type}
                  variant={filters.documentType.includes(type as DocumentType) ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => handleToggleArrayFilter('documentType', type as DocumentType)}
                >
                  {DOCUMENT_TYPE_LABELS[type as DocumentType]}
                  {documentCounts?.byType[type as DocumentType] !== undefined && (
                    <span className="ml-1 opacity-70">
                      ({documentCounts.byType[type as DocumentType]})
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" /> Date Range
            </h4>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !filters.dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange.from ? (
                    filters.dateRange.to ? (
                      <>
                        {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                        {format(filters.dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(filters.dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={filters.dateRange.from || new Date()}
                  selected={filters.dateRange as any}
                  onSelect={(dateRange) => updateFilters({ dateRange: dateRange || { from: null, to: null } })}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Quick Filters */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <Checkbox
                id="urgent-filter"
                checked={filters.isUrgent === true}
                onCheckedChange={(checked) => updateFilters({ isUrgent: checked === 'indeterminate' ? null : checked })}
              />
              <label
                htmlFor="urgent-filter"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Urgent ({documentCounts?.urgent || 0})
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <Checkbox
                id="expiring-filter"
                checked={filters.expiringWithin !== null}
                onCheckedChange={(checked) => updateFilters({ expiringWithin: checked === true ? 30 : null })}
              />
              <label
                htmlFor="expiring-filter"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Expiring Soon ({documentCounts?.expiring || 0})
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <Checkbox
                id="property-association-filter"
                checked={filters.hasPropertyAssociation === true}
                onCheckedChange={(checked) => updateFilters({ hasPropertyAssociation: checked === 'indeterminate' ? null : checked })}
              />
              <label
                htmlFor="property-association-filter"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Has Property Association
              </label>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}