/**
 * apps/platform/components/marking/ProximityAgentList.tsx
 * 
 * Displays a list of available agents/renters within reasonable proximity
 * to the property location. Shows agent details, reliability scores, and
 * allows property owner to assign marking jobs.
 */

'use client';

import { useState } from 'react';
import { MapPin, Star, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Agent {
  id: string;
  name: string;
  phone: string;
  email: string;
  image?: string;
  reliabilityScore: number; // 0-5
  totalMarkingJobs: number;
  completedMarkingJobs: number;
  serviceAreas: string[];
  distance: number; // in km
  estimatedArrivalTime: number; // in minutes
  isAvailable: boolean;
  queuePosition?: number;
}

interface ProximityAgentListProps {
  agents: Agent[];
  propertyLocation: string;
  onAssignAgent: (agentId: string) => Promise<void>;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function ProximityAgentList({
  agents,
  propertyLocation,
  onAssignAgent,
  isLoading = false,
  emptyMessage = 'No agents available in your area at the moment.',
}: ProximityAgentListProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssign = async () => {
    if (!selectedAgent) return;

    setIsAssigning(true);
    try {
      await onAssignAgent(selectedAgent.id);
      setConfirmDialogOpen(false);
      setSelectedAgent(null);
    } catch (error) {
      console.error('Failed to assign agent:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  const getReliabilityColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 3.5) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getCompletionRate = (agent: Agent) => {
    if (agent.totalMarkingJobs === 0) return 'New';
    const rate = Math.round(
      (agent.completedMarkingJobs / agent.totalMarkingJobs) * 100
    );
    return `${rate}%`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Available Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!agents || agents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Available Agents</CardTitle>
          <CardDescription>
            Agents within reasonable proximity to {propertyLocation}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="mb-2 h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-600">{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort agents by distance
  const sortedAgents = [...agents].sort((a, b) => a.distance - b.distance);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Available Agents</CardTitle>
          <CardDescription>
            {agents.length} agent{agents.length !== 1 ? 's' : ''} found within
            reasonable proximity to {propertyLocation}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedAgents.map((agent, index) => (
              <div
                key={agent.id}
                className="flex items-start justify-between rounded-lg border p-4 hover:bg-gray-50"
              >
                <div className="flex gap-4 flex-1">
                  {/* Agent Avatar */}
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                    {agent.image ? (
                      <img
                        src={agent.image}
                        alt={agent.name}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-blue-600">
                        {agent.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Agent Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">
                        {agent.name}
                      </h3>
                      {agent.isAvailable && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                          <CheckCircle className="h-3 w-3" />
                          Available
                        </span>
                      )}
                      {agent.queuePosition && (
                        <span className="text-xs text-gray-500">
                          Queue: #{agent.queuePosition}
                        </span>
                      )}
                    </div>

                    {/* Rating and Stats */}
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Star
                          className={`h-4 w-4 ${getReliabilityColor(agent.reliabilityScore)}`}
                        />
                        <span className="font-medium">
                          {agent.reliabilityScore.toFixed(1)}
                        </span>
                        <span className="text-gray-500">
                          ({agent.totalMarkingJobs} jobs)
                        </span>
                      </div>

                      <div>
                        Completion Rate: {getCompletionRate(agent)}
                      </div>

                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{agent.distance} km away</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>~{agent.estimatedArrivalTime} min</span>
                      </div>
                    </div>

                    {/* Service Areas */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {agent.serviceAreas.slice(0, 3).map((area) => (
                        <span
                          key={area}
                          className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
                        >
                          {area}
                        </span>
                      ))}
                      {agent.serviceAreas.length > 3 && (
                        <span className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                          +{agent.serviceAreas.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  onClick={() => {
                    setSelectedAgent(agent);
                    setConfirmDialogOpen(true);
                  }}
                  disabled={!agent.isAvailable}
                  variant="outline"
                  size="sm"
                  className="ml-4"
                >
                  Assign
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Marking Job</DialogTitle>
            <DialogDescription>
              Are you sure you want to assign this marking job to{' '}
              <strong>{selectedAgent?.name}</strong>?
            </DialogDescription>
          </DialogHeader>

          {selectedAgent && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Contact</p>
                    <p className="font-medium">{selectedAgent.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Distance</p>
                    <p className="font-medium">{selectedAgent.distance} km</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Reliability</p>
                    <p className="font-medium">
                      {selectedAgent.reliabilityScore.toFixed(1)}/5
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Est. Arrival</p>
                    <p className="font-medium">
                      {selectedAgent.estimatedArrivalTime} min
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="text-sm text-blue-900">
                  The agent will have a 3-hour window to mark your property.
                  Upon completion, you'll have 2-3 days to verify the marking.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={isAssigning}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={isAssigning}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}