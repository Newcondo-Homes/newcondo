import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield } from 'lucide-react';

export default function AdminLoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md shadow-2xl border-slate-700">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <Skeleton className="h-9 w-48 mx-auto" />
          <Skeleton className="h-5 w-64 mx-auto" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-11 w-full" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-11 w-full" />
          </div>

          <Skeleton className="h-11 w-full" />

          <Skeleton className="h-4 w-48 mx-auto" />
        </CardContent>
      </Card>
    </div>
  );
}