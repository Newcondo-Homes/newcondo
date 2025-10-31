// apps/admin/src/components/marking-jobs/JobReassignment.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  UserCheck,
  Users,
  MapPin,
  Star,
  Clock,
  CheckCircle,
} from 'lucide-react';

interface AvailableAgent {
  id: string;
  name: string;
  email: string;
  phone: string;
  reliabilityScore: number;
  totalJobs: number;
  completedJobs: number;
  currentActiveJobs: number;
  distance?: string;
  estimatedArrival?: string;
  isAvailable: boolean;
}

interface ReassignmentReason {
  value: string;
  label: string;
}

interface JobReassignmentProps {
  jobId: string;
  currentAgentId?: string;
  currentAgentName?: string;
  propertyAddress: string;
  onReassign: (data: {
    newAgentId: string;
    reason: string;
    notes?: string;
  }) => Promise<void>;
}

export default function JobReassignment({
  jobId,
  currentAgentId,
  currentAgentName,
  propertyAddress,
  onReassign,
}: JobReassignmentProps) {
  const [availableAgents, setAvailableAgents] = useState<AvailableAgent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reassignmentReasons: ReassignmentReason[] = [
    { value: 'TIME_EXPIRED', label: 'Time slot expired' },
    { value: 'AGENT_UNAVAILABLE', label: 'Agent became unavailable' },
    { value: 'QUALITY_ISSUE', label: 'Quality concerns with current agent' },
    { value: 'PROPERTY_OWNER_REQUEST', label: 'Property owner request' },
    { value: 'DISTANCE_ISSUE', label: 'Agent too far from property' },
    { value: 'BETTER_MATCH', label: 'Better agent match available' },
    { value: 'ADMIN_DECISION', label: 'Administrative decision' },
    { value: 'OTHER', label: 'Other' },
  ];

  useEffect(() => {
    fetchAvailableAgents();
  }, [jobId]);

  const fetchAvailableAgents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/marking-jobs/${jobId}/available-agents`);
      if (!response.ok) throw new Error('Failed to fetch available agents');
      
      const data = await response.json();
      setAvailableAgents(data.agents || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAgentId) {
      setError('Please select an agent');
      return;
    }

    if (!reason) {
      setError('Please select a reassignment reason');
      return;
    }

    if (reason === 'OTHER' && !notes.trim()) {
      setError('Please provide additional details for "Other" reason');
      return;
    }

    setSubmitting(true);
    try {
      await onReassign({
        newAgentId: selectedAgentId,
        reason,
        notes,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reassign job');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedAgent = availableAgents.find(agent => agent.id === selectedAgentId);

  return (
    <div className="space-y-6">
      {/* Current Assignment Info */}
      {currentAgentId && currentAgentName && (
        <Alert>
          <UserCheck className="h-4 w-4" />
          <AlertDescription>
            Currently assigned to: <strong>{currentAgentName}</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Property Info */}
      <Card>
        <CardHeader>
          <CardTitle>Property Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-2">
            <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
            <p className="text-sm">{propertyAddress}</p>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Reassignment Form */}
      <Card>
        <CardHeader>
          <CardTitle>Reassign Job</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Reassignment Reason */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Reassignment Reason *
              </label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {reassignmentReasons.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Additional Notes {reason === 'OTHER' && '*'}
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Provide additional context for the reassignment..."
                rows={3}
              />
            </div>

            {/* Available Agents */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">
                  Select New Agent * ({availableAgents.length} available)
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchAvailableAgents}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  Loading available agents...
                </div>
              ) : availableAgents.length === 0 ? (
                <Alert>
                  <Users className="h-4 w-4" />
                  <AlertDescription>
                    No agents currently available in this area
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {availableAgents.map((agent) => (
                    <div
                      key={agent.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedAgentId === agent.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'hover:border-gray-400'
                      }`}
                      onClick={() => setSelectedAgentId(agent.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{agent.name}</h4>
                            {!agent.isAvailable && (
                              <Badge variant="outline" className="text-yellow-600">
                                Busy
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-1 text-sm text-gray-600">
                            <p>{agent.email}</p>
                            <p>{agent.phone}</p>
                          </div>

                          <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm font-medium">
                                {agent.reliabilityScore.toFixed(1)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm">
                                {agent.completedJobs}/{agent.totalJobs} jobs
                              </span>
                            </div>

                            {agent.currentActiveJobs > 0 && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-blue-500" />
                                <span className="text-sm">
                                  {agent.currentActiveJobs} active
                                </span>
                              </div>
                            )}
                          </div>

                          {(agent.distance || agent.estimatedArrival) && (
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              {agent.distance && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{agent.distance}</span>
                                </div>
                              )}
                              {agent.estimatedArrival && (
                                <span>ETA: {agent.estimatedArrival}</span>
                              )}
                            </div>
                          )}
                        </div>

                        {selectedAgentId === agent.id && (
                          <CheckCircle className="h-6 w-6 text-blue-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Agent Summary */}
      {selectedAgent && (
        <Card className="border-blue-500">
          <CardHeader>
            <CardTitle>Assignment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">New Agent:</span>
                <span className="font-medium">{selectedAgent.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Reliability Score:</span>
                <span className="font-medium">{selectedAgent.reliabilityScore.toFixed(1)} ⭐</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Completed Jobs:</span>
                <span className="font-medium">
                  {selectedAgent.completedJobs} / {selectedAgent.totalJobs}
                </span>
              </div>
              {selectedAgent.distance && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Distance:</span>
                  <span className="font-medium">{selectedAgent.distance}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={() => {
            setSelectedAgentId('');
            setReason('');
            setNotes('');
            setError(null);
          }}
          disabled={submitting}
        >
          Reset
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || !selectedAgentId || !reason}
        >
          {submitting ? 'Reassigning...' : 'Reassign Job'}
        </Button>
      </div>
    </div>
  );
}