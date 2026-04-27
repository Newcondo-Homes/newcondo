// apps/platform/components/payments/ConfirmationSkeleton.tsx
import { Skeleton } from "@newcondo/ui/components/skeleton";
import { Card, CardContent, CardHeader } from "@newcondo/ui/components/card";

export function ConfirmationSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Timer card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </CardContent>
      </Card>

      {/* Property details card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Skeleton className="h-24 w-32 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-28" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment summary card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
          <div className="border-t pt-3 flex justify-between">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-28" />
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex gap-4">
        <Skeleton className="h-11 flex-1 rounded-md" />
        <Skeleton className="h-11 flex-1 rounded-md" />
      </div>
    </div>
  );
}