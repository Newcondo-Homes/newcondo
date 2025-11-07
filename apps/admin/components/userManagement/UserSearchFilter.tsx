"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
  Search, 
  Filter, 
  X, 
  Calendar as CalendarIcon,
  SlidersHorizontal
} from 'lucide-react';
import { format } from 'date-fns';

export interface UserFilters {
  search?: string;
  role?: string;
  verificationStatus?: string;
  isPremium?: boolean;
  isB2BCustomer?: boolean;
  registeredAfter?: Date;
  registeredBefore?: Date;
  city?: string;
  state?: string;
}

interface UserSearchFilterProps {
  filters: UserFilters;
  onFiltersChange: (filters: UserFilters) => void;
  onSearch: () => void;
  activeFiltersCount: number;
}

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi',
  'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
  'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'FCT'
];

export default function UserSearchFilter({
  filters,
  onFiltersChange,
  onSearch,
  activeFiltersCount
}: UserSearchFilterProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localFilters, setLocalFilters] = useState<UserFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof UserFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilter = (key: keyof UserFilters) => {
    const newFilters = { ...localFilters };
    delete newFilters[key];
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    setLocalFilters({});
    onFiltersChange({});
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Input Row */}
            <div className="flex gap-3">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, phone, or user ID..."
                  className="pl-10"
                  value={localFilters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="default" className="ml-2">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              <Select
                value={localFilters.role || 'all'}
                onValueChange={(value) => 
                  handleFilterChange('role', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Role" />
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
                value={localFilters.verificationStatus || 'all'}
                onValueChange={(value) => 
                  handleFilterChange('verificationStatus', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Verification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant={localFilters.isPremium ? "default" : "outline"}
                size="sm"
                onClick={() => 
                  handleFilterChange('isPremium', localFilters.isPremium ? undefined : true)
                }
              >
                Premium Users
              </Button>

              <Button
                type="button"
                variant={localFilters.isB2BCustomer ? "default" : "outline"}
                size="sm"
                onClick={() => 
                  handleFilterChange('isB2BCustomer', localFilters.isB2BCustomer ? undefined : true)
                }
              >
                B2B Customers
              </Button>

              {activeFiltersCount > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      {showAdvanced && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Advanced Filters
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Location Filters */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">State</label>
                  <Select
                    value={localFilters.state || 'all'}
                    onValueChange={(value) => 
                      handleFilterChange('state', value === 'all' ? undefined : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States</SelectItem>
                      {NIGERIAN_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">City</label>
                  <Input
                    placeholder="Enter city"
                    value={localFilters.city || ''}
                    onChange={(e) => handleFilterChange('city', e.target.value || undefined)}
                  />
                </div>

                {/* Date Range Filters */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Registered After</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.registeredAfter ? 
                          format(localFilters.registeredAfter, 'PP') : 
                          'Pick a date'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={localFilters.registeredAfter}
                        onSelect={(date) => handleFilterChange('registeredAfter', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Registered Before</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.registeredBefore ? 
                          format(localFilters.registeredBefore, 'PP') : 
                          'Pick a date'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={localFilters.registeredBefore}
                        onSelect={(date) => handleFilterChange('registeredBefore', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {localFilters.role && (
            <Badge variant="secondary" className="gap-2">
              Role: {localFilters.role}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => clearFilter('role')}
              />
            </Badge>
          )}
          
          {localFilters.verificationStatus && (
            <Badge variant="secondary" className="gap-2">
              Status: {localFilters.verificationStatus}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => clearFilter('verificationStatus')}
              />
            </Badge>
          )}
          
          {localFilters.isPremium && (
            <Badge variant="secondary" className="gap-2">
              Premium
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => clearFilter('isPremium')}
              />
            </Badge>
          )}
          
          {localFilters.isB2BCustomer && (
            <Badge variant="secondary" className="gap-2">
              B2B Customer
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => clearFilter('isB2BCustomer')}
              />
            </Badge>
          )}
          
          {localFilters.state && (
            <Badge variant="secondary" className="gap-2">
              State: {localFilters.state}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => clearFilter('state')}
              />
            </Badge>
          )}
          
          {localFilters.city && (
            <Badge variant="secondary" className="gap-2">
              City: {localFilters.city}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => clearFilter('city')}
              />
            </Badge>
          )}
          
          {localFilters.registeredAfter && (
            <Badge variant="secondary" className="gap-2">
              After: {format(localFilters.registeredAfter, 'PP')}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => clearFilter('registeredAfter')}
              />
            </Badge>
          )}
          
          {localFilters.registeredBefore && (
            <Badge variant="secondary" className="gap-2">
              Before: {format(localFilters.registeredBefore, 'PP')}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => clearFilter('registeredBefore')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}