"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react";

interface ExportButtonProps {
  onExport: (format: "csv" | "pdf" | "excel") => Promise<void>;
  loading?: boolean;
}

export default function ExportButton({ onExport, loading }: ExportButtonProps) {
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf" | "excel" | null>(null);

  const handleExport = async (format: "csv" | "pdf" | "excel") => {
    setExportFormat(format);
    try {
      await onExport(format);
    } finally {
      setExportFormat(null);
    }
  };

  const isLoading = loading || exportFormat !== null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleExport("csv")}
          disabled={isLoading}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <span>CSV File</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport("excel")}
          disabled={isLoading}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <span>Excel File</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport("pdf")}
          disabled={isLoading}
        >
          <FileText className="mr-2 h-4 w-4" />
          <span>PDF Report</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}