# Property Marking Queue System Documentation

## Overview

The Property Marking Service uses a first-come-first-served queue system to assign marking jobs to available agents and premium renters. This document explains how the queue system works, its management, and best practices.

---

## Queue Architecture

### Queue Components

```
┌─────────────────────────────────────────────────┐
│           Property Marking Job Created          │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│     Broadcast to Agents Within Proximity        │
│  (Agents/Premium Renters within service area)   │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│              Queue Formation                     │
│  - Agent 1 accepts (Position 1) ✓              │
│  - Agent 2 accepts (Position 2)                │
│  - Agent 3 accepts (Position 3)                │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│         Time Slot Assignment (3 hours)          │
│  Agent 1 gets first 3-hour window              │
└────────────────┬────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
    SUCCESS           TIMEOUT
        │                 │
        │                 ▼
        │    ┌──────────────────────────┐
        │    │  Move to Next in Queue   │
        │    │  Agent 2 gets time slot  │
        │    └──────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────┐
│          Job Completion & Payment               │
└─────────────────────────────────────────────────┘
```

---

## Queue States

### 1. Job Creation
```typescript
interface JobCreation {
  status: "QUEUED";
  queuePosition: null;
  assignedAgentId: null;
  timeSlotExpiry: null;
  maxCompletionTime: Date; // +3 days from creation
}
```

### 2. Agent Acceptance
```typescript
interface AgentAcceptance {
  agentId: string;
  acceptedAt: Date;
  queuePosition: number; // Auto-incremented
  notificationSent: boolean;
}
```

### 3. Active Assignment
```typescript
interface ActiveAssignment {
  status: "ASSIGNED";
  assignedAgentId: string;
  queuePosition: 1; // Always 1 for active agent
  timeSlotExpiry: Date; // +3 hours from assignment
  assignedAt: Date;
}
```

---

## Queue Management Rules

### Priority Rules

1. **First-Come-First-Served**: Queue position based on acceptance timestamp
2. **Time Slot Duration**: Each agent gets 3 hours to complete the job
3. **Maximum Queue Time**: Job expires after 3 days if unfinished
4. **Queue Position**: Dynamic - updates when agent ahead completes/times out

### Queue Position Calculation

```typescript
// Example queue state
[
  { agentId: "agent_1", position: 1, status: "ACTIVE" },
  { agentId: "agent_2", position: 2, status: "WAITING" },
  { agentId: "agent_3", position: 3, status: "WAITING" }
]

// When agent_1 times out:
// - agent_1 removed from queue
// - agent_2 moves to position 1 (becomes ACTIVE)
// - agent_3 moves to position 2 (still WAITING)
// - agent_2 gets new 3-hour time slot
```

---

## Queue Operations

### 1. Join Queue

**Endpoint**: `POST /api/marking/queue/join/:jobId`

**Prerequisites**:
- Agent must be within proximity range
- Agent must have `isAvailableForMarking: true`
- Job status must be `QUEUED` or `ASSIGNED`
- Agent not already in queue for this job

**Process**:
```typescript
async function joinQueue(jobId: string, agentId: string) {
  // 1. Validate agent eligibility
  const agent = await validateAgentEligibility(agentId, jobId);
  
  // 2. Get current queue length
  const currentQueue = await getJobQueue(jobId);
  const newPosition = currentQueue.length + 1;
  
  // 3. Add agent to queue
  await addToQueue({
    jobId,
    agentId,
    position: newPosition,
    status: newPosition === 1 ? "ACTIVE" : "WAITING"
  });
  
  // 4. If first in queue, assign time slot
  if (newPosition === 1) {
    await assignTimeSlot(jobId, agentId);
  }
  
  // 5. Notify agent of queue position
  await notifyQueuePosition(agentId, newPosition);
}
```

### 2. Leave Queue

**Endpoint**: `DELETE /api/marking/queue/leave/:jobId`

**Process**:
```typescript
async function leaveQueue(jobId: string, agentId: string) {
  // 1. Get agent's queue position
  const queueEntry = await getQueueEntry(jobId, agentId);
  
  // 2. Remove agent from queue
  await removeFromQueue(jobId, agentId);
  
  // 3. If agent was active, assign to next in queue
  if (queueEntry.status === "ACTIVE") {
    await assignToNextInQueue(jobId);
  }
  
  // 4. Update queue positions for remaining agents
  await rebalanceQueue(jobId);
}
```

### 3. Time Slot Expiry

**Cron Job**: Runs every 5 minutes

```typescript
async function checkTimeSlotExpiry() {
  // 1. Find all jobs with expired time slots
  const expiredJobs = await prisma.propertyMarkingJob.findMany({
    where: {
      status: "ASSIGNED",
      timeSlotExpiry: {
        lte: new Date()
      }
    }
  });
  
  // 2. Process each expired job
  for (const job of expiredJobs) {
    // Pay partial compensation to expired agent
    await payPartialCompensation(job.assignedAgentId, job.id);
    
    // Move to next in queue
    await assignToNextInQueue(job.id);
    
    // Notify property owner
    await notifyOwnerOfDelay(job.requestedBy, job.id);
  }
}
```

---

## Compensation Distribution in Queue

### Payment Flow

```
Total Marking Fee: ₦20,000
├─ Initial Deposit: ₦1,000 (5%) → Paid on successful marking
├─ Remaining Payment: ₦19,000 (95%) → Paid after owner confirmation
└─ Agent Commission: 25% of ₦20,000 = ₦5,000
   └─ Platform Fee: ₦15,000
```

### Partial Compensation for Timeouts

```typescript
interface PartialCompensation {
  perTimeout: 1000; // ₦1,000 per timeout
  maxPayouts: 5; // Maximum 5 timeouts
  totalPossiblePayout: 5000; // ₦5,000 maximum
  
  // Payment logic
  payment = Math.min(
    timeoutCount * 1000,
    remainingFee
  );
}
```

### Compensation Scenarios

#### Scenario 1: First Agent Completes Successfully
```
Agent 1: Marks property successfully
- Initial: ₦1,000 (held in virtual account)
- After owner confirmation: ₦4,000 released
- Total: ₦5,000

Queue cleared. Job completed.
```

#### Scenario 2: First Agent Times Out
```
Agent 1: Times out after 3 hours
- Compensation: ₦1,000 (paid immediately)
- Remaining fee: ₦19,000

Agent 2: Becomes active, gets 3-hour slot
```

#### Scenario 3: Multiple Timeouts
```
Agent 1: Times out → ₦1,000 paid
Agent 2: Times out → ₦1,000 paid
Agent 3: Times out → ₦1,000 paid
Agent 4: Times out → ₦1,000 paid
Agent 5: Times out → ₦1,000 paid

Total paid: ₦5,000
Remaining: ₦15,000

Property owner must create new marking job.
```

---

## Queue Notifications

### Agent Notifications

#### 1. Queue Join Confirmation
```typescript
{
  type: "QUEUE_JOINED",
  message: "You've joined the marking queue",
  queuePosition: 3,
  estimatedWaitTime: "6 hours", // 3 hours × 2 agents ahead
  jobDetails: { ... }
}
```

#### 2. Queue Position Update
```typescript
{
  type: "QUEUE_POSITION_UPDATED",
  message: "You've moved up in the queue",
  newPosition: 2,
  estimatedWaitTime: "3 hours"
}
```

#### 3. Time Slot Assignment
```typescript
{
  type: "TIME_SLOT_ASSIGNED",
  message: "It's your turn! You have 3 hours to mark the property",
  timeSlotExpiry: "2025-10-14T15:30:00Z",
  propertyDetails: { ... },
  contactPerson: { ... }
}
```

#### 4. Time Slot Warning (30 min remaining)
```typescript
{
  type: "TIME_SLOT_WARNING",
  message: "30 minutes left to complete marking",
  timeRemaining: "30 minutes",
  jobId: "..."
}
```

#### 5. Timeout Notification
```typescript
{
  type: "TIME_SLOT_EXPIRED",
  message: "Your time slot has expired",
  compensationPaid: 1000,
  jobId: "..."
}
```

### Property Owner Notifications

#### 1. Agent Queue Update
```typescript
{
  type: "AGENT_QUEUE_UPDATE",
  message: "3 agents have joined the queue for your property",
  queueCount: 3,
  estimatedCompletion: "3 hours"
}
```

#### 2. Marking In Progress
```typescript
{
  type: "MARKING_IN_PROGRESS",
  message: "Agent is currently marking your property",
  agentName: "John Doe",
  startedAt: "..."
}
```

#### 3. Delay Notification
```typescript
{
  type: "MARKING_DELAYED",
  message: "Previous agent timed out. New agent assigned.",
  newAgentName: "Jane Smith",
  estimatedCompletion: "3 hours"
}
```

---

## Queue Monitoring & Analytics

### Admin Dashboard Metrics

```typescript
interface QueueMetrics {
  // Real-time metrics
  activeJobs: number;
  queuedAgents: number;
  averageQueueTime: number; // minutes
  averageCompletionTime: number; // minutes
  
  // Performance metrics
  successRate: number; // % of first-attempt completions
  timeoutRate: number; // % of timeouts
  averageAttemptsPerJob: number;
  
  // Financial metrics
  totalCompensationPaid: number;
  averageCompensationPerJob: number;
  timeoutCompensationTotal: number;
}
```

### Queue Health Indicators

```typescript
// Green: Healthy queue
{
  activeJobs: 45,
  averageQueueTime: 45, // minutes
  successRate: 85,
  timeoutRate: 15
}

// Yellow: Needs attention
{
  activeJobs: 120,
  averageQueueTime: 180, // 3 hours
  successRate: 70,
  timeoutRate: 30
}

// Red: Critical
{
  activeJobs: 250,
  averageQueueTime: 360, // 6 hours
  successRate: 50,
  timeoutRate: 50
}
```

---

## Queue Database Schema

### QueueEntry Table (Virtual)

```typescript
// Stored in PropertyMarkingJob model with additional fields
interface QueueEntry {
  jobId: string;
  agentId: string;
  queuePosition: number;
  status: "ACTIVE" | "WAITING" | "COMPLETED" | "TIMEOUT";
  joinedAt: Date;
  assignedAt?: Date;
  timeSlotExpiry?: Date;
  completedAt?: Date;
}
```

### Queue Queries

```typescript
// Get current queue for a job
const queue = await prisma.propertyMarkingJob.findMany({
  where: { id: jobId },
  include: {
    assignedAgent: true
  },
  orderBy: { queuePosition: 'asc' }
});

// Get agent's position in queue
const position = await prisma.propertyMarkingJob.findFirst({
  where: {
    id: jobId,
    assignedAgentId: agentId
  },
  select: { queuePosition: true }
});

// Get next agent in queue
const nextAgent = await prisma.propertyMarkingJob.findFirst({
  where: {
    id: jobId,
    queuePosition: currentPosition + 1
  },
  include: {
    assignedAgent: true
  }
});
```

---

## Error Handling

### Common Queue Errors

```typescript
enum QueueError {
  ALREADY_IN_QUEUE = "Agent already in queue for this job",
  JOB_COMPLETED = "Job has already been completed",
  JOB_EXPIRED = "Job has expired (3-day limit)",
  NOT_IN_QUEUE = "Agent not found in queue",
  QUEUE_FULL = "Queue is full (max capacity reached)",
  AGENT_NOT_ELIGIBLE = "Agent not eligible for this job"
}
```

### Recovery Strategies

```typescript
// If queue becomes corrupted
async function repairQueue(jobId: string) {
  // 1. Get all agents in queue
  const agents = await getQueueAgents(jobId);
  
  // 2. Reorder by joinedAt timestamp
  const ordered = agents.sort((a, b) => 
    a.joinedAt.getTime() - b.joinedAt.getTime()
  );
  
  // 3. Reassign positions
  for (let i = 0; i < ordered.length; i++) {
    await updateQueuePosition(jobId, ordered[i].agentId, i + 1);
  }
  
  // 4. Assign time slot to first agent
  await assignTimeSlot(jobId, ordered[0].agentId);
}
```

---

## Best Practices

### For Agents

1. **Join Early**: Join queue as soon as job is broadcast
2. **Monitor Position**: Check queue position regularly
3. **Be Ready**: Prepare when you're 2nd in queue
4. **Complete Quickly**: Aim to complete within 1-2 hours
5. **Leave if Unable**: Exit queue early if you can't make it

