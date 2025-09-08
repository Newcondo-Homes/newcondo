'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, MapPin, Calendar, Users, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@newcondo/ui/button';
import { Input } from '@newcondo/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@newcondo/ui/popover';
import { Calendar as CalendarComponent } from '@newcondo/ui/calendar';
import { cn } from '@newcondo/ui/utils';
import { format } from 'date-fns';

interface SearchBoxProps {
  className?: string;
  variant?: 'default' | 'compact' | 'hero';
  showFilters?: boolean;
  onSearch?: (params: SearchParams) => void;
}

interface SearchParams {
  location?: string;
  checkIn?: Date;
  checkOut?: Date;
  guests?: number;
  propertyType?: string;
  priceRange?: [number, number];
}

const SearchBox: React.FC<SearchBoxProps> = ({
  className,
  variant = 'default',
  showFilters = true,
  onSearch,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Search state
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [checkIn, setCheckIn] = useState<Date | undefined>(
    searchParams.get('checkIn') ? new Date(searchParams.get('checkIn')!) : undefined
  );
  const [checkOut, setCheckOut] = useState<Date | undefined>(
    searchParams.get('checkOut') ? new Date(searchParams.get('checkOut')!) : undefined
  );
  const [guests, setGuests] = useState(parseInt(searchParams.get('guests') || '1'));
  const [showGuestPicker, setShowGuestPicker] = useState(false);

  // Location suggestions (mock data - replace with actual API)
  const locationSuggestions = [
    { id: '1', name: 'Lagos, Nigeria', type: 'city' },
    { id: '2', name: 'Abuja, Nigeria', type: 'city' },
    { id: '3', name: 'Port Harcourt, Nigeria', type: 'city' },
    { id: '4', name: 'Kano, Nigeria', type: 'city' },
    { id: '5', name: 'Ibadan, Nigeria', type: 'city' },
  ];

  const filteredSuggestions = locationSuggestions.filter((suggestion) =>
    suggestion.name.toLowerCase().includes(location.toLowerCase())
  );

  // Handle search submission
  const handleSearch = () => {
    const params = new URLSearchParams();
    
    if (location) params.set('location', location);
    if (checkIn) params.set('checkIn', checkIn.toISOString());
    if (checkOut) params.set('checkOut', checkOut.toISOString());
    if (guests > 1) params.set('guests', guests.toString());

    const searchQuery = params.toString();
    const url = searchQuery ? `/properties?${searchQuery}` : '/properties';
    
    router.push(url);
    
    if (onSearch) {
      onSearch({
        location,
        checkIn,
        checkOut,
        guests,
      });
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setActiveField(null);
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isHeroVariant = variant === 'hero';
  const isCompactVariant = variant === 'compact';

  return (
    <div
      ref={searchRef}
      className={cn(
        'relative w-full max-w-4xl mx-auto',
        isHeroVariant && 'px-4 sm:px-6 lg:px-8',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center bg-white rounded-full shadow-lg border transition-all duration-200',
          isExpanded ? 'shadow-xl' : 'hover:shadow-xl',
          isHeroVariant && 'p-2',
          isCompactVariant && 'p-1',
          !isCompactVariant && !isHeroVariant && 'p-2'
        )}
      >
        {/* Location Input */}
        <div className="flex-1 relative">
          <div
            className={cn(
              'flex items-center px-4 py-3 cursor-text rounded-full transition-colors',
              activeField === 'location' && 'bg-gray-50'
            )}
            onClick={() => {
              setActiveField('location');
              setIsExpanded(true);
            }}
          >
            <MapPin className="h-4 w-4 text-gray-400 mr-3" />
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Where
              </div>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Search destinations"
                className="border-0 p-0 h-auto text-sm font-medium bg-transparent focus-visible:ring-0"
                onFocus={() => {
                  setActiveField('location');
                  setIsExpanded(true);
                }}
              />
            </div>
          </div>

          {/* Location Suggestions */}
          {activeField === 'location' && location && (
            <div className="absolute top-full left-0 right-0 bg-white rounded-lg shadow-lg border mt-2 py-2 z-50">
              {filteredSuggestions.length > 0 ? (
                filteredSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center"
                    onClick={() => {
                      setLocation(suggestion.name);
                      setActiveField(null);
                    }}
                  >
                    <MapPin className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-sm">{suggestion.name}</span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-2 text-sm text-gray-500">No destinations found</div>
              )}
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-gray-200" />

        {/* Check-in Date */}
        <Popover>
          <PopoverTrigger asChild>
            <div
              className={cn(
                'flex items-center px-4 py-3 cursor-pointer rounded-full transition-colors',
                activeField === 'checkin' && 'bg-gray-50'
              )}
              onClick={() => setActiveField('checkin')}
            >
              <Calendar className="h-4 w-4 text-gray-400 mr-3" />
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Check in
                </div>
                <div className="text-sm font-medium">
                  {checkIn ? format(checkIn, 'MMM dd') : 'Add dates'}
                </div>
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={checkIn}
              onSelect={setCheckIn}
              disabled={(date) => date < new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <div className="h-8 w-px bg-gray-200" />

        {/* Check-out Date */}
        <Popover>
          <PopoverTrigger asChild>
            <div
              className={cn(
                'flex items-center px-4 py-3 cursor-pointer rounded-full transition-colors',
                activeField === 'checkout' && 'bg-gray-50'
              )}
              onClick={() => setActiveField('checkout')}
            >
              <Calendar className="h-4 w-4 text-gray-400 mr-3" />
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Check out
                </div>
                <div className="text-sm font-medium">
                  {checkOut ? format(checkOut, 'MMM dd') : 'Add dates'}
                </div>
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={checkOut}
              onSelect={setCheckOut}
              disabled={(date) => date < (checkIn || new Date())}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <div className="h-8 w-px bg-gray-200" />

        {/* Guests */}
        <Popover open={showGuestPicker} onOpenChange={setShowGuestPicker}>
          <PopoverTrigger asChild>
            <div
              className={cn(
                'flex items-center px-4 py-3 cursor-pointer rounded-full transition-colors',
                activeField === 'guests' && 'bg-gray-50'
              )}
              onClick={() => {
                setActiveField('guests');
                setShowGuestPicker(true);
              }}
            >
              <Users className="h-4 w-4 text-gray-400 mr-3" />
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Who
                </div>
                <div className="text-sm font-medium">
                  {guests === 1 ? '1 guest' : `${guests} guests`}
                </div>
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Guests</div>
                  <div className="text-sm text-gray-500">Ages 13 or above</div>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    disabled={guests <= 1}
                  >
                    -
                  </Button>
                  <span className="text-sm font-medium w-8 text-center">{guests}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGuests(guests + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          className={cn(
            'ml-2 rounded-full px-4',
            isHeroVariant && 'h-12 px-6',
            isCompactVariant && 'h-8 px-3'
          )}
        >
          <Search className={cn('h-4 w-4', !isCompactVariant && 'mr-2')} />
          {!isCompactVariant && 'Search'}
        </Button>
      </div>

      {/* Quick Filters */}
      {showFilters && isExpanded && (
        <div className="absolute top-full left-0 right-0 bg-white rounded-lg shadow-lg border mt-2 p-4 z-40">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Quick Filters</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['Apartment', 'House', 'Duplex', 'Room'].map((type) => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                className="justify-start"
              >
                {type}
              </Button>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              More filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBox;