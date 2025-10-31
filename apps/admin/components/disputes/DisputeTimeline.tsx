"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@newcondo/ui/components/card";
import { Badge } from "@newcondo/ui/components/badge";
import { 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Clock,
  UserCheck,
  FileText,
  MessageSquare
} from "lucide-react";
import { format } from "date-fns";

interface TimelineEvent {
  id: string;
  type: "CREATED" | "INVESTIGATED" | "EVIDENCE_ADDED" | "COMMENT_ADDED" | "STATUS_CHANGED" | "RESOLVED";
  title: string;
  description: string;
  timestamp: string;
  actor?: {
    name: string;
    role: string;
  };
  metadata?: Record<string, any>;
}

interface DisputeTimelineProps {
  events: TimelineEvent[];
}

const eventConfig = {
  CREATED: {
    icon: AlertCircle,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
  },
  INVESTIGATED: {
    icon: Clock,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  EVIDENCE_ADDED: {
    icon: FileText,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  COMMENT_ADDED: {
    icon: MessageSquare,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  },
  STATUS_CHANGED: {
    icon: Clock,
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
  },
  RESOLVED: {
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
};

export default function DisputeTimeline({ events }: DisputeTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Dispute Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-gray-200" />

          {/* Timeline Events */}
          <div className="space-y-6">
            {events.map((event, index) => {
              const config = eventConfig[event.type];
              const Icon = config.icon;

              return (
                <div key={event.id} className="relative pl-12">
                  {/* Icon */}
                  <div
                    className={`absolute left-0 w-9 h-9 rounded-full ${config.bgColor} flex items-center justify-center`}
                  >
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{event.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      </div>
                      <time className="text-xs text-gray-500 whitespace-nowrap">
                        {format(new Date(event.timestamp), "MMM d, h:mm a")}
                      </time>
                    </div>

                    {/* Actor */}
                    {event.actor && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <UserCheck className="h-3 w-3" />
                        <span>
                          {event.actor.name} ({event.actor.role})
                        </span>
                      </div>
                    )}

                    {/* Metadata */}
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="bg-gray-50 rounded p-3 mt-2">
                        <div className="space-y-1">
                          {Object.entries(event.metadata).map(([key, value]) => (
                            <div key={key} className="flex items-start gap-2 text-xs">
                              <span className="font-medium text-gray-600 capitalize">
                                {key.replace(/_/g, " ")}:
                              </span>
                              <span className="text-gray-700">
                                {typeof value === "object" ? JSON.stringify(value) : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status Change Badge */}
                    {event.type === "STATUS_CHANGED" && event.metadata?.newStatus && (
                      <Badge className="mt-2">
                        Status: {event.metadata.newStatus.replace(/_/g, " ")}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {events.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No timeline events yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}