### For System Administrators

1. **Monitor Queue Length**: Alert when queues exceed 10 agents
2. **Track Success Rates**: Investigate if success rate drops below 70%
3. **Optimize Proximity**: Adjust proximity radius based on queue performance
4. **Review Timeouts**: Investigate agents with high timeout rates
5. **Balance Load**: Distribute jobs across service areas

### For Property Owners

1. **Provide Clear Instructions**: Detailed access instructions improve success rate
2. **Be Responsive**: Answer agent calls/messages quickly
3. **Flexible Timing**: Allow wider time windows for marking
4. **Quality Photos**: Provide good reference photos if available

---

## Testing Queue System

### Unit Tests

```typescript
describe("Queue Management", () => {
  it("should add agent to queue in correct position", async () => {
    const job = await createMarkingJob();
    const agent1 = await joinQueue(job.id, "agent_1");
    const agent2 = await joinQueue(job.id, "agent_2");
    
    expect(agent1.queuePosition).toBe(1);
    expect(agent2.queuePosition).toBe(2);
  });
  
  it("should move queue forward on timeout", async () => {
    const job = await createMarkingJob();
    await joinQueue(job.id, "agent_1");
    await joinQueue(job.id, "agent_2");
    
    await simulateTimeout(job.id, "agent_1");
    
    const agent2Position = await getQueuePosition(job.id, "agent_2");
    expect(agent2Position).toBe(1);
  });
});
```

### Integration Tests

```typescript
describe("Queue End-to-End", () => {
  it("should complete full queue cycle", async () => {
    // Create job and agents
    const job = await createMarkingJob();
    const agents = await createAgents(3);
    
    // Agents join queue
    for (const agent of agents) {
      await joinQueue(job.id, agent.id);
    }
    
    // First agent times out
    await simulateTimeout(job.id, agents[0].id);
    expect(await getActiveAgent(job.id)).toBe(agents[1].id);
    
    // Second agent completes
    await completeMarking(job.id, agents[1].id);
    expect(await getJobStatus(job.id)).toBe("COMPLETED");
    
    // Verify payments
    const payments = await getJobPayments(job.id);
    expect(payments.timeout).toBe(1000); // Agent 1
    expect(payments.completion).toBe(5000); // Agent 2
  });
});
```

---

## Performance Considerations

### Database Optimization

```sql
-- Index for queue queries
CREATE INDEX idx_queue_position ON property_marking_job(id, queue_position);
CREATE INDEX idx_time_slot_expiry ON property_marking_job(time_slot_expiry) 
  WHERE status = 'ASSIGNED';

-- Index for agent eligibility
CREATE INDEX idx_agent_availability ON user(is_available_for_marking, agent_service_areas);
```

### Caching Strategy

```typescript
// Cache active queues in Redis
const cacheKey = `queue:${jobId}`;
const cachedQueue = await redis.get(cacheKey);

if (cachedQueue) {
  return JSON.parse(cachedQueue);
}

const queue = await fetchQueueFromDB(jobId);
await redis.setex(cacheKey, 300, JSON.stringify(queue)); // 5 min TTL
```

---

## Future Enhancements

1. **Priority Queue**: Allow property owners to pay extra for priority placement
2. **Smart Assignment**: AI-based agent matching based on success history
3. **Queue Prediction**: Estimate completion time based on historical data
4. **Dynamic Time Slots**: Adjust time slot duration based on property complexity
5. **Agent Ratings**: Queue position influenced by agent reliability score

---

## Support & Troubleshooting

### Common Issues

**Q: Agent can't join queue**
- Check agent's `isAvailableForMarking` status
- Verify agent is within proximity range
- Ensure job hasn't expired or been completed

**Q: Time slot keeps expiring**
- Review property access instructions
- Check if contact person is responsive
- Verify property location accuracy

**Q: Queue not moving forward**
- Check cron job status for time slot monitoring
- Verify database connections
- Review error logs for timeout processing

### Contact

For queue system issues:
- Technical Support: tech@newcondo.ng
- Emergency: +234-XXX-XXX-XXXX
- Documentation: https://docs.newcondo.ng/queue

---

*Last Updated: October 14, 2025*
*Version: 1.0.0*