// apps/platform/components/shared/forms/SearchInput.tsx
'use client'

import React from 'react'
import { Input } from "@newcondo/ui/components/input"
import { Button } from "@newcondo/ui/components/button"
import { Badge } from "@newcondo/ui/components/badge"
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@newcondo/ui/components/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@newcondo/ui/components/popover"
import { cn } from "@/lib/utils"
import { 
  Search, 
  MapPin, 
  X, 
  Clock,
  TrendingUp
} from "lucide-react"

interface SearchSuggestion {
  id: string
  type: 'location' | 'property' | 'recent'
  label: string
  subtitle?: string
  icon?: React.ReactNode
}

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onSearch: (query: string) => void
  placeholder?: string
  suggestions?: SearchSuggestion[]
  recentSearches?: string[]
  popularSearches?: string[]
  className?: string
  showSuggestions?: boolean
  loading?: boolean
  disabled?: boolean
}

export function SearchInput({
  value,
  onChange,
  onSearch,
  placeholder = "Search by location, property type, or area...",
  suggestions = [],
  recentSearches = [],
  popularSearches = [],
  className,
  showSuggestions = true,
  loading = false,
  disabled = false
}: SearchInputProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value)

  React.useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue)
    onChange(newValue)
    
    if (newValue.length > 2) {
      setOpen(true)
    } else {
      setOpen(false)
    }
  }

  const handleSearch = () => {
    if (inputValue.trim()) {
      onSearch(inputValue.trim())
      setOpen(false)
    }
  }

  const handleSelectSuggestion = (suggestion: SearchSuggestion | string) => {
    const searchTerm = typeof suggestion === 'string' ? suggestion : suggestion.label
    setInputValue(searchTerm)
    onChange(searchTerm)
    onSearch(searchTerm)
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const clearSearch = () => {
    setInputValue('')
    onChange('')
    setOpen(false)
  }

  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.label.toLowerCase().includes(inputValue.toLowerCase())
  )

  const filteredRecentSearches = recentSearches.filter(search =>
    search.toLowerCase().includes(inputValue.toLowerCase())
  )

  const filteredPopularSearches = popularSearches.filter(search =>
    search.toLowerCase().includes(inputValue.toLowerCase())
  )

  const hasResults = filteredSuggestions.length > 0 || 
                    filteredRecentSearches.length > 0 || 
                    filteredPopularSearches.length > 0

  return (
    <div className={cn("relative w-full", className)}>
      <Popover open={open && showSuggestions} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => inputValue.length > 2 && setOpen(true)}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                "pl-10 pr-20 h-12 text-base",
                loading && "pr-24"
              )}
            />
            
            {/* Clear button */}
            {inputValue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-12 top-1/2 h-6 w-6 p-0 -translate-y-1/2 hover:bg-transparent"
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            )}

            {/* Search button */}
            <Button
              type="button"
              onClick={handleSearch}
              disabled={disabled || loading || !inputValue.trim()}
              className="absolute right-1 top-1/2 h-10 px-3 -translate-y-1/2"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </PopoverTrigger>

        <PopoverContent 
          className="w-[--radix-popover-trigger-width] p-0" 
          align="start"
          sideOffset={4}
        >
          <Command>
            <CommandList>
              {!hasResults && inputValue.length > 2 && (
                <CommandEmpty>No suggestions found.</CommandEmpty>
              )}

              {/* Location suggestions */}
              {filteredSuggestions.length > 0 && (
                <CommandGroup heading="Locations">
                  {filteredSuggestions.slice(0, 5).map((suggestion) => (
                    <CommandItem
                      key={suggestion.id}
                      onSelect={() => handleSelectSuggestion(suggestion)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2 w-full">
                        {suggestion.icon || <MapPin className="h-4 w-4 text-muted-foreground" />}
                        <div className="flex-1">
                          <div className="font-medium">{suggestion.label}</div>
                          {suggestion.subtitle && (
                            <div className="text-sm text-muted-foreground">
                              {suggestion.subtitle}
                            </div>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Recent searches */}
              {filteredRecentSearches.length > 0 && inputValue.length <= 2 && (
                <CommandGroup heading="Recent searches">
                  {filteredRecentSearches.slice(0, 3).map((search, index) => (
                    <CommandItem
                      key={`recent-${index}`}
                      onSelect={() => handleSelectSuggestion(search)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{search}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Popular searches */}
              {filteredPopularSearches.length > 0 && inputValue.length <= 2 && (
                <CommandGroup heading="Popular searches">
                  {filteredPopularSearches.slice(0, 3).map((search, index) => (
                    <CommandItem
                      key={`popular-${index}`}
                      onSelect={() => handleSelectSuggestion(search)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span>{search}</span>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          Popular
                        </Badge>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Simplified search input without suggestions
export function SimpleSearchInput({
  value,
  onChange,
  onSearch,
  placeholder = "Search...",
  className,
  loading = false,
  disabled = false
}: Pick<SearchInputProps, 'value' | 'onChange' | 'onSearch' | 'placeholder' | 'className' | 'loading' | 'disabled'>) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSearch(value)
    }
  }

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="pl-10 pr-12"
      />
      <Button
        type="button"
        size="sm"
        onClick={() => onSearch(value)}
        disabled={disabled || loading || !value.trim()}
        className="absolute right-1 top-1/2 h-8 px-2 -translate-y-1/2"
      >
        {loading ? (
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <Search className="h-3 w-3" />
        )}
      </Button>
    </div>
  )
}