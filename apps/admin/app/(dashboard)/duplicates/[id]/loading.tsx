import { Card, CardContent, CardHeader } from "@newcondo/ui/components/card";
import { Skeleton } from "@newcondo/ui/components/skeleton";
import { Separator } from "@newcondo/ui/components/separator";

export default function DuplicateDetailsLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div>
            <Skeleton className="h-9 w-[350px] mb-2" />
            <Skeleton className="h-5 w-[400px]" />
          </div>
        </div>
        <Skeleton className="h-6 w-[100px]" />
      </div>

      {/* Alert Skeleton */}
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>

      {/* Map Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[250px] mb-2" />
          <Skeleton className="h-4 w-[350px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full rounded-md" />
          <div className="flex gap-4 mt-4">
            <Skeleton className="h-6 w-[150px]" />
            <Skeleton className="h-6 w-[150px]" />
          </div>
        </CardContent>
      </Card>

      {/* Properties Comparison Skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-[180px]" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>

              <Separator />

              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>

              <Separator />

              <div>
                <Skeleton className="h-4 w-[60px] mb-2" />
                <Skeleton className="h-8 w-[150px]" />
              </div>

              <div>
                <Skeleton className="h-4 w-[120px] mb-2" />
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="aspect-video rounded-md" />
                  ))}
                </div>
              </div>

              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Information Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[180px]" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Skeleton className="h-3 w-[100px] mb-2" />
              <Skeleton className="h-5 w-[200px]" />
            </div>
            <div>
              <Skeleton className="h-3 w-[100px] mb-2" />
              <Skeleton className="h-5 w-[150px] mb-1" />
              <Skeleton className="h-4 w-[180px]" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resolution Actions Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[220px] mb-2" />
          <Skeleton className="h-4 w-[350px]" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Skeleton className="h-4 w-[150px] mb-2" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}