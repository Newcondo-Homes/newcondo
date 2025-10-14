# Property Marking Service - Flow Diagrams

## Table of Contents
- [1. Marking Job Creation Flow](#1-marking-job-creation-flow)
- [2. Self-Marking Flow](#2-self-marking-flow)
- [3. Known Person Marking Flow](#3-known-person-marking-flow)
- [4. Newcondo Admin Marking Flow](#4-newcondo-admin-marking-flow)
- [5. Agent Assignment Flow](#5-agent-assignment-flow)
- [6. Queue Management Flow](#6-queue-management-flow)
- [7. Payment & Compensation Flow](#7-payment--compensation-flow)
- [8. Confirmation & Verification Flow](#8-confirmation--verification-flow)

---

## 1. Marking Job Creation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    MARKING JOB CREATION                         │
└─────────────────────────────────────────────────────────────────┘

Property Owner/Agent Initiates Marking
            │
            ├─→ Fill Property Details
            │   ├─→ Hierarchical Address Selection
            │   │   └─→ State → LGA → City → Location
            │   ├─→ Contact Person Details
            │   │   ├─→ Name
            │   │   ├─→ Phone Number
            │   │   └─→ Access Instructions
            │   └─→ Upload Property Images (Optional)
            │
            ├─→ Check User Eligibility
            │   ├─→ Role: OWNER or AGENT? ✓
            │   ├─→ Virtual Account Exists? ✓
            │   └─→ Email/Phone Verified? ✓
            │
            ├─→ Present Marking Options
            │   ├─→ [1] Mark Yourself
            │   ├─→ [2] Send to Known Person
            │   ├─→ [3] Assign to Newcondo Admin (₦25,000)
            │   └─→ [4] Assign to Nearby Agents (₦20,000)
            │
            └─→ Proceed to Selected Flow
```

---

## 2. Self-Marking Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      SELF-MARKING FLOW                          │
└─────────────────────────────────────────────────────────────────┘

Property Owner Selects "Mark Yourself"
            │
            ├─→ No Payment Required
            │
            ├─→ Navigate to Marking Interface
            │   ├─→ Auto-detect GPS Location
            │   ├─→ Load Satellite Map View
            │   ├─→ Auto-zoom to Property Level
            │   └─→ Draw Boundary Mask Tool Enabled
            │
            ├─→ Property Owner Draws Mask
            │   ├─→ Validate Mask Size
            │   ├─→ Check for Duplicate Properties
            │   │   └─→ If duplicate found: Show red overlay + error
            │   └─→ Capture Boundary Coordinates
            │
            ├─→ Upload Key Property Images
            │   ├─→ Upload Exterior Photos
            │   ├─→ Upload Key Rooms
            │   └─→ Add Image Descriptions
            │
            ├─→ Submit Marking
            │   ├─→ Save Boundary Data
            │   ├─→ Create Building Fingerprint
            │   └─→ Update Property Status → BOUNDARY_MARKED
            │
            └─→ Property Ready for Listing
                └─→ Notification: "Property marked successfully"
```

---

## 3. Known Person Marking Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  KNOWN PERSON MARKING FLOW                      │
└─────────────────────────────────────────────────────────────────┘

Property Owner Selects "Send to Known Person"
            │
            ├─→ No Payment Required
            │
            ├─→ Generate Shareable Marking Link
            │   ├─→ Link Format: /mark/[jobId]/[token]
            │   ├─→ Link Valid for: 7 days
            │   └─→ Copy Link / Share via SMS/WhatsApp
            │
            ├─→ Property Owner Shares Link
            │   └─→ Notification: "Marking link sent"
            │
            ├─→ Known Person Opens Link
            │   ├─→ View Property Details
            │   ├─→ View Contact Information
            │   ├─→ View Access Instructions
            │   └─→ See Property Images (if provided)
            │
            ├─→ Known Person Arrives at Property
            │   ├─→ Auto-detect GPS Location
            │   ├─→ Verify Proximity (within 500m)
            │   └─→ Enable Marking Interface
            │
            ├─→ Known Person Marks Property
            │   ├─→ Draw Boundary Mask
            │   ├─→ Upload Property Images
            │   └─→ Submit Marking
            │
            ├─→ Notify Property Owner
            │   └─→ "Your property has been marked by [Name]"
            │
            └─→ Property Owner Confirms
                ├─→ Review Boundary
                ├─→ Review Images
                └─→ Approve/Reject Marking
                    ├─→ If Approved: Property Ready for Listing
                    └─→ If Rejected: Request Re-marking
```

---

## 4. Newcondo Admin Marking Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                 NEWCONDO ADMIN MARKING FLOW                     │
└─────────────────────────────────────────────────────────────────┘

Property Owner Selects "Assign to Newcondo Admin"
            │
            ├─→ Display Fee: ₦25,000
            │
            ├─→ Initiate Payment
            │   ├─→ Create Payment Session
            │   ├─→ Flutterwave Integration
            │   └─→ Payment Status: PENDING
            │
            ├─→ Payment Successful?
            │   ├─→ NO: Cancel Marking Job
            │   └─→ YES: Proceed
            │
            ├─→ Create Marking Job
            │   ├─→ Status: ASSIGNED_TO_ADMIN
            │   ├─→ Payment: HELD (₦25,000)
            │   └─→ Assign to Admin Queue
            │
            ├─→ Notify Admin Dashboard
            │   └─→ New marking job alert
            │
            ├─→ Admin Assigns to Field Agent
            │   ├─→ Select Available Admin Agent
            │   ├─→ Provide Property Details
            │   └─→ Set Completion Deadline
            │
            ├─→ Admin Agent Marks Property
            │   ├─→ Visit Property
            │   ├─→ Draw Boundary Mask
            │   ├─→ Upload High-Quality Images
            │   └─→ Submit Marking
            │
            ├─→ Admin Reviews Marking
            │   ├─→ Validate Boundary
            │   ├─→ Check Image Quality
            │   └─→ Approve Marking
            │
            ├─→ Notify Property Owner
            │   └─→ "Property marked by Newcondo team"
            │
            ├─→ Property Owner Confirms
            │   ├─→ Within 2-3 days
            │   └─→ Review & Approve
            │
            └─→ Release Payment
                └─→ Full ₦25,000 to Newcondo
```

---

## 5. Agent Assignment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   AGENT ASSIGNMENT FLOW                         │
└─────────────────────────────────────────────────────────────────┘

Property Owner Selects "Assign to Nearby Agents"
            │
            ├─→ Display Fee: ₦20,000
            │
            ├─→ Initiate Payment
            │   ├─→ Create Payment Session
            │   ├─→ Flutterwave Integration
            │   └─→ Payment Status: PENDING
            │
            ├─→ Payment Successful?
            │   ├─→ NO: Cancel Marking Job
            │   └─→ YES: Proceed
            │
            ├─→ Create Marking Job
            │   ├─→ Status: QUEUED
            │   ├─→ Payment: HELD (₦20,000)
            │   └─→ Calculate Property Location
            │
            ├─→ Find Eligible Agents
            │   ├─→ Proximity Algorithm (see PROXIMITY.md)
            │   │   ├─→ Within 25km radius
            │   │   └─→ Same State/LGA priority
            │   ├─→ Filter by Availability
            │   │   ├─→ isAvailableForMarking = true
            │   │   └─→ Not currently on another job
            │   └─→ Sort by Reliability Score
            │
            ├─→ Broadcast Job to Agents
            │   ├─→ Push Notification
            │   ├─→ SMS Notification
            │   └─→ In-App Alert
            │
            ├─→ Agents Accept Job (First-Come-First-Served)
            │   ├─→ Agent 1 Accepts → Queued (Position 1)
            │   ├─→ Agent 2 Accepts → Queued (Position 2)
            │   ├─→ Agent 3 Accepts → Queued (Position 3)
            │   └─→ Max 10 agents in queue
            │
            ├─→ Assign to First Agent
            │   ├─→ Status: ASSIGNED
            │   ├─→ Time Slot: 3 hours
            │   ├─→ Timer Starts
            │   └─→ Notify Agent
            │
            └─→ Monitor Completion
                └─→ See Queue Management Flow
```

---

## 6. Queue Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   QUEUE MANAGEMENT FLOW                         │
└─────────────────────────────────────────────────────────────────┘

Queue: [Agent1] [Agent2] [Agent3] [Agent4] ...
         └─ Active (3hr window)

Agent1 (Active) - 3 Hour Timer Running
            │
            ├─→ SCENARIO A: Agent Completes Within 3 Hours
            │   ├─→ Upload Boundary + Images
            │   ├─→ Partial Payment: ₦1,000 to Agent
            │   ├─→ Status: IN_PROGRESS → PENDING_CONFIRMATION
            │   ├─→ Notify Property Owner
            │   ├─→ Clear Queue (Release all waiting agents)
            │   └─→ Await Owner Confirmation
            │
            ├─→ SCENARIO B: Agent Fails Within 3 Hours
            │   ├─→ Timer Expires
            │   ├─→ Agent Status: FAILED
            │   ├─→ No Payment to Agent
            │   ├─→ Assign to Next in Queue (Agent2)
            │   ├─→ Agent2 Timer Starts (3 hours)
            │   └─→ Repeat Process
            │
            └─→ SCENARIO C: All Agents Fail
                ├─→ After 10 failed attempts
                ├─→ Notify Property Owner
                ├─→ Options:
                │   ├─→ Increase Compensation
                │   ├─→ Switch to Admin Marking
                │   └─→ Request Refund
                └─→ Job Status: EXPIRED

Property Owner Confirmation Window (2-3 Days)
            │
            ├─→ SCENARIO D: Owner Confirms Within 2-3 Days
            │   ├─→ Review Boundary ✓
            │   ├─→ Review Images ✓
            │   ├─→ Approve Marking
            │   ├─→ Release Remaining Payment to Agent
            │   │   └─→ ₦5,000 - ₦1,000 = ₦4,000
            │   ├─→ Platform Fee: ₦15,000 to Newcondo
            │   └─→ Property Status: BOUNDARY_VERIFIED
            │
            ├─→ SCENARIO E: Owner Doesn't Confirm (Timeout)
            │   ├─→ After 2-3 days
            │   ├─→ Partial Compensation Cycle Begins
            │   ├─→ Release ₦1,000 to Agent (1st payment)
            │   ├─→ Remaining: ₦19,000
            │   ├─→ Wait another 2-3 days
            │   ├─→ Release ₦1,000 (2nd payment)
            │   ├─→ Continue until ₦20,000 fully paid
            │   └─→ Job Closed
            │
            └─→ SCENARIO F: Owner Rejects Marking
                ├─→ Provide Rejection Reason
                ├─→ Job Status: REJECTED
                ├─→ No further payment to Agent
                ├─→ Owner Must Create New Marking Job
                └─→ New Job = New ₦20,000 Payment
```

---

## 7. Payment & Compensation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              PAYMENT & COMPENSATION FLOW                        │
└─────────────────────────────────────────────────────────────────┘

Marking Job Payment: ₦20,000 (Agent Assignment)
            │
            ├─→ Initial Payment Hold
            │   ├─→ Property Owner Pays ₦20,000
            │   ├─→ Status: HELD
            │   └─→ Held in Newcondo Account
            │
            ├─→ Agent Completes Marking
            │   ├─→ Within 3-hour window
            │   └─→ Uploads boundary + images
            │
            ├─→ Immediate Partial Payment
            │   ├─→ Release ₦1,000 to Agent Virtual Account
            │   ├─→ Status: LOCKED (can't withdraw)
            │   ├─→ Remaining: ₦19,000 HELD
            │   └─→ Notify Agent: "Partial payment received"
            │
            ├─→ Owner Confirms (Within 2-3 Days)
            │   ├─→ Approve marking ✓
            │   └─→ Trigger Final Payment
            │
            ├─→ Final Payment Distribution
            │   ├─→ Agent Commission: 25% of ₦20,000 = ₦5,000
            │   │   └─→ Already paid: ₦1,000
            │   │   └─→ Release remaining: ₦4,000
            │   │   └─→ Status: AVAILABLE (can withdraw)
            │   │
            │   └─→ Platform Fee: 75% of ₦20,000 = ₦15,000
            │       └─→ To Newcondo Revenue Account
            │
            └─→ Payment Complete
                ├─→ Update Agent Stats
                │   ├─→ totalMarkingJobs++
                │   ├─→ completedMarkingJobs++
                │   └─→ Adjust reliabilityScore
                │
                └─→ Close Marking Job

Timeout Compensation Flow (No Owner Confirmation)
            │
            ├─→ Day 1-3: ₦1,000 paid (on completion)
            ├─→ Day 4-6: ₦1,000 paid (timeout #1)
            ├─→ Day 7-9: ₦1,000 paid (timeout #2)
            ├─→ Continue every 2-3 days
            └─→ After ~60 days: Full ₦20,000 paid to Agent
```

---

## 8. Confirmation & Verification Flow

```
┌─────────────────────────────────────────────────────────────────┐
│            CONFIRMATION & VERIFICATION FLOW                     │
└─────────────────────────────────────────────────────────────────┘

Agent Completes Marking
            │
            ├─→ Notify Property Owner
            │   ├─→ Push Notification
            │   ├─→ Email Alert
            │   └─→ SMS Notification
            │
            ├─→ Owner Review Interface
            │   ├─→ View Boundary Mask on Map
            │   ├─→ View Uploaded Property Images
            │   ├─→ Review Agent Notes
            │   └─→ Compare with Property Address
            │
            ├─→ Owner Decision (Within 2-3 Days)
            │   │
            │   ├─→ APPROVE
            │   │   ├─→ Confirm boundary is correct
            │   │   ├─→ Confirm images are accurate
            │   │   ├─→ Release payment to agent
            │   │   ├─→ Property Status: BOUNDARY_VERIFIED
            │   │   ├─→ Enable Property Listing
            │   │   └─→ Notify Agent: "Payment released"
            │   │
            │   ├─→ REJECT
            │   │   ├─→ Provide rejection reason
            │   │   │   ├─→ Wrong property marked
            │   │   │   ├─→ Poor image quality
            │   │   │   ├─→ Incorrect boundary
            │   │   │   └─→ Other (specify)
            │   │   ├─→ No payment to agent
            │   │   ├─→ Job Status: REJECTED
            │   │   ├─→ Owner must create new job
            │   │   └─→ Notify Agent: "Marking rejected"
            │   │
            │   └─→ NO RESPONSE (Timeout)
            │       ├─→ After 2-3 days
            │       ├─→ Partial compensation begins
            │       ├─→ ₦1,000 every 2-3 days
            │       └─→ Until full ₦20,000 paid
            │
            └─→ Post-Confirmation Actions
                ├─→ Update Agent Reliability Score
                ├─→ Update Property Status
                ├─→ Store Building Fingerprint
                └─→ Enable Anti-Duplicate System
```

---

## Error Handling & Edge Cases

### 1. Payment Failures
```
Payment Failed
    ├─→ Retry payment (max 3 attempts)
    ├─→ Switch payment method
    └─→ Cancel marking job if persistent failure
```

### 2. GPS/Location Errors
```
Location Detection Failed
    ├─→ Request manual location input
    ├─→ Use last known location
    └─→ Allow address-based fallback
```

### 3. Duplicate Property Detection
```
Duplicate Found
    ├─→ Show existing boundary (red overlay)
    ├─→ Display property owner details
    ├─→ Prevent new marking
    └─→ Option to report if incorrect
```

### 4. Agent No-Show
```
Agent Doesn't Complete Within 3 Hours
    ├─→ Auto-assign to next in queue
    ├─→ Penalty: Reduce reliability score
    └─→ After 3 failures: Temporary suspension
```

### 5. Network Interruptions
```
Network Failure During Marking
    ├─→ Auto-save draft boundary
    ├─→ Resume from last save point
    └─→ Notify user of saved progress
```

---

## Key Performance Indicators (KPIs)

1. **Average Marking Completion Time**: Target < 4 hours
2. **First-Agent Success Rate**: Target > 80%
3. **Owner Confirmation Rate**: Target > 90%
4. **Duplicate Prevention Accuracy**: Target > 99%
5. **Payment Processing Success**: Target > 99.5%

---

**Last Updated**: 2025-01-15  
**Version**: 1.0.0  
**Maintained By**: Newcondo Engineering Team