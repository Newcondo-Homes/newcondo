// apps/platform/app/unauthorized/page.tsx
import Link from "next/link";
import { Button } from "@newcondo/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@newcondo/ui";
import { AlertTriangle, ArrowLeft, Home, Shield } from "lucide-react";

interface UnauthorizedPageProps {
  searchParams: Promise<{
    message?: string;
    returnUrl?: string;
  }>;
}

export default async function UnauthorizedPage({
  searchParams,
}: UnauthorizedPageProps) {
  const params = await searchParams;
  const { message, returnUrl } = params;

  const defaultMessage = "You don't have permission to access this page.";
  const displayMessage = message || defaultMessage;
  const backUrl = returnUrl || "/dashboard";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Access Denied
          </CardTitle>
          <CardDescription className="text-gray-600">
            {displayMessage}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Why am I seeing this?</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>You may not have the required role or permissions</li>
                  <li>Your account might need verification</li>
                  <li>This feature may be restricted to certain user types</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href={backUrl}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Link>
            </Button>

            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard">
                <Home className="h-4 w-4 mr-2" />
                Return to Dashboard
              </Link>
            </Button>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-600 mb-2">
              Need help accessing this feature?
            </p>
            <div className="space-y-2">
              <Button variant="link" asChild className="text-sm h-auto p-0">
                <Link href="/profile/verification">
                  Complete Account Verification
                </Link>
              </Button>
              <br />
              <Button variant="link" asChild className="text-sm h-auto p-0">
                <Link href="/contact">Contact Support</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Generate metadata for the page
// export function generateMetadata({ searchParams }: UnauthorizedPageProps) {
//   return {
//     title: "Access Denied - NewCondo",
//     description: "You don't have permission to access this page.",
//     robots: "noindex,nofollow",
//   };
// }

export function generateMetadata() {
  return {
    title: "Access Denied - NewCondo",
    description: "You don't have permission to access this page.",
    robots: "noindex,nofollow",
  };
}
