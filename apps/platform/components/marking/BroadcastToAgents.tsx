// apps/platform/components/marking/BroadcastToAgents.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@newcondo/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';
import { Badge } from '@newcondo/ui/components/badge';
import { Users, MapPin, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatDistance } from '@/lib/utils/format';
import Image from 'next/image';

interface Agent {
  id: string;
  name: string;
  image?: string;
  distance: number;
  completedJobs: number;
  reliabilityScore: number;
  isAvailable: boolean;
}

interface BroadcastToAgentsProps {
  propertyId: string;
  propertyLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  markingFee: number;
  onBroadcast: () => Promise<void>;
  onCancel: () => void;
}

export function BroadcastToAgents({
  propertyId,
  propertyLocation,
  markingFee,
  onBroadcast,
  onCancel,
}: BroadcastToAgentsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [nearbyAgents, setNearbyAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNearbyAgents();
  }, []);

  const fetchNearbyAgents = useCallback(async () => {
    try {
      setLoadingAgents(true);
      const response = await fetch(
        `/api/marking/nearby-agents?lat=${propertyLocation.lat}&lng=${propertyLocation.lng}&propertyId=${propertyId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch nearby agents');
      }

      const data = await response.json();
      setNearbyAgents(data.agents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load nearby agents');
    } finally {
      setLoadingAgents(false);
    }
  }, [propertyLocation.lat, propertyLocation.lng, propertyId]);

  // Then add fetchNearbyAgents to useEffect deps
  useEffect(() => {
    fetchNearbyAgents();
  }, [fetchNearbyAgents]);

  const handleBroadcast = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await onBroadcast();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to broadcast to agents');
    } finally {
      setIsLoading(false);
    }
  };

  const agentCompensation = markingFee * 0.25; // 25% of marking fee

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Broadcast to Nearby Agents
        </CardTitle>
        <CardDescription>
          Send marking job to available agents within reasonable proximity to your property
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Property Location Info */}
        <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
          <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-sm">Property Location</p>
            <p className="text-sm text-muted-foreground">{propertyLocation.address}</p>
          </div>
        </div>

        {/* Compensation Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Agent Compensation</p>
            <p className="text-2xl font-bold text-primary">
              ₦{agentCompensation.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              25% of marking fee
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Initial Payment</p>
            <p className="text-2xl font-bold">₦1,000</p>
            <p className="text-xs text-muted-foreground mt-1">
              Released immediately after marking
            </p>
          </div>
        </div>

        {/* Time Window Info */}
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Each agent will have a 3-hour time window to complete the marking. The first agent to
            successfully mark the property wins the job.
          </AlertDescription>
        </Alert>

        {/* Nearby Agents List */}
        {loadingAgents ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : nearbyAgents.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Available Agents Nearby</h4>
              <Badge variant="secondary">{nearbyAgents.length} agents</Badge>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2">
              {nearbyAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center gap-3 p-3 bg-muted rounded-md"
                >
                  {agent.image ? (
                    <Image
                      src={agent.image}
                      alt={agent.name}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{agent.name}</p>
                      {agent.isAvailable && (
                        <Badge variant="default" className="text-xs">
                          Available
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {formatDistance(agent.distance)}
                      </span>
                      <span>•</span>
                      <span>{agent.completedJobs} jobs</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        ⭐ {agent.reliabilityScore.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Alert variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No agents are currently available in your area. You may need to try other marking options
              or wait for agents to become available.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* How It Works */}
        <div className="space-y-2 p-4 bg-muted rounded-lg">
          <h4 className="font-medium text-sm">How It Works:</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Your marking job is broadcast to all available agents nearby</li>
            <li>Agents respond and are placed in a first-come-first-served queue</li>
            <li>Each agent gets a 3-hour window to mark the property</li>
            <li>First agent to successfully mark receives ₦1,000 immediately</li>
            <li>You verify the marking within 2-3 days</li>
            <li>Upon verification, remaining compensation (₦{(agentCompensation - 1000).toLocaleString()}) is released</li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleBroadcast}
            disabled={isLoading || nearbyAgents.length === 0}
            className="flex-1"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Broadcasting...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Broadcast to {nearbyAgents.length} Agent{nearbyAgents.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            size="lg"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}