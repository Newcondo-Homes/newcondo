// apps/platform/components/marking/JobAssignmentAlert.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@newcondo/ui/card";
import { Button } from "@newcondo/ui/button";
import { Badge } from "@newcondo/ui/badge";
import { 
  Bell, 
  MapPin, 
  DollarSign, 
  Clock, 
  X, 
  CheckCircle,
  AlertCircle 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface JobAssignmentAlertProps {
  job: {
    id: string;
    property: {
      title: string;
      address: string;
      city: string;
      state: string;
    };
    markingFee: number;
    urgencyLevel: string;
    contactPersonName: string;
    createdAt: string;
  };
  onAccept: () => void;
  onDismiss: () => void;
  autoHideAfter?: number; // seconds
  isAccepting?: boolean;
}

export function JobAssignmentAlert({
  job,
  onAccept,
  onDismiss,
  autoHideAfter = 30,
  isAccepting = false,
}: JobAssignmentAlertProps) {
  const [timeLeft, setTimeLeft] = useState(autoHideAfter);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHideAfter <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsVisible(false);
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoHideAfter, onDismiss]);

  if (!isVisible) return null;

  const agentEarnings = job.markingFee * 0.25;
  const urgencyColors = {
    LOW: "bg-gray-100 text-gray-800",
    NORMAL: "bg-blue-100 text-blue-800",
    HIGH: "bg-orange-100 text-orange-800",
    URGENT: "bg-red-100 text-red-800",
  };

  return (
    <div className="fixed top-4 right-4 z-50 w-96 animate-in slide-in-from-right">
      <Card className="border-2 border-primary shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-full animate-pulse">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">New Job Alert!</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              disabled={isAccepting}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Property Info */}
          <div>
            <h4 className="font-semibold line-clamp-2">{job.property.title}</h4>
            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="line-clamp-1">
                {job.property.city}, {job.property.state}
              </span>
            </div>
          </div>

          {/* Earnings Highlight */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  You'll Earn
                </span>
              </div>
              <span className="text-xl font-bold text-green-700">
                ₦{agentEarnings.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Urgency */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Priority Level</span>
            <Badge 
              variant="outline" 
              className={urgencyColors[job.urgencyLevel as keyof typeof urgencyColors]}
            >
              {job.urgencyLevel}
            </Badge>
          </div>

          {/* Contact */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Contact Person</span>
            <span className="font-medium">{job.contactPersonName}</span>
          </div>

          {/* Timer */}
          {autoHideAfter > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-yellow-800">
                  <Clock className="h-4 w-4" />
                  <span>Auto-dismiss in</span>
                </div>
                <span className="font-bold text-yellow-900">{timeLeft}s</span>
              </div>
            </div>
          )}

          {/* Warning for Urgent */}
          {job.urgencyLevel === "URGENT" && (
            <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>Urgent job - quick response required!</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onDismiss}
            disabled={isAccepting}
          >
            Pass
          </Button>
          <Button
            className="flex-1"
            onClick={onAccept}
            disabled={isAccepting}
          >
            {isAccepting ? (
              "Accepting..."
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-1" />
                Accept Job
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}