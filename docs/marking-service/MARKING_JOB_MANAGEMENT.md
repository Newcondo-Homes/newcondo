# Marking Job Management System

## Overview
The Marking Job Management System is a comprehensive solution for managing property boundary marking tasks. It enables property owners to request marking services, assigns jobs to qualified agents through a queue system, and ensures quality completion with photo evidence and boundary data.

## Core Features

### 1. Job Assignment & Tracking
- **Automatic Agent Assignment**: Jobs are assigned to agents based on proximity and availability
- **Real-time Status Updates**: Track job progress from queued to completion
- **Queue Management**: First-come-first-served queue with 3-hour time slots
- **Multi-tier Assignment Options**:
  - Self-marking by property owner
  - Assignment to known person (shareable link)
  - Assignment to Newcondo agents (₦20,000)
  - Assignment to Newcondo admin (₦25,000)

### 2. Time Limit Enforcement
- **3-Hour Time Slots**: Each agent has 3 hours to complete the marking
- **Automatic Progression**: Queue advances automatically when time expires
- **Maximum Completion Time**: 2-3 days from initial job creation
- **Expiry Notifications**: Agents receive warnings before slot expiration

### 3. Boundary Completion & Evidence
- **Photo Upload Requirements**: Agents must upload key property photos
- **Boundary Drawing**: Interactive map interface for marking property boundaries
- **GPS Verification**: Automatic location verification during marking
- **Completion Notes**: Agents provide detailed completion notes

### 4. Quality Assurance
- **Property Owner Verification**: Owners must confirm marked boundaries within 2-3 days
- **Boundary Accuracy Check**: System validates boundary coordinates
- **Photo Quality Review**: Ensures uploaded photos meet standards
- **Agent Performance Scoring**: Tracks reliability and quality metrics

### 5. Payment Processing
- **Partial Payment on Completion**: ₦1,000 held until owner verification
- **Full Release on Confirmation**: Remaining ₦4,000 (25% of ₦20,000) released
- **Automatic Compensation**: If owner doesn't confirm within deadline
- **Fee Structure**:
  - Agent compensation: 25% of ₦20,000 = ₦5,000
  - Platform fee: 75% of ₦20,000 = ₦15,000

### 6. Communication System
- **Real-time Notifications**: Email, SMS, and in-app alerts
- **Agent Alerts**: Notify agents of new jobs in their service area
- **Status Updates**: Keep property owners informed of progress
- **Contact Information**: Share contact person details with assigned agents

## User Roles

### Property Owner
- Request marking jobs
- Provide property access details
- Verify completed markings
- Receive status notifications

### Agent/Premium Renter
- Receive job alerts based on location
- Accept jobs from queue
- Complete marking with photos
- Receive payment for completed jobs

### Newcondo Admin
- Monitor all marking jobs
- Handle high-priority assignments (₦25,000)
- Resolve disputes
- Manage queue system

## Workflow

### Job Creation Flow
```
1. Property Owner initiates marking request
2. Owner selects marking option:
   - Self-mark (free)
   - Send to known person (free, shareable link)
   - Assign to agents (₦20,000)
   - Assign to Newcondo (₦25,000)
3. Owner pays marking fee (if applicable)
4. Owner provides contact person details
5. Owner specifies property location (State > LGA > Location)
6. System creates marking job
```

### Agent Assignment Flow (Queue System)
```
1. System broadcasts job to agents in proximity
2. Agents accept job on first-come-first-served basis
3. Agent enters queue with 3-hour time slot
4. Agent receives job details and contact info
5. Timer starts counting down from 3 hours
6. If agent completes within time:
   - Job marked as completed
   - ₦1,000 held in agent's account
   - Queue cleared
7. If agent exceeds time:
   - Agent removed from queue
   - Next agent in queue assigned
   - Process repeats
```

### Completion & Verification Flow
```
1. Agent arrives at property
2. Agent uploads key property photos (rooms, exterior, etc.)
3. Agent draws property boundary on satellite map
4. Agent submits completion with notes
5. System sends verification request to owner
6. Owner has 2-3 days to verify:
   - If verified: Full payment released to agent
   - If rejected: Agent keeps partial compensation
   - If no response: Automatic partial compensation cycles
7. Job closed after verification
```

## Payment System

### Fee Structure
| Marking Option | Cost | Agent Compensation | Platform Fee |
|---------------|------|-------------------|--------------|
| Self-mark | Free | N/A | N/A |
| Known person | Free | N/A | N/A |
| Assign to agents | ₦20,000 | ₦5,000 (25%) | ₦15,000 (75%) |
| Assign to Newcondo | ₦25,000 | N/A | ₦25,000 |

### Payment Timeline
1. **Upfront**: Property owner pays marking fee
2. **On Completion**: ₦1,000 held in agent's virtual account
3. **On Verification**: Remaining ₦4,000 released to agent
4. **On Timeout**: Partial compensation (₦1,000) released to agent

### Compensation Cycles
If property owner doesn't verify within 2-3 days:
- Cycle 1: Agent receives ₦1,000
- Cycle 2: Agent receives ₦1,000
- Cycle 3: Agent receives ₦1,000
- Cycle 4: Agent receives ₦1,000
- Cycle 5: Agent receives ₦1,000
- Total: ₦5,000 paid incrementally

## Notification System

