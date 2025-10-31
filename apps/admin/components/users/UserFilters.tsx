"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@newcondo/ui/select";
import { Button } from "@newcondo/ui/button";
import { Badge } from "@newcondo/ui/badge";
import { X, Filter } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@newcondo/ui/popover";
import { Label } from "@newcondo/ui/label";
import { Checkbox } from "@newcondo/ui/checkbox";

interface UserFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  role?: string;
  verificationStatus?: string;
  isPremium?: boolean;
  isAvailableForMarking?: boolean;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
}

export function UserFilters({ onFilterChange }: UserFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({});
  const [isOpen, setIsOpen] = useState(false);

  const handleRoleChange = (value: string) => {
    const newFilters = {
      ...filters,
      role: value === "all" ? undefined : value,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleStatusChange = (value: string) => {
    const newFilters = {
      ...filters,
      verificationStatus: value === "all" ? undefined : value,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handlePremiumToggle = (checked: boolean) => {
    const newFilters = {
      ...filters,
      isPremium: checked || undefined,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleMarkingToggle = (checked: boolean) => {
    const newFilters = {
      ...filters,
      isAvailableForMarking: checked || undefined,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const activeFilterCount = Object.keys(filters).filter(
    (key) => filters[key as keyof FilterState] !== undefined
  ).length;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <Select
          value={filters.role || "all"}
          onValueChange={handleRoleChange}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="OWNER">Owner</SelectItem>
            <SelectItem value="AGENT">Agent</SelectItem>
            <SelectItem value="RENTER">Renter</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.verificationStatus || "all"}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="VERIFIED">Verified</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
              {activeFilterCount > 2 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount - 2}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Additional Filters</h4>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="premium"
                  checked={filters.isPremium || false}
                  onCheckedChange={handlePremiumToggle}
                />
                <Label
                  htmlFor="premium"
                  className="text-sm font-normal cursor-pointer"
                >
                  Premium Users Only
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="marking"
                  checked={filters.isAvailableForMarking || false}
                  onCheckedChange={handleMarkingToggle}
                />
                <Label
                  htmlFor="marking"
                  className="text-sm font-normal cursor-pointer"
                >
                  Available for Property Marking
                </Label>
              </div>

              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="w-full"
                >
                  Clear All Filters
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-8"
        >
          <X className="h-4 w-4 mr-1" />
          Clear ({activeFilterCount})
        </Button>
      )}
    </div>
  );
}