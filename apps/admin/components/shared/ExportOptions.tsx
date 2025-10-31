"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ExportOptionsProps {
  onExport: (format: "csv" | "pdf" | "excel") => void;
}

export default function ExportOptions({ onExport }: ExportOptionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => onExport("csv")}>
        <Download className="h-4 w-4 mr-1" />
        CSV
      </Button>
      <Button variant="outline" size="sm" onClick={() => onExport("excel")}>
        <Download className="h-4 w-4 mr-1" />
        Excel
      </Button>
      <Button variant="outline" size="sm" onClick={() => onExport("pdf")}>
        <Download className="h-4 w-4 mr-1" />
        PDF
      </Button>
    </div>
  );
}