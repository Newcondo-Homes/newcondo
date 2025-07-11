import { Progress } from "@newcondo/ui/";
import { CheckCircle, Clock, XCircle } from "lucide-react";

interface VerificationProgressProps {
  completed: number;
  total: number;
  pending: number;
  rejected: number;
}

export function VerificationProgress({
  completed,
  total,
  pending,
  rejected,
}: VerificationProgressProps) {
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Verification Progress</h3>
        <span className="text-sm text-gray-600">
          {completed} of {total} documents verified
        </span>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="flex justify-between text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-gray-600">Approved: {completed}</span>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-yellow-500" />
          <span className="text-gray-600">Pending: {pending}</span>
        </div>

        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-500" />
          <span className="text-gray-600">Rejected: {rejected}</span>
        </div>
      </div>
    </div>
  );
}
