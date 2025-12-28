// apps/admin/src/components/referrals/ReferralExport.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { referralAdminAPI } from "@/lib/api/referralAdmin";
import { Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ReferralExport() {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<"csv" | "xlsx">("csv");
  const [exportType, setExportType] = useState<"referrals" | "payouts">("referrals");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [includeRewards, setIncludeRewards] = useState(true);
  const [includeTracking, setIncludeTracking] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      setExporting(true);

      if (exportType === "referrals") {
        await referralAdminAPI.exportReferrals({
          format,
          startDate,
          endDate,
        });
      } else {
        await referralAdminAPI.exportPayouts({
          format,
          startDate,
          endDate,
        });
      }

      toast({
        title: "Success",
        description: `${exportType === "referrals" ? "Referrals" : "Payouts"} exported successfully`,
      });

      setOpen(false);
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Configure export settings and download your data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Export Type */}
          <div>
            <Label htmlFor="export-type">Export Type</Label>
            <Select
              value={exportType}
              onValueChange={(value: any) => setExportType(value)}
            >
              <SelectTrigger id="export-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="referrals">Referrals</SelectItem>
                <SelectItem value="payouts">Payouts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Format */}
          <div>
            <Label htmlFor="format">File Format</Label>
            <Select
              value={format}
              onValueChange={(value: any) => setFormat(value)}
            >
              <SelectTrigger id="format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Options (for referrals export) */}
          {exportType === "referrals" && (
            <div className="space-y-3">
              <Label>Include Additional Data</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-rewards"
                  checked={includeRewards}
                  onCheckedChange={(checked) => setIncludeRewards(checked as boolean)}
                />
                <label
                  htmlFor="include-rewards"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Reward information
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-tracking"
                  checked={includeTracking}
                  onCheckedChange={(checked) => setIncludeTracking(checked as boolean)}
                />
                <label
                  htmlFor="include-tracking"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Tracking data (clicks, conversions)
                </label>
              </div>
            </div>
          )}

          {/* Export Info */}
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Export Preview</p>
                <p className="text-muted-foreground">
                  Exporting {exportType} data
                  {startDate && ` from ${new Date(startDate).toLocaleDateString()}`}
                  {endDate && ` to ${new Date(endDate).toLocaleDateString()}`}
                  {!startDate && !endDate && " for all time"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={exporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <>Exporting...</>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}