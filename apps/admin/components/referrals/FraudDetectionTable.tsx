// apps/admin/src/components/referrals/FraudDetectionTable.tsx
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { referralAdminAPI } from "@/lib/api/referralAdmin";
import { AlertTriangle, Eye, Shield, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FraudActivity {
  id: string;
  type: "SUSPICIOUS_PATTERN" | "DUPLICATE_ACCOUNT" | "FAKE_CONVERSION" | "BOT_ACTIVITY";
  userId: string;
  userName: string;
  description: string;
  riskScore: number;
  status: "FLAGGED" | "INVESTIGATING" | "CONFIRMED" | "FALSE_POSITIVE";
  detectedAt: string;
}

interface FraudDetectionTableProps {
  activities: FraudActivity[];
  loading: boolean;
  onRefresh: () => void;
}

export default function FraudDetectionTable({
  activities,
  loading,
  onRefresh,
}: FraudDetectionTableProps) {
  const [selectedActivity, setSelectedActivity] = useState<FraudActivity | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<"CONFIRM" | "DISMISS" | "BLOCK">("CONFIRM");
  const [actionNotes, setActionNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handleAction = async () => {
    if (!selectedActivity) return;

    try {
      setProcessing(true);

      await referralAdminAPI.updateFraudActivity(selectedActivity.id, {
        action: actionType,
        notes: actionNotes,
      });

      toast({
        title: "Success",
        description: `Fraud activity ${actionType.toLowerCase()}ed successfully`,
      });

      setShowActionDialog(false);
      setActionNotes("");
      setSelectedActivity(null);
      onRefresh();
    } catch (error) {
      console.error("Failed to update fraud activity:", error);
      toast({
        title: "Error",
        description: "Failed to update fraud activity",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return "text-red-600";
    if (score >= 50) return "text-orange-600";
    return "text-yellow-600";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "FLAGGED":
        return "bg-yellow-100 text-yellow-800";
      case "INVESTIGATING":
        return "bg-blue-100 text-blue-800";
      case "CONFIRMED":
        return "bg-red-100 text-red-800";
      case "FALSE_POSITIVE":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "SUSPICIOUS_PATTERN":
        return <AlertTriangle className="h-4 w-4" />;
      case "DUPLICATE_ACCOUNT":
        return <Shield className="h-4 w-4" />;
      case "BOT_ACTIVITY":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No fraud activities detected
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Risk Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Detected</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activities.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(activity.type)}
                    <span className="text-sm">
                      {activity.type.replace(/_/g, " ")}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{activity.userName}</p>
                    <p className="text-xs text-muted-foreground">
                      ID: {activity.userId.slice(0, 8)}...
                    </p>
                  </div>
                </TableCell>
                <TableCell className="max-w-xs">
                  <p className="text-sm truncate">{activity.description}</p>
                </TableCell>
                <TableCell>
                  <span className={`font-bold ${getRiskScoreColor(activity.riskScore)}`}>
                    {activity.riskScore}%
                  </span>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(activity.status)}>
                    {activity.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(activity.detectedAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedActivity(activity);
                        setShowDetailsDialog(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {activity.status === "FLAGGED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedActivity(activity);
                          setShowActionDialog(true);
                        }}
                      >
                        Take Action
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Fraud Activity Details</DialogTitle>
            <DialogDescription>
              Detailed information about this fraud detection
            </DialogDescription>
          </DialogHeader>

          {selectedActivity && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p className="font-medium">
                    {selectedActivity.type.replace(/_/g, " ")}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Risk Score</Label>
                  <p className={`font-bold ${getRiskScoreColor(selectedActivity.riskScore)}`}>
                    {selectedActivity.riskScore}%
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">User</Label>
                  <p className="font-medium">{selectedActivity.userName}</p>
                  <p className="text-sm text-muted-foreground">{selectedActivity.userId}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={getStatusColor(selectedActivity.status)}>
                    {selectedActivity.status}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1">{selectedActivity.description}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Detected At</Label>
                <p className="mt-1">
                  {new Date(selectedActivity.detectedAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Take Action on Fraud Activity</DialogTitle>
            <DialogDescription>
              Choose an action and provide notes for this fraud case
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="action-type">Action Type</Label>
              <Select
                value={actionType}
                onValueChange={(value: any) => setActionType(value)}
              >
                <SelectTrigger id="action-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONFIRM">Confirm Fraud</SelectItem>
                  <SelectItem value="DISMISS">Mark as False Positive</SelectItem>
                  <SelectItem value="BLOCK">Block User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="action-notes">Notes</Label>
              <Textarea
                id="action-notes"
                placeholder="Add notes about this action..."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowActionDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button onClick={handleAction} disabled={processing || !actionNotes}>
              {processing ? "Processing..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}