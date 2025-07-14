// apps/platform/components/property/boundary-conflict-resolver.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/';
import { Button } from '@newcondo/ui/';
import { Badge } from '@newcondo/ui/';
import { Alert, AlertDescription } from '@newcondo/ui/';
import { Textarea } from '@newcondo/ui/';
import { Separator } from '@newcondo/ui/';
import { AlertTriangle, MapPin, User, Calendar } from 'lucide-react';
import { boundaryApi } from '@/lib/api/boundary';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface BoundaryConflict {
  id: string;
  conflictingPropertyId: string;
  conflictingProperty: {
    id: string;
    title: string;
    address: string;
    owner: {
      name: string;
      email: string;
    };
    createdAt: string;
  };
  overlapPercentage: number;
  conflictType: 'OVERLAP' | 'DUPLICATE' | 'ADJACENT';
  description: string;
}

interface BoundaryConflictResolverProps {
  conflicts: BoundaryConflict[];
  propertyId?: string;
  onConflictResolved?: (conflictId: string) => void;
  onAllConflictsResolved?: () => void;
}

export const BoundaryConflictResolver = ({
  conflicts,
  propertyId,
  onConflictResolved,
  onAllConflictsResolved,
}: BoundaryConflictResolverProps) => {
  const [isResolving, setIsResolving] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const getConflictSeverity = (conflict: BoundaryConflict) => {
    if (conflict.overlapPercentage > 50) return 'high';
    if (conflict.overlapPercentage > 20) return 'medium';
    return 'low';
  };

  const getConflictBadgeColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const handleReportDispute = async (conflictId: string) => {
    setIsResolving(true);
    try {
      await boundaryApi.reportBoundaryDispute({
        conflictId,
        propertyId,
        description: resolutionNote,
      });

      toast.success('Dispute reported successfully. Admin will review.');
      onConflictResolved?.(conflictId);
    } catch (error) {
      console.error('Error reporting dispute:', error);
      toast.error('Unable to report dispute. Please try again.');
    } finally {
      setIsResolving(false);
      setSelectedConflict(null);
      setResolutionNote('');
    }
  };

  const handleContactOwner = async (conflict: BoundaryConflict) => {
    // This would typically open a messaging interface or contact form
    toast.info('Contact feature coming soon. Please use the dispute resolution for now.');
  };

  const handleAdjustBoundary = () => {
    toast.info('Please adjust your boundary marking to resolve conflicts.');
  };

  if (conflicts.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-green-700">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-medium">No boundary conflicts detected</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {conflicts.length} boundary conflict{conflicts.length > 1 ? 's' : ''} detected. 
          Please resolve before proceeding with your property listing.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {conflicts.map((conflict) => {
          const severity = getConflictSeverity(conflict);
          const isSelected = selectedConflict === conflict.id;

          return (
            <Card key={conflict.id} className={`border-2 ${
              severity === 'high' ? 'border-red-200' : 
              severity === 'medium' ? 'border-yellow-200' : 'border-gray-200'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      Conflict with "{conflict.conflictingProperty.title}"
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {conflict.conflictingProperty.address}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {conflict.conflictingProperty.owner.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Listed {format(new Date(conflict.conflictingProperty.createdAt), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getConflictBadgeColor(severity)}>
                      {conflict.overlapPercentage}% overlap
                    </Badge>
                    <Badge variant="outline">
                      {conflict.conflictType.toLowerCase()}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  {conflict.description}
                </p>

                <Separator />

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleContactOwner(conflict)}
                    disabled={isResolving}
                  >
                    Contact Owner
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedConflict(isSelected ? null : conflict.id)}
                    disabled={isResolving}
                  >
                    Report Dispute
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleAdjustBoundary}
                    disabled={isResolving}
                  >
                    Adjust My Boundary
                  </Button>
                </div>

                {isSelected && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Describe the dispute
                      </label>
                      <Textarea
                        placeholder="Please explain why you believe this boundary conflict is incorrect..."
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleReportDispute(conflict.id)}
                        disabled={isResolving || !resolutionNote.trim()}
                        size="sm"
                      >
                        {isResolving ? 'Submitting...' : 'Submit Dispute'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedConflict(null);
                          setResolutionNote('');
                        }}
                        disabled={isResolving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <h3 className="font-medium text-blue-900 mb-2">Resolution Options</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• <strong>Contact Owner:</strong> Reach out to resolve the conflict directly</p>
            <p>• <strong>Report Dispute:</strong> Submit to admin for review if you believe the conflict is incorrect</p>
            <p>• <strong>Adjust Boundary:</strong> Modify your boundary marking to avoid conflicts</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};