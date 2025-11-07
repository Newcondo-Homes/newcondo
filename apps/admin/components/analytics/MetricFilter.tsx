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
import { Filter } from 'lucide-react';

const metricOptions = [
  { id: 'revenue', label: 'Revenue' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'users', label: 'Users' },
  { id: 'properties', label: 'Properties' },
  { id: 'agents', label: 'Agents' },
  { id: 'commission', label: 'Commission' },
  { id: 'conversion', label: 'Conversion Rate' },
  { id: 'occupancy', label: 'Occupancy Rate' },
];

export default function MetricFilter() {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'revenue',
    'transactions',
    'users',
    'properties',
  ]);

  const toggleMetric = (metricId: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metricId)
        ? prev.filter((id) => id !== metricId)
        : [...prev, metricId]
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Metrics ({selectedMetrics.length})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Select Metrics</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {metricOptions.map((metric) => (
          <DropdownMenuCheckboxItem
            key={metric.id}
            checked={selectedMetrics.includes(metric.id)}
            onCheckedChange={() => toggleMetric(metric.id)}
          >
            {metric.label}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-8"
            onClick={() => setSelectedMetrics(metricOptions.map(m => m.id))}
          >
            Select All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-8"
            onClick={() => setSelectedMetrics([])}
          >
            Clear
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}