// apps/platform/components/marking/QueuePosition.tsx
"use client";

import { Card } from "@newcondo/ui/card";
import { Progress } from "@newcondo/ui/progress";
import { Badge } from "@newcondo/ui/badge";
import { Users, Clock, AlertCircle } from "lucide-react";
import { QueueTimer } from "./QueueTimer";

interface QueuePositionProps {
  position: number;
  totalInQueue?: number;
  timeSlotExpiry?: string;
  status: "QUEUED" | "ASSIGNED" | "IN_PROGRESS";
  estimatedWaitTime?: number; // in minutes
}

export function QueuePosition({
  position,
  totalInQueue = 10,
  timeSlotExpiry,
  status,
  estimatedWaitTime,
}: QueuePositionProps) {
  const progress = totalInQueue > 0 ? ((totalInQueue - position + 1) / totalInQueue) * 100 : 0;
  const agentsAhead = position - 1;

  return (
    <div className="space-y-4">
      {/* Position Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Your Position</p>
            <p className="text-2xl font-bold">#{position}</p>
          </div>
        </div>
        
        <Badge 
          variant="outline"
          className={
            status === "ASSIGNED" 
              ? "bg-yellow-100 text-yellow-800 border-yellow-300"
              : status === "IN_PROGRESS"
              ? "bg-orange-100 text-orange-800 border-orange-300"
              : "bg-blue-100 text-blue-800 border-blue-300"
          }
        >
          {status === "ASSIGNED" ? "Your Turn" : status === "IN_PROGRESS" ? "Active" : "In Queue"}
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Queue Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Agents Ahead */}
      {agentsAhead > 0 && status === "QUEUED" && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="p-4 flex items-start gap-3">
            <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-900">
                {agentsAhead} agent{agentsAhead !== 1 ? "s" : ""} ahead of you
              </p>
              {estimatedWaitTime && (
                <p className="text-blue-700 mt-1">
                  Estimated wait time: {estimatedWaitTime} minutes
                </p>
              )}
              <p className="text-blue-700 mt-1">
                Each agent has a 3-hour time slot to complete their marking
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Time Slot Expiry */}
      {timeSlotExpiry && status === "ASSIGNED" && (
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-yellow-900">Your Time Slot</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Complete the marking before the timer expires or the job will be reassigned
                </p>
              </div>
            </div>
            
            <QueueTimer expiryTime={timeSlotExpiry} />
          </div>
        </Card>
      )}

      {/* Active Job Info */}
      {status === "IN_PROGRESS" && (
        <Card className="bg-orange-50 border-orange-200">
          <div className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-orange-900">Marking in Progress</p>
              <p className="text-orange-700 mt-1">
                Complete all required steps and upload photos to finish the job
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Queue Info */}
      {totalInQueue > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
          <span>Total agents in queue</span>
          <span className="font-medium">{totalInQueue}</span>
        </div>
      )}
    </div>
  );
}