### Agent Notifications
- **Job Available**: New marking job in your area
- **Job Assigned**: You've been assigned a marking job
- **Time Warning**: 30 minutes remaining in your time slot
- **Time Expired**: Your time slot has expired
- **Payment Received**: Marking payment deposited

### Property Owner Notifications
- **Job Created**: Your marking request has been received
- **Agent Assigned**: An agent has been assigned
- **Job Completed**: Agent has completed marking
- **Verification Required**: Please verify the property marking
- **Verification Deadline**: Reminder to verify (24 hours before deadline)
- **Auto-Compensation**: Agent compensated due to no verification

### Admin Notifications
- **High-Priority Job**: New ₦25,000 admin marking job
- **Queue Issue**: Marking job stuck in queue
- **Dispute Raised**: Property owner disputes marking

## Agent Location & Service Areas

### Location Setup
Agents must configure their service areas to receive relevant job alerts:
- **State**: Select states where agent operates
- **LGA**: Select Local Government Areas
- **Locations**: Select specific locations/neighborhoods
- **Availability Toggle**: Turn marking availability on/off

### Proximity Calculation
System calculates proximity based on:
1. Agent's registered service areas
2. Property's hierarchical location (State > LGA > Location)
3. Agent's current availability status
4. Agent's reliability score

### Job Broadcasting
Jobs are broadcast to:
- All agents with matching service areas
- Agents with `isAvailableForMarking = true`
- Agents with reliability score > 3.0
- Premium renters in the area (if subscribed)

## Performance Metrics

### Agent Metrics
- **Total Marking Jobs**: All jobs accepted
- **Completed Jobs**: Successfully completed markings
- **Reliability Score**: 0.00 to 5.00 rating
  - Based on: completion rate, time adherence, quality
- **Average Completion Time**: Time from assignment to completion
- **Verification Success Rate**: Percentage of verified markings

### System Metrics
- **Average Queue Length**: Number of agents waiting per job
- **Average Completion Time**: Time from job creation to completion
- **Verification Rate**: Percentage of owners who verify within deadline
- **Auto-Compensation Rate**: Jobs compensated without verification

## Database Schema

### PropertyMarkingJob Model
```prisma
model PropertyMarkingJob {
  id              String @id @default(cuid())
  propertyId      String
  requestedBy     String
  assignedAgentId String?
  
  // Job Details
  contactPersonName  String
  contactPersonPhone String
  accessInstructions String?
  preferredTime      DateTime?
  urgencyLevel       UrgencyLevel @default(NORMAL)
  
  // Pricing
  markingFee    Decimal @db.Decimal(10, 2)
  paymentStatus PaymentStatus @default(PENDING)
  
  // Job Status
  status         MarkingJobStatus @default(QUEUED)
  assignedAt     DateTime?
  completedAt    DateTime?
  timeSlotExpiry DateTime?
  
  // Completion Data
  completionNotes  String?
  completionImages String[]
  boundaryData     Json?
  
  // Queue Management
  queuePosition     Int?
  maxCompletionTime DateTime?
}
```

### User Model (Agent-specific fields)
```prisma
model User {
  // Agent specific fields
  isAvailableForMarking Boolean @default(false)
  agentServiceAreas     String[]
  agentReliabilityScore Decimal? @db.Decimal(3, 2)
  totalMarkingJobs      Int @default(0)
  completedMarkingJobs  Int @default(0)
}
```

## API Endpoints

See [API_MARKING_JOBS.md](./API_MARKING_JOBS.md) for detailed endpoint documentation.

## Security & Privacy

### Data Protection
- Contact person details encrypted at rest
- Access restricted to assigned agents only
- Location data anonymized in analytics
- Payment information secured via Flutterwave

### Access Control
- Property owners can only view their own jobs
- Agents can only view assigned jobs
- Admins have full oversight
- Audit logs for all marking activities

## Future Enhancements

### Phase 1 (Current)
- ✅ Basic job assignment
- ✅ Queue management
- ✅ Payment processing
- ✅ Photo evidence upload

### Phase 2 (Planned)
- 🔄 AI boundary suggestions
- 🔄 Automated quality scoring
- 🔄 Agent scheduling preferences
- 🔄 Bulk job management

### Phase 3 (Future)
- 📋 Video evidence support
- 📋 Live tracking of agent location
- 📋 Instant messaging between owner and agent
- 📋 Drone integration for large properties

## Support & Troubleshooting

### Common Issues

**Agent Not Receiving Jobs**
- Check `isAvailableForMarking` is `true`
- Verify service areas are configured
- Ensure reliability score is > 3.0
- Check notification settings

**Job Stuck in Queue**
- Verify agent availability
- Check time slot expiration
- Review queue position
- Contact admin for manual intervention

**Payment Not Released**
- Confirm job completion
- Check owner verification status
- Verify virtual account status
- Review compensation cycle timeline

**Boundary Validation Failed**
- Ensure boundary within reasonable size
- Check for overlapping boundaries
- Verify GPS coordinates accuracy
- Upload clear property photos

## Contact

For technical support or questions:
- Email: support@newcondo.ng
- Phone: +234 XXX XXX XXXX
- In-app: Support ticket system

---

**Last Updated**: October 2025  
**Version**: 1.0.0  
**Maintained by**: Newcondo Development Team