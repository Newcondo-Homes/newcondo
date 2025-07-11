// apps/platform/components/profile/VerificationSkeleton.tsx

import { Card, CardContent, CardHeader } from "@newcondo/ui/";
import { Skeleton } from "@newcondo/ui/";
import { Tabs, TabsList, TabsTrigger } from "@newcondo/ui/"; // Import Tabs for skeleton

export function VerificationSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Skeleton */}
      <Tabs defaultValue="overview">
        {" "}
        {/* Use a default value for Tabs */}
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" disabled>
            <Skeleton className="h-4 w-20" />
          </TabsTrigger>
          <TabsTrigger value="documents" disabled>
            <Skeleton className="h-4 w-20" />
          </TabsTrigger>
          <TabsTrigger value="history" disabled>
            <Skeleton className="h-4 w-20" />
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />{" "}
                  {/* Adjusted width for better fit */}
                  <Skeleton className="h-8 w-16" />{" "}
                  {/* Adjusted width for better fit */}
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />{" "}
                {/* Icon skeleton */}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Required Documents Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-56" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map(
              (
                _,
                i // Assuming 4 required documents based on your overview
              ) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Documents Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />{" "}
          {/* Simulate file input/dropzone */}
          <div className="flex justify-end gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
