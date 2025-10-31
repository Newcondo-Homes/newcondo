"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface AuditEntry {
  id: string;
  action: string;
  performedBy: string;
  timestamp: Date;
  details?: string;
}

interface AuditLogProps {
  entries: AuditEntry[];
}

export default function AuditLog({ entries }: AuditLogProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Log</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 pb-4 border-b last:border-b-0">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">{entry.action}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {format(entry.timestamp, "MMM dd, yyyy 'at' h:mm a")}
                  </span>
                </div>
                <p className="text-sm">
                  By <span className="font-medium">{entry.performedBy}</span>
                </p>
                {entry.details && (
                  <p className="text-xs text-muted-foreground mt-1">{entry.details}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}