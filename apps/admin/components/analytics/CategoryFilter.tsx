'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ListFilter } from 'lucide-react';

interface CategoryFilterProps {
  type?: 'property' | 'user' | 'transaction' | 'all';
}

const propertyCategories = [
  { id: 'apartment', label: 'Apartments' },
  { id: 'house', label: 'Houses' },
  { id: 'duplex', label: 'Duplexes' },
  { id: 'room', label: 'Rooms' },
  { id: 'shared', label: 'Shared Apartments' },
];

const userCategories = [
  { id: 'owner', label: 'Property Owners' },
  { id: 'agent', label: 'Agents' },
  { id: 'renter', label: 'Renters' },
];

const transactionCategories = [
  { id: 'rent', label: 'Rent Payments' },
  { id: 'marking', label: 'Property Marking' },
  { id: 'premium', label: 'Premium Subscriptions' },
  { id: 'deposit', label: 'Deposits' },
];

export default function CategoryFilter({ type = 'all' }: CategoryFilterProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const getCategories = () => {
    switch (type) {
      case 'property':
        return propertyCategories;
      case 'user':
        return userCategories;
      case 'transaction':
        return transactionCategories;
      default:
        return [...propertyCategories, ...userCategories, ...transactionCategories];
    }
  };

  const categories = getCategories();

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <ListFilter className="mr-2 h-4 w-4" />
          {selectedCategories.length > 0 
            ? `Filter (${selectedCategories.length})` 
            : 'Filter'
          }
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {categories.map((category) => (
          <DropdownMenuCheckboxItem
            key={category.id}
            checked={selectedCategories.includes(category.id)}
            onCheckedChange={() => toggleCategory(category.id)}
          >
            {category.label}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-8"
            onClick={() => setSelectedCategories(categories.map(c => c.id))}
          >
            Select All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-8"
            onClick={() => setSelectedCategories([])}
          >
            Clear
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}