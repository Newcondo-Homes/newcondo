# Property Marking Service - Compensation Logic

## Overview
This document details the compensation structure, payment flows, and financial logic for the Property Marking Service.

---

## Compensation Structure

### Base Fees
- **Property Owner Payment**: ₦20,000 (for agent marking)
- **Newcondo Admin Marking**: ₦25,000
- **Agent/Renter Compensation**: 25% of ₦20,000 = ₦5,000
- **Newcondo Platform Fee**: 75% of ₦20,000 = ₦15,000

### Payment Breakdown
```typescript
const MARKING_FEES = {
  AGENT_MARKING: 20000,      // What property owner pays
  ADMIN_MARKING: 25000,       // Higher fee for admin service
  AGENT_COMPENSATION: 5000,   // 25% of 20,000
  PLATFORM_FEE: 15000,        // 75% of 20,000
  INITIAL_ADVANCE: 1000       // Upfront payment on marking
};
```

---

## Payment Flow Scenarios

### Scenario 1: Self-Marking (Free)
**Flow:**
1. Property owner marks property themselves
2. No payment required
3. Immediate confirmation and listing

**Cost:** ₦0

---

### Scenario 2: Known Person Marking (Free)
**Flow:**
1. Property owner generates shareable link
2. Known person opens link at property
3. Marks property following instructions
4. Property owner confirms marking
5. No payment involved

**Cost:** ₦0

---

### Scenario 3: Newcondo Admin Marking
**Flow:**
1. Property owner selects admin marking option
2. Payment of ₦25,000 required upfront
3. Admin assigns internal agent
4. Agent marks property
5. Property owner confirms
6. Full amount goes to Newcondo

**Cost:** ₦25,000
**Timeline:** 2-5 business days

---

### Scenario 4: Platform Agent Marking (Standard Flow)

#### Step 1: Job Creation & Payment
```typescript
// Property owner initiates job
const markingJob = {
  propertyId: "prop_123",
  requestedBy: "user_456",
  markingFee: 20000,
  paymentStatus: "PENDING",
  status: "QUEUED"
};

// Payment captured to virtual account
const payment = {
  amount: 20000,
  type: "PROPERTY_MARKING",
  status: "HELD" // Money held, not released yet
};
```

#### Step 2: Agent Assignment & Initial Compensation
```typescript
// First agent in queue accepts job
const assignment = {
  assignedAgentId: "agent_789",
  assignedAt: new Date(),
  timeSlotExpiry: new Date(Date.now() + 3 * 60 * 60 * 1000) // 3 hours
};

// Agent marks property within 3-hour window
const initialPayment = {
  amount: 1000, // Small advance
  status: "HELD", // Still held pending confirmation
  canWithdraw: false
};

// Notify property owner for confirmation
sendNotification({
  userId: "user_456",
  type: "MARKING_COMPLETED",
  deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days
});
```

#### Step 3A: Successful Confirmation (Owner Confirms Within 2 Days)
```typescript
// Property owner confirms marking
const confirmation = {
  isConfirmed: true,
  confirmedAt: new Date()
};

// Release full payment to agent
const finalPayment = {
  agentReceives: 5000,        // ₦5,000 (initial ₦1,000 + remaining ₦4,000)
  platformReceives: 15000,    // ₦15,000
  canWithdraw: true
};

// Update agent stats
const agentUpdate = {
  completedMarkingJobs: agent.completedMarkingJobs + 1,
  totalEarnings: agent.totalEarnings + 5000,
  reliabilityScore: calculateNewScore(agent)
};

// Job closed, queue cleared
markingJob.status = "COMPLETED";
```

#### Step 3B: No Confirmation (Owner Doesn't Respond Within 2 Days)
```typescript
// After 2 days, first partial payment
const partialPayment1 = {
  agentReceives: 1000,
  platformReceives: 0,
  canWithdraw: true,
  note: "Partial payment 1/5"
};

// Remaining debt tracking
const remainingDebt = {
  totalOwed: 5000,
  paid: 1000,
  remaining: 4000,
  installments: [
    { amount: 1000, dueDate: "2 days", status: "PAID" },
    { amount: 1000, dueDate: "4 days", status: "PENDING" },
    { amount: 1000, dueDate: "6 days", status: "PENDING" },
    { amount: 1000, dueDate: "8 days", status: "PENDING" },
    { amount: 1000, dueDate: "10 days", status: "PENDING" }
  ]
};

// Every 2 days, release ₦1,000 to agent
// After 5 installments (10 days total), full ₦5,000 paid
```

#### Step 3C: Late Confirmation (Owner Confirms After Partial Payments)
```typescript
// Example: Owner confirms after 6 days (3 partial payments made)
const lateConfirmation = {
  confirmedAt: new Date(),
  alreadyPaid: 3000,      // 3 x ₦1,000 partial payments
  remainingDue: 2000      // ₦5,000 - ₦3,000
};

// Release remaining balance immediately
const finalPayment = {
  agentReceives: 2000,
  platformReceives: 15000, // Platform fee released on confirmation
  totalAgentEarnings: 5000
};
```

