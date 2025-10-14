/**
 * apps/admin/src/app/(dashboard)/marking/disputes/[disputeId]/page.tsx
 * Detailed view and resolution interface for a specific marking dispute
 */

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Image as ImageIcon,
  MapPin,
  User,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// Mock data - replace with actual API call
const mockDispute = {
  id: 'dispute_123',
  jobId: 'job_456',
  status: 'OPEN',
  type: 'INCORRECT_PROPERTY',
  priority: 'HIGH',
  reportedBy: {
    id: 'user_1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'OWNER',
  },
  agent: {
    id: 'agent_1',
    name: 'Jane Smith',
    email: 'jane@example.com',
    reliabilityScore: 4.5,
  },
  property: {
    id: 'prop_789',
    title: '3 Bedroom Flat in Lekki',
    address: '123 Freedom Way, Lekki Phase 1, Lagos',
  },
  description: 'The agent marked the wrong building. The property shown in the images is not mine.',
  submittedImages: [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
  ],
  agentImages: [
    'https://example.com/agent-image1.jpg',
    'https://example.com/agent-image2.jpg',
  ],
  timeline: [
    { date: '2025-10-12T10:30:00Z', event: 'Dispute opened', actor: 'John Doe' },
    { date: '2025-10-12T11:00:00Z', event: 'Admin review started', actor: 'Admin Team' },
  ],
  createdAt: '2025-10-12T10:30:00Z',
  updatedAt: '2025-10-12T11:00:00Z',
};

export default function DisputeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [isResolving, setIsResolving] = useState(false);
  const [resolution, setResolution] = useState('');
  const [resolutionAction, setResolutionAction] = useState('');

  const handleResolveDispute = async () => {
    if (!resolution.trim() || !resolutionAction) {
      toast.error('Please provide resolution details and action');
      return;
    }

    setIsResolving(true);
    try {
      // TODO: Implement API call to resolve dispute
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      toast.success('Dispute resolved successfully');
      router.push('/marking/disputes');
    } catch (error) {
      toast.error('Failed to resolve dispute');
    } finally {
      setIsResolving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      OPEN: { variant: 'destructive', icon: AlertCircle },
      IN_REVIEW: { variant: 'default', icon: Clock },
      RESOLVED: { variant: 'secondary', icon: CheckCircle2 },
    };

    const config = variants[status] || variants.OPEN;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-gray-500',
      MEDIUM: 'bg-blue-500',
      HIGH: 'bg-orange-500',
      URGENT: 'bg-red-500',
    };

    return (
      <Badge className={colors[priority] || colors.MEDIUM}>
        {priority}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Dispute Details</h1>
          <p className="text-muted-foreground mt-1">
            Review and resolve marking job dispute
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(mockDispute.status)}
          {getPriorityBadge(mockDispute.priority)}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dispute Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Dispute Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Dispute ID</Label>
                  <p className="font-mono text-sm">{mockDispute.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Marking Job ID</Label>
                  <p className="font-mono text-sm">{mockDispute.jobId}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Dispute Type</Label>
                  <p className="font-medium">{mockDispute.type.replace('_', ' ')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="text-sm">
                    {new Date(mockDispute.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-2 text-sm leading-relaxed">
                  {mockDispute.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Property Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Property</Label>
                <p className="font-medium">{mockDispute.property.title}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Address</Label>
                <p className="text-sm">{mockDispute.property.address}</p>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                <MapPin className="h-4 w-4 mr-2" />
                View on Map
              </Button>
            </CardContent>
          </Card>

          {/* Evidence Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Evidence Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="owner">
                <TabsList className="w-full">
                  <TabsTrigger value="owner" className="flex-1">
                    Owner's Images ({mockDispute.submittedImages.length})
                  </TabsTrigger>
                  <TabsTrigger value="agent" className="flex-1">
                    Agent's Images ({mockDispute.agentImages.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="owner" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {mockDispute.submittedImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="aspect-video bg-muted rounded-lg overflow-hidden border"
                      >
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="agent" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {mockDispute.agentImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="aspect-video bg-muted rounded-lg overflow-hidden border"
                      >
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Dispute Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockDispute.timeline.map((event, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <div className="flex-1 pb-4">
                      <p className="font-medium text-sm">{event.event}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.date).toLocaleString()} • {event.actor}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Parties Involved */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Parties Involved
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Property Owner</Label>
                <p className="font-medium">{mockDispute.reportedBy.name}</p>
                <p className="text-sm text-muted-foreground">{mockDispute.reportedBy.email}</p>
                <Badge variant="outline" className="mt-2">
                  {mockDispute.reportedBy.role}
                </Badge>
              </div>

              <Separator />

              <div>
                <Label className="text-muted-foreground">Assigned Agent</Label>
                <p className="font-medium">{mockDispute.agent.name}</p>
                <p className="text-sm text-muted-foreground">{mockDispute.agent.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">Agent</Badge>
                  <span className="text-xs text-muted-foreground">
                    Rating: {mockDispute.agent.reliabilityScore}/5.0
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full">
                  Contact Owner
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  Contact Agent
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resolution Actions */}
          {mockDispute.status !== 'RESOLVED' && (
            <Card>
              <CardHeader>
                <CardTitle>Resolve Dispute</CardTitle>
                <CardDescription>
                  Review evidence and provide resolution
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Resolution Action</Label>
                  <Select value={resolutionAction} onValueChange={setResolutionAction}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approve_owner">
                        Approve Owner's Claim
                      </SelectItem>
                      <SelectItem value="approve_agent">
                        Approve Agent's Marking
                      </SelectItem>
                      <SelectItem value="remark_required">
                        Request Re-marking
                      </SelectItem>
                      <SelectItem value="insufficient_evidence">
                        Insufficient Evidence
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Resolution Notes</Label>
                  <Textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Explain your decision..."
                    rows={5}
                  />
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Your decision will be final and will affect the agent's reliability score.
                  </AlertDescription>
                </Alert>

                <Button
                  className="w-full"
                  onClick={handleResolveDispute}
                  disabled={isResolving || !resolution.trim() || !resolutionAction}
                >
                  {isResolving ? 'Resolving...' : 'Resolve Dispute'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}