# Marking Job Management API Documentation

## Base URL
```
https://api.newcondo.ng/v1/marking
```

## Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Table of Contents
1. [Job Management](#job-management)
2. [Queue System](#queue-system)
3. [Assignment](#assignment)
4. [Completion](#completion)
5. [Verification](#verification)
6. [Agent Location](#agent-location)
7. [Notifications](#notifications)
8. [Analytics](#analytics)

---

## Job Management

### Create Marking Job
Create a new property marking job.

**Endpoint:** `POST /jobs`

**Request Body:**
```json
{
  "propertyId": "prop_123abc",
  "markingOption": "ASSIGN_TO_AGENTS", // SELF_MARK | KNOWN_PERSON | ASSIGN_TO_AGENTS | ASSIGN_TO_ADMIN
  "contactPersonName": "John Doe",
  "contactPersonPhone": "+2348012345678",
  "accessInstructions": "Gate code is 1234. Contact caretaker if needed.",
  "preferredTime": "2025-10-25T10:00:00Z",
  "urgencyLevel": "NORMAL", // LOW | NORMAL | HIGH | URGENT
  "propertyLocation": {
    "state": "Lagos",
    "lga": "Ikeja",
    "location": "Allen Avenue"
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "jobId": "job_456def",
    "propertyId": "prop_123abc",
    "status": "QUEUED",
    "markingFee": 20000,
    "paymentStatus": "PENDING",
    "shareableLink": "https://newcondo.ng/mark/token_xyz", // Only if markingOption is KNOWN_PERSON
    "queuePosition": null,
    "maxCompletionTime": "2025-10-27T10:00:00Z",
    "createdAt": "2025-10-25T08:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request data
- `404 Not Found`: Property not found
- `403 Forbidden`: Not authorized to create job for this property
- `409 Conflict`: Active marking job already exists for property

---

### Get Marking Job Details
Retrieve details of a specific marking job.

**Endpoint:** `GET /jobs/:jobId`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "job_456def",
    "propertyId": "prop_123abc",
    "requestedBy": "user_123",
    "assignedAgentId": "agent_789",
    "status": "IN_PROGRESS",
    "contactPerson": {
      "name": "John Doe",
      "phone": "+2348012345678"
    },
    "accessInstructions": "Gate code is 1234",
    "preferredTime": "2025-10-25T10:00:00Z",
    "urgencyLevel": "NORMAL",
    "markingFee": 20000,
    "paymentStatus": "SUCCESS",
    "assignedAt": "2025-10-25T08:30:00Z",
    "timeSlotExpiry": "2025-10-25T11:30:00Z",
    "timeRemaining": "2h 45m",
    "queuePosition": null,
    "maxCompletionTime": "2025-10-27T10:00:00Z",
    "property": {
      "title": "3 Bedroom Apartment",
      "address": "15 Allen Avenue, Ikeja, Lagos",
      "location": {
        "state": "Lagos",
        "lga": "Ikeja",
        "location": "Allen Avenue"
      },
      "images": ["url1", "url2"]
    },
    "assignedAgent": {
      "name": "Jane Smith",
      "phone": "+2348087654321",
      "reliabilityScore": 4.5,
      "completedJobs": 45
    },
    "completionData": null,
    "createdAt": "2025-10-25T08:00:00Z",
    "updatedAt": "2025-10-25T08:30:00Z"
  }
}
```

---

### List My Marking Jobs
Get all marking jobs for the authenticated user.

**Endpoint:** `GET /jobs`

**Query Parameters:**
- `status` (optional): Filter by status (QUEUED, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED, EXPIRED)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `sortBy` (optional): Sort field (createdAt, status, urgencyLevel)
- `sortOrder` (optional): Sort order (asc, desc)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "job_456def",
        "propertyId": "prop_123abc",
        "status": "COMPLETED",
        "markingFee": 20000,
        "paymentStatus": "SUCCESS",
        "assignedAgentId": "agent_789",
        "completedAt": "2025-10-25T11:00:00Z",
        "property": {
          "title": "3 Bedroom Apartment",
          "address": "15 Allen Avenue, Ikeja, Lagos"
        },
        "createdAt": "2025-10-25T08:00:00Z"
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

---

### Cancel Marking Job
Cancel an active marking job (only if not yet assigned).

**Endpoint:** `DELETE /jobs/:jobId`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Marking job cancelled successfully",
  "data": {
    "jobId": "job_456def",
    "status": "CANCELLED",
    "refundAmount": 20000,
    "refundStatus": "PROCESSING"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Job already assigned or completed
- `404 Not Found`: Job not found
- `403 Forbidden`: Not authorized to cancel this job

---

## Queue System

### Get Queue Status
Get current queue status for a marking job.

**Endpoint:** `GET /jobs/:jobId/queue`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "jobId": "job_456def",
    "queueLength": 5,
    "currentPosition": 2,
    "estimatedWaitTime": "1h 30m",
    "agentsInQueue": [
      {
        "position": 1,
        "agentId": "agent_xyz",
        "timeSlotStart": "2025-10-25T09:00:00Z",
        "timeSlotExpiry": "2025-10-25T12:00:00Z",
        "timeRemaining": "45m"
      },
      {
        "position": 2,
        "agentId": "agent_abc",
        "status": "WAITING"
      }
    ]
  }
}
```

---

### Join Queue (Agent)
Agent joins the queue for a marking job.

**Endpoint:** `POST /jobs/:jobId/queue/join`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Successfully joined queue",
  "data": {
    "jobId": "job_456def",
    "queuePosition": 3,
    "estimatedWaitTime": "3h",
    "currentActiveAgent": "agent_xyz",
    "yourTurnAt": "2025-10-25T15:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Already in queue or job not available
- `403 Forbidden`: Not authorized to join queue (not an agent/premium renter)
- `409 Conflict`: Maximum queue capacity reached

---

### Leave Queue (Agent)
Agent leaves the queue for a marking job.

**Endpoint:** `POST /jobs/:jobId/queue/leave`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Successfully left queue",
  "data": {
    "jobId": "job_456def",
    "leftAt": "2025-10-25T09:30:00Z"
  }
}
```

---

## Assignment

### Get Available Jobs (Agent)
Get marking jobs available in agent's service area.

**Endpoint:** `GET /jobs/available`

**Query Parameters:**
- `radius` (optional): Search radius in km (default: 10)
- `urgencyLevel` (optional): Filter by urgency
- `minFee` (optional): Minimum marking fee
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "job_456def",
        "propertyId": "prop_123abc",
        "urgencyLevel": "NORMAL",
        "markingFee": 20000,
        "agentCompensation": 5000,
        "preferredTime": "2025-10-25T10:00:00Z",
        "distance": "2.5 km",
        "property": {
          "title": "3 Bedroom Apartment",
          "address": "15 Allen Avenue, Ikeja, Lagos",
          "location": {
            "state": "Lagos",
            "lga": "Ikeja",
            "location": "Allen Avenue"
          },
          "images": ["url1"]
        },
        "queueLength": 2,
        "maxCompletionTime": "2025-10-27T10:00:00Z",
        "createdAt": "2025-10-25T08:00:00Z"
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

---

### Accept Job Assignment (Agent)
Accept a marking job from the queue (when it's your turn).

**Endpoint:** `POST /jobs/:jobId/accept`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Job assignment accepted",
  "data": {
    "jobId": "job_456def",
    "status": "IN_PROGRESS",
    "timeSlotExpiry": "2025-10-25T12:00:00Z",
    "timeRemaining": "3h",
    "contactPerson": {
      "name": "John Doe",
      "phone": "+2348012345678"
    },
    "accessInstructions": "Gate code is 1234",
    "property": {
      "address": "15 Allen Avenue, Ikeja, Lagos",
      "coordinates": {
        "lat": 6.5244,
        "lng": 3.3792
      },
      "images": ["url1", "url2"]
    }
  }
}
```

**Error Responses:**
- `400 Bad Request`: Not your turn in queue or already assigned
- `403 Forbidden`: Not authorized
- `404 Not Found`: Job not found

---

## Completion

### Submit Job Completion
Submit completed marking job with photos and boundary data.

**Endpoint:** `POST /jobs/:jobId/complete`

**Request Body (multipart/form-data):**
```
images: File[] (required, max 10 images)
boundaryData: JSON (required)
completionNotes: String (optional)
```

**Boundary Data Format:**
```json
{
  "coordinates": [
    { "lat": 6.524400, "lng": 3.379200 },
    { "lat": 6.524450, "lng": 3.379200 },
    { "lat": 6.524450, "lng": 3.379250 },
    { "lat": 6.524400, "lng": 3.379250 }
  ],
  "centerPoint": { "lat": 6.524425, "lng": 3.379225 },
  "area": "120 sqm",
  "markedAt": "2025-10-25T11:00:00Z"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Marking job completed successfully",
  "data": {
    "jobId": "job_456def",
    "status": "COMPLETED",
    "completedAt": "2025-10-25T11:00:00Z",
    "completionImages": [
      "https://cdn.newcondo.ng/images/marking_1.jpg",
      "https://cdn.newcondo.ng/images/marking_2.jpg"
    ],
    "boundaryData": { /* boundary coordinates */ },
    "payment": {
      "initialPayment": 1000,
      "status": "HELD",
      "fullPaymentPending": true,
      "verificationDeadline": "2025-10-28T11:00:00Z"
    },
    "timeTaken": "2h 30m"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid images or boundary data
- `403 Forbidden`: Not the assigned agent
- `409 Conflict`: Job already completed
- `413 Payload Too Large`: Image files too large

---

### Upload Additional Images
Upload additional images for a completed job.

**Endpoint:** `POST /jobs/:jobId/images`

**Request Body (multipart/form-data):**
```
images: File[] (max 5 additional images)
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Images uploaded successfully",
  "data": {
    "uploadedImages": [
      "https://cdn.newcondo.ng/images/marking_3.jpg"
    ],
    "totalImages": 8
  }
}
```

---

## Verification

### Verify Completed Job (Property Owner)
Verify and approve a completed marking job.

**Endpoint:** `POST /jobs/:jobId/verify`

**Request Body:**
```json
{
  "approved": true,
  "feedback": "Great job! Property correctly marked.",
  "rating": 5
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Marking job verified successfully",
  "data": {
    "jobId": "job_456def",
    "verifiedAt": "2025-10-25T13:00:00Z",
    "agentPayment": {
      "totalAmount": 5000,
      "initialPayment": 1000,
      "remainingPayment": 4000,
      "status": "RELEASED",
      "releasedAt": "2025-10-25T13:00:00Z"
    },
    "property": {
      "boundaryVerified": true,
      "status": "PUBLISHED"
    }
  }
}
```

---

### Reject Completed Job (Property Owner)
Reject a completed marking job.

**Endpoint:** `POST /jobs/:jobId/reject`

**Request Body:**
```json
{
  "reason": "Wrong property marked",
  "details": "The agent marked the wrong building"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Marking job rejected",
  "data": {
    "jobId": "job_456def",
    "status": "QUEUED",
    "rejectedAt": "2025-10-25T13:00:00Z",
    "agentCompensation": {
      "amount": 1000,
      "status": "PAID",
      "reason": "Partial compensation for attempt"
    },
    "nextSteps": "Job returned to queue for reassignment"
  }
}
```

---

### Get Verification Status
Check verification status and deadline.

**Endpoint:** `GET /jobs/:jobId/verification`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "jobId": "job_456def",
    "completedAt": "2025-10-25T11:00:00Z",
    "verificationDeadline": "2025-10-28T11:00:00Z",
    "timeRemaining": "2 days 22h",
    "autoCompensationCycles": {
      "total": 5,
      "completed": 0,
      "remaining": 5,
      "amountPerCycle": 1000
    },
    "verified": false,
    "canVerify": true
  }
}
```

---

## Agent Location

### Update Service Areas (Agent)
Update agent's service areas for job matching.

**Endpoint:** `PUT /agents/service-areas`

**Request Body:**
```json
{
  "serviceAreas": [
    {
      "state": "Lagos",
      "lgas": ["Ikeja", "Lekki", "Victoria Island"],
      "locations": ["Allen Avenue", "Awolowo Road"]
    },
    {
      "state": "Ogun",
      "lgas": ["Abeokuta North"],
      "locations": []
    }
  ],
  "isAvailableForMarking": true
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Service areas updated successfully",
  "data": {
    "serviceAreas": [
      "Lagos - Ikeja - Allen Avenue",
      "Lagos - Ikeja - Awolowo Road",
      "Lagos - Lekki",
      "Lagos - Victoria Island",
      "Ogun - Abeokuta North"
    ],
    "isAvailableForMarking": true,
    "totalCoverage": "5 areas"
  }
}
```

---

### Toggle Marking Availability (Agent)
Turn marking availability on or off.

**Endpoint:** `PATCH /agents/availability`

**Request Body:**
```json
{
  "isAvailable": false
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Availability updated",
  "data": {
    "isAvailableForMarking": false,
    "updatedAt": "2025-10-25T14:00:00Z"
  }
}
```

---

## Notifications

### Get Marking Notifications
Get all notifications related to marking jobs.

**Endpoint:** `GET /notifications`

**Query Parameters:**
- `unreadOnly` (optional): Only unread notifications (default: false)
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_123",
        "type": "JOB_AVAILABLE",
        "title": "New Marking Job Available",
        "message": "A new marking job is available 2.5km from you",
        "jobId": "job_456def",
        "priority": "NORMAL",
        "isRead": false,
        "createdAt": "2025-10-25T08:00:00Z"
      },
      {
        "i