import { Card, CardContent, CardHeader } from '@newcondo/ui/components/card';
import { Skeleton } from '@newcondo/ui/components/skeleton';

export default function MarkingPageLoading() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <Skeleton className="h-9 w-80 mb-2" />
        <Skeleton className="h-5 w-full max-w-md" />
      </div>

      {/* Property Summary Skeleton */}
      <Card className="mb-6">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Skeleton className="w-24 h-24 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-80" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marking Options Skeleton */}
      <Card className="mb-6">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 border rounded-lg">
              <div className="flex items-start space-x-3">
                <Skeleton className="h-4 w-4 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Contact Information Skeleton */}
      <Card className="mb-6">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Cost Summary Skeleton */}
      <Card className="mb-6">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-px w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-28" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Button Skeleton */}
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </div>
    </div>
  );
}