---

## Compensation Calculation Logic

### Agent Compensation Formula
```typescript
function calculateAgentCompensation(markingFee: number): CompensationBreakdown {
  const AGENT_PERCENTAGE = 0.25; // 25%
  const PLATFORM_PERCENTAGE = 0.75; // 75%
  
  return {
    agentCompensation: markingFee * AGENT_PERCENTAGE,
    platformFee: markingFee * PLATFORM_PERCENTAGE,
    initialAdvance: 1000,
    remainingOnConfirmation: (markingFee * AGENT_PERCENTAGE) - 1000
  };
}

// Example
const breakdown = calculateAgentCompensation(20000);
// {
//   agentCompensation: 5000,
//   platformFee: 15000,
//   initialAdvance: 1000,
//   remainingOnConfirmation: 4000
// }
```

### Partial Payment Schedule
```typescript
function calculatePartialPayments(totalCompensation: number, initialAdvance: number): PartialPayment[] {
  const remaining = totalCompensation - initialAdvance;
  const numberOfInstallments = 5;
  const installmentAmount = remaining / numberOfInstallments;
  
  const payments: PartialPayment[] = [
    {
      installment: 0,
      amount: initialAdvance,
      dueDate: new Date(), // Paid on marking completion
      status: "PAID",
      dayOffset: 0
    }
  ];
  
  for (let i = 1; i <= numberOfInstallments; i++) {
    payments.push({
      installment: i,
      amount: installmentAmount,
      dueDate: new Date(Date.now() + (i * 2 * 24 * 60 * 60 * 1000)),
      status: "PENDING",
      dayOffset: i * 2 // Every 2 days
    });
  }
  
  return payments;
}

// Example
const schedule = calculatePartialPayments(5000, 1000);
// [
//   { installment: 0, amount: 1000, dayOffset: 0, status: "PAID" },
//   { installment: 1, amount: 1000, dayOffset: 2, status: "PENDING" },
//   { installment: 2, amount: 1000, dayOffset: 4, status: "PENDING" },
//   { installment: 3, amount: 1000, dayOffset: 6, status: "PENDING" },
//   { installment: 4, amount: 1000, dayOffset: 8, status: "PENDING" },
//   { installment: 5, amount: 1000, dayOffset: 10, status: "PENDING" }
// ]
```

---

## Virtual Account Integration

### Payment Holding
```typescript
// When property owner pays
const paymentHold = {
  amount: 20000,
  status: "HELD",
  heldAt: new Date(),
  releaseConditions: {
    agentPortion: 5000,
    platformPortion: 15000,
    releaseOnConfirmation: true,
    partialReleaseSchedule: calculatePartialPayments(5000, 1000)
  }
};
```

### Agent Virtual Account
```typescript
// Agent receives payments to virtual account
const agentVirtualAccount = {
  userId: "agent_789",
  balance: 0, // Updated as payments release
  pendingBalance: 5000, // Total expected
  withdrawable: 0, // Only confirmed amounts
  held: 1000 // Initial advance, not yet withdrawable
};
```

### Payment Release Triggers
```typescript
enum PaymentReleaseTrigger {
  OWNER_CONFIRMATION = "OWNER_CONFIRMATION",
  TIMEOUT_PARTIAL = "TIMEOUT_PARTIAL",
  ADMIN_OVERRIDE = "ADMIN_OVERRIDE"
}

async function releasePayment(jobId: string, trigger: PaymentReleaseTrigger) {
  const job = await getMarkingJob(jobId);
  
  switch (trigger) {
    case "OWNER_CONFIRMATION":
      // Release all remaining funds immediately
      await releaseFullCompensation(job);
      break;
      
    case "TIMEOUT_PARTIAL":
      // Release next installment
      await releaseNextInstallment(job);
      break;
      
    case "ADMIN_OVERRIDE":
      // Admin can force release or hold
      await adminOverridePayment(job);
      break;
  }
}
```

---

## Edge Cases & Special Scenarios

### Multiple Queue Attempts
```typescript
// If first agent fails, second agent gets the job
const queueFailover = {
  firstAgent: {
    assignedAt: new Date("2025-01-01T10:00:00"),
    timeSlotExpiry: new Date("2025-01-01T13:00:00"),
    status: "EXPIRED", // Didn't complete in 3 hours
    compensation: 0 // No payment
  },
  secondAgent: {
    assignedAt: new Date("2025-01-01T13:01:00"),
    timeSlotExpiry: new Date("2025-01-01T16:01:00"),
    status: "COMPLETED",
    compensation: 5000 // Only second agent gets paid
  }
};
```

### Cancellation by Property Owner
```typescript
// Owner cancels before agent marks
const cancellation = {
  cancelledAt: new Date(),
  refund: {
    amount: 20000, // Full refund
    platformFee: 0, // No platform fee charged
    reason: "Owner cancelled before marking"
  }
};

// Owner cancels after agent marks but before confirmation
const lateCancellation = {
  cancelledAt: new Date(),
  agentCompensation: 2000, // Partial compensation for effort
  ownerRefund: 18000,
  platformFee: 0
};
```

