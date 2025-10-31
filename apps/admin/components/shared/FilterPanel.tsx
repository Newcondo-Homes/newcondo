"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FilterPanelProps {
  children: React.ReactNode;
  onReset: () => void;
  title?: string;
}

export default function FilterPanel({ children, onReset, title = "Filters" }: FilterPanelProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button variant="ghost" size="sm" onClick={onReset}>
          <X className="h-4 w-4 mr-1" />
          Reset
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}