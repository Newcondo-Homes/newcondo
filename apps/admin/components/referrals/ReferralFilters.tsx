// apps/admin/src/components/referrals/ReferralFilters.tsx
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface Filters {
  status: string;
  type: string;
  search: string;
  dateRange: {
    start: string;
    end: string;
  };
}

interface ReferralFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export default function ReferralFilters({
  filters,
  onFiltersChange,
}: ReferralFiltersProps) {
  const handleStatusChange = (value: string) => {
    onFiltersChange({ ...filters, status: value });
  };

  const handleTypeChange = (value: string) => {
    onFiltersChange({ ...filters, type: value });
  };

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleDateChange = (field: "start" | "end", value: string) => {
    onFiltersChange({
      ...filters,
      dateRange: { ...filters.dateRange, [field]: value },
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      status: "",
      type: "",
      search: "",
      dateRange: { start: "", end: "" },
    });
  };

  const hasActiveFilters =
    filters.status || filters.type || filters.search || filters.dateRange.start || filters.dateRange.end;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={filters.status} onValueChange={handleStatusChange}>
            <SelectTrigger id="status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="QUALIFIED">Qualified</SelectItem>
              <SelectItem value="REWARDED">Rewarded</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Type Filter */}
        <div>
          <Label htmlFor="type">Referral Type</Label>
          <Select value={filters.type} onValueChange={handleTypeChange}>
            <SelectTrigger id="type">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="OWNER_TO_OWNER">Owner → Owner</SelectItem>
              <SelectItem value="OWNER_TO_AGENT">Owner → Agent</SelectItem>
              <SelectItem value="OWNER_TO_RENTER">Owner → Renter</SelectItem>
              <SelectItem value="AGENT_TO_OWNER">Agent → Owner</SelectItem>
              <SelectItem value="AGENT_TO_AGENT">Agent → Agent</SelectItem>
              <SelectItem value="AGENT_TO_RENTER">Agent → Renter</SelectItem>
              <SelectItem value="RENTER_TO_RENTER">Renter → Renter</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Start */}
        <div>
          <Label htmlFor="date-start">Start Date</Label>
          <Input
            id="date-start"
            type="date"
            value={filters.dateRange.start}
            onChange={(e) => handleDateChange("start", e.target.value)}
          />
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date Range End */}
        <div>
          <Label htmlFor="date-end">End Date</Label>
          <Input
            id="date-end"
            type="date"
            value={filters.dateRange.end}
            onChange={(e) => handleDateChange("end", e.target.value)}
          />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="flex items-end">
            <Button variant="outline" onClick={handleClearFilters} className="w-full">
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}