### Dispute Resolution
```typescript
// Owner disputes marking quality
const dispute = {
  jobId: "job_123",
  disputeReason: "Boundary incorrectly marked",
  status: "UNDER_REVIEW",
  agentPayment: "HELD", // Hold all payments pending review
  adminReview: {
    reviewedBy: "admin_456",
    decision: "REMARK_REQUIRED",
    resolution: {
      originalAgent: 2500, // 50% compensation
      newMarkingJob: true, // Create new job
      ownerCharge: 0 // No additional charge to owner
    }
  }
};
```

---

## Commission Tracking

### Agent Earnings Dashboard
```typescript
interface AgentEarnings {
  totalJobs: number;
  completedJobs: number;
  totalEarnings: number;
  pendingEarnings: number;
  withdrawableBalance: number;
  
  breakdown: {
    confirmedJobs: {
      count: number;
      earnings: number;
    };
    partialPaymentJobs: {
      count: number;
      paidSoFar: number;
      stillPending: number;
    };
  };
  
  paymentHistory: PaymentRecord[];
}
```

### Platform Revenue Tracking
```typescript
interface PlatformRevenue {
  totalMarkingRevenue: number;
  agentPayouts: number;
  netRevenue: number;
  
  breakdown: {
    agentMarkings: {
      count: number;
      revenue: number;
    };
    adminMarkings: {
      count: number;
      revenue: number;
    };
  };
}
```

---

## Automated Payment Processing

### Cron Job Schedule
```typescript
// Run every hour
const paymentProcessingCron = {
  schedule: "0 * * * *", // Every hour
  
  tasks: [
    {
      name: "Process Partial Payments",
      action: async () => {
        const duePayments = await getPartialPaymentsDue();
        for (const payment of duePayments) {
          await releasePartialPayment(payment);
        }
      }
    },
    {
      name: "Check Confirmation Deadlines",
      action: async () => {
        const expiredJobs = await getJobsPastConfirmationDeadline();
        for (const job of expiredJobs) {
          await startPartialPaymentSchedule(job);
        }
      }
    },
    {
      name: "Clean Up Expired Jobs",
      action: async () => {
        const veryOldJobs = await getJobsOlderThan(30); // 30 days
        for (const job of veryOldJobs) {
          await finalizeAndArchive(job);
        }
      }
    }
  ]
};
```

---

## API Endpoints for Compensation

### Get Compensation Breakdown
```
GET /api/marking-service/compensation/:jobId
Response: {
  jobId: string;
  markingFee: number;
  agentCompensation: number;
  platformFee: number;
  paymentStatus: string;
  breakdown: CompensationBreakdown;
}
```

### Get Agent Earnings
```
GET /api/marking-service/agents/:agentId/earnings
Response: {
  totalEarnings: number;
  pendingEarnings: number;
  withdrawable: number;
  paymentHistory: PaymentRecord[];
}
```

### Request Withdrawal
```
POST /api/marking-service/agents/:agentId/withdraw
Body: {
  amount: number;
  bankDetails: BankDetails;
}
Response: {
  withdrawalId: string;
  status: string;
  processingTime: string;
}
```

---

## Security & Compliance

### Payment Security
- All payments processed through Flutterwave
- Virtual accounts for secure fund holding
- Automated reconciliation daily
- Transaction logs for audit trail

### Fraud Prevention
- Monitor abnormal marking patterns
- Flag rapid job acceptance/completion
- Verify agent location during marking
- Cross-reference with property location

### Tax Compliance
- Generate 1099 equivalents for agents
- Track all payouts for tax reporting
- Provide earning statements quarterly

---

## Testing Scenarios

### Test Case 1: Successful Flow
```typescript
describe("Successful Marking with Confirmation", () => {
  it("should pay agent full amount on confirmation", async () => {
    // 1. Create job, owner pays ₦20,000
    // 2. Agent marks, receives ₦1,000 advance
    // 3. Owner confirms within 2 days
    // 4. Agent receives remaining ₦4,000
    // 5. Platform receives ₦15,000
  });
});
```

### Test Case 2: No Confirmation Flow
```typescript
describe("No Confirmation Partial Payments", () => {
  it("should pay agent in installments", async () => {
    // 1. Create job, owner pays ₦20,000
    // 2. Agent marks, receives ₦1,000 advance
    // 3. No confirmation after 2 days
    // 4. Release ₦1,000 every 2 days for 10 days
    // 5. Total ₦5,000 paid to agent
  });
});
```

---

## Monitoring & Alerts

### Key Metrics
- Average confirmation time
- Percentage of confirmed vs. partial payment jobs
- Agent earnings per job
- Platform revenue per job
- Payment processing failures

### Alerts
- Payment release failures
- Abnormal compensation patterns
- Agent withdrawal issues
- Dispute rate exceeds threshold

---

**Last Updated:** October 14, 2025  
**Version:** 1.0  
**Owner:** Newcondo Development Team