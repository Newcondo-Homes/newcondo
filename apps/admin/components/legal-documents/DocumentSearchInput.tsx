"use client";

import { useState, useCallback } from "react";
import { Search, X, Filter } from "lucide-react";
import { Input } from "@newcondo/ui";
import { Button } from "@newcondo/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@newcondo/ui";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@newcondo/ui";
import { Badge } from "@newcondo/ui";
import { DocumentType, DocumentStatus } from "@newcondo/db";
import { useDebounce } from "@/hooks/useDebounce";

interface DocumentSearchFilters {
  query?: string;
  documentType?: DocumentType;
  status?: DocumentStatus;
  userId?: string;
  propertyId?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface DocumentSearchInputProps {
  onSearch: (filters: DocumentSearchFilters) => void;
  loading?: boolean;
  placeholder?: string;
  className?: string;
}

export function DocumentSearchInput({
  onSearch,
  loading = false,
  placeholder = "Search by document number, user name, or property...",
  className = "",
}: DocumentSearchInputProps) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<DocumentSearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  // Trigger search when query or filters change
  const handleSearch = useCallback(() => {
    onSearch({
      ...filters,
      query: debouncedQuery || undefined,
    });
  }, [debouncedQuery, filters, onSearch]);

  // Auto-search when debounced query changes
  useState(() => {
    handleSearch();
  }, [debouncedQuery, filters]);

  const updateFilter = (key: keyof DocumentSearchFilters, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilter = (key: keyof DocumentSearchFilters) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setQuery("");
    setFilters({});
  };

  const activeFilterCount = Object.keys(filters).filter(key => filters[key as keyof DocumentSearchFilters]).length;

  const documentTypeLabels: Record<DocumentType, string> = {
    NIN: "NIN",
    BVN: "BVN",
    PASSPORT: "Passport",
    VOTERS_CARD: "Voter's Card",
    DRIVERS_LICENSE: "Driver's License",
    SELFIE: "Selfie",
    OWNERSHIP_DOCUMENT: "Ownership Document",
    CONSENT_DOCUMENT: "Consent Document",
    UNDERTAKING_DOCUMENT: "Undertaking Document",
    BUSINESS_REGISTRATION: "Business Registration",
    TAX_CERTIFICATE: "Tax Certificate",
    UTILITY_BILL: "Utility Bill",
    BANK_STATEMENT: "Bank Statement",
    OTHER: "Other",
  };

  const statusLabels: Record<DocumentStatus, string> = {
    PENDING: "Pending Review",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    EXPIRED: "Expired",
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-12"
          disabled={loading}
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
            onClick={() => setQuery("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Filters</h4>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-xs h-6 px-2"
                  >
                    Clear all
                  </Button>
                )}
              </div>

              {/* Document Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Document Type</label>
                <Select
                  value={filters.documentType || ""}
                  onValueChange={(value) =>
                    updateFilter("documentType", value || undefined)
                  }
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    {Object.entries(documentTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.status || ""}
                  onValueChange={(value) =>
                    updateFilter("status", value || undefined)
                  }
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    placeholder="From"
                    value={filters.dateFrom || ""}
                    onChange={(e) =>
                      updateFilter("dateFrom", e.target.value || undefined)
                    }
                    className="h-8"
                  />
                  <Input
                    type="date"
                    placeholder="To"
                    value={filters.dateTo || ""}
                    onChange={(e) =>
                      updateFilter("dateTo", e.target.value || undefined)
                    }
                    className="h-8"
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Active Filter Tags */}
        {filters.documentType && (
          <Badge variant="secondary" className="h-6 gap-1">
            {documentTypeLabels[filters.documentType]}
            <Button
              variant="ghost"
              size="sm"
              className="h-3 w-3 p-0 hover:bg-transparent"
              onClick={() => clearFilter("documentType")}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}

        {filters.status && (
          <Badge variant="secondary" className="h-6 gap-1">
            {statusLabels[filters.status]}
            <Button
              variant="ghost"
              size="sm"
              className="h-3 w-3 p-0 hover:bg-transparent"
              onClick={() => clearFilter("status")}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}

        {filters.dateFrom && (
          <Badge variant="secondary" className="h-6 gap-1">
            From: {filters.dateFrom}
            <Button
              variant="ghost"
              size="sm"
              className="h-3 w-3 p-0 hover:bg-transparent"
              onClick={() => clearFilter("dateFrom")}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}

        {filters.dateTo && (
          <Badge variant="secondary" className="h-6 gap-1">
            To: {filters.dateTo}
            <Button
              variant="ghost"
              size="sm"
              className="h-3 w-3 p-0 hover:bg-transparent"
              onClick={() => clearFilter("dateTo")}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}
      </div>
    </div>
  );
}