# Property Marking Service API Documentation

## Base URL

```
Production: https://api.newcondo.com/marking
Staging: https://staging-api.newcondo.com/marking
Development: http://localhost:4005
```

## Authentication

All endpoints require JWT authentication unless specified otherwise.

```http
Authorization: Bearer <jwt_token>
```

## Common Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { /* additional error info */ }
  }
}
```

---

## Marking Jobs API

### Create Marking Job

Create a new property marking job request.

**Endpoint:** `POST /api/marking-jobs`

**Request Body:**
```json
{
  "propertyId": "clxy123abc",
  "markingOption": "AGENT_ASSIGNMENT",
  "contactPersonName": "John Doe",
  "contactPersonPhone": "+2348012345678",
  "accessInstructions": "Gate code is 1234. Ask for the security guard.",
  "preferredTime": "2025-10-16T10:00:00Z",
  "urgencyLevel": "NORMAL",
  "proximityRadius": 10
}
```

**Fields:**
- `propertyId` (required): Property ID to be marked
- `markingOption` (required): One of `SELF_MARK`, `ADMIN_MARK`, `TRUSTED_PERSON`, `AGENT_ASSIGNMENT`
- `contactPersonName` (required): Contact person name
- `contactPersonPhone` (required): Contact person phone
- `accessInstructions` (optional): Instructions for accessing property
- `preferredTime` (optional): Preferred marking time
- `urgencyLevel` (optional): `LOW`, `NORMAL`, `HIGH`, `URGENT`
- `proximityRadius` (optional): Radius in km for agent search (default: 10)

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "clxy456def",
    "propertyId": "clxy123abc",
    "requestedBy": "user123",
    "markingFee": 20000,
    "paymentStatus": "PENDING",
    "status": "QUEUED",
    "paymentUrl": "https://checkout.flutterwave.com/...",
    "createdAt": "2025-10-14T12:00:00Z"
  },
  "message": "Marking job created successfully"
}
```

### Get Marking Job Details

**Endpoint:** `GET /api/marking-jobs/:id`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "clxy456def",
    "propertyId": "clxy123abc",
    "requestedBy": "user123",
    "assignedAgentId": "agent789",
    "contactPersonName": "John Doe",
    "contactPersonPhone": "+2348012345678",
    "accessInstructions": "Gate code is 1234",
    "preferredTime": "2025-10-16T10:00:00Z",
    "urgencyLevel": "NORMAL",
    "markingFee": 20000,
    "paymentStatus": "SUCCESS",
    "status": "IN_PROGRESS",
    "assignedAt": "2025-10-14T13:00:00Z",
    "timeSlotExpiry": "2025-10-14T16:00:00Z",
    "queuePosition": null,
    "property": {
      "title": "3 Bedroom Apartment",
      "address": "123 Main Street, Lagos"
    },
    "assignedAgent": {
      "name": "Agent Smith",
      "phone": "+2348087654321",
      "reliabilityScore": 4.5
    },
    "createdAt": "2025-10-14T12:00:00Z",
    "updatedAt": "2025-10-14T13:00:00Z"
  }
}
```

### List My Marking Jobs

**Endpoint:** `GET /api/marking-jobs`

**Query Parameters:**
- `status` (optional): Filter by status
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "clxy456def",
        "propertyId": "clxy123abc",
        "status": "COMPLETED",
        "markingFee": 20000,
        "assignedAgent": {
          "name": "Agent Smith"
        },
        "completedAt": "2025-10-14T15:00:00Z",
        "createdAt": "2025-10-14T12:00:00Z"
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

### Cancel Marking Job

**Endpoint:** `DELETE /api/marking-jobs/:id`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "clxy456def",
    "status": "CANCELLED",
    "refundAmount": 20000,
    "refundStatus": "PROCESSING"
  },
  "message": "Marking job cancelled successfully"
}
```

---

## Queue Management API

### Get Available Agents

Get agents available within proximity radius.

**Endpoint:** `GET /api/queue/available-agents`

**Query Parameters:**
- `latitude` (required): Property latitude
- `longitude` (required): Property longitude
- `radius` (optional): Search radius in km (default: 10)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "id": "agent789",
        "name": "Agent Smith",
        "reliabilityScore": 4.5,
        "totalMarkingJobs": 150,
        "completedMarkingJobs": 145,
        "currentActiveJobs": 1,
        "distance": 3.2,
        "serviceAreas": ["Lagos Island", "Victoria Island"]
      }
    ],
    "totalAgents": 25,
    "withinRadius": 15
  }
}
```

### Broadcast Job to Agents

**Endpoint:** `POST /api/queue/broadcast`

**Request Body:**
```json
{
  "markingJobId": "clxy456def",
  "radius": 10,
  "maxAgents": 50
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "markingJobId": "clxy456def",
    "notifiedAgents": 25,
    "queuePosition": 1,
    "estimatedWaitTime": "30 minutes"
  },
  "message": "Job broadcast to 25 agents"
}
```

### Join Queue (Agent)

**Endpoint:** `POST /api/queue/join`

**Request Body:**
```json
{
  "markingJobId": "clxy456def"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "queueId": "queue123",
    "markingJobId": "clxy456def",
    "queuePosition": 3,
    "estimatedWaitTime": "6 hours",
    "timeSlotDuration": "3 hours"
  },
  "message": "Successfully joined queue"
}
```

### Get Queue Status

**Endpoint:** `GET /api/queue/:markingJobId/status`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "markingJobId": "clxy456def",
    "totalInQueue": 5,
    "currentAgent": {
      "id": "agent111",
      "name": "Agent Jane",
      "timeSlotExpiry": "2025-10-14T16:00:00Z"
    },
    "myPosition": 3,
    "estimatedMyTurn": "2025-10-14T22:00:00Z"
  }
}
```

### Leave Queue (Agent)

**Endpoint:** `POST /api/queue/leave`

**Request Body:**
```json
{
  "markingJobId": "clxy456def"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Successfully left queue"
}
```

---

## Assignment API

### Accept Assignment (Agent)

**Endpoint:** `POST /api/assignments/:jobId/accept`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "markingJobId": "clxy456def",
    "status": "ASSIGNED",
    "assignedAt": "2025-10-14T13:00:00Z",
    "timeSlotExpiry": "2025-10-14T16:00:00Z",
    "upfrontPayment": 1000,
    "contactInfo": {
      "name": "John Doe",
      "phone": "+2348012345678"
    },
    "accessInstructions": "Gate code is 1234",
    "propertyDetails": {
      "address": "123 Main Street, Lagos",
      "coordinates": {
        "lat": 6.5244,
        "lng": 3.3792
      }
    }
  },
  "message": "Assignment accepted. You have 3 hours to complete."
}
```

### Start Marking (Agent)

**Endpoint:** `POST /api/assignments/:jobId/start`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "markingJobId": "clxy456def",
    "status": "IN_PROGRESS",
    "startedAt": "2025-10-14T13:30:00Z",
    "mustCompleteBy": "2025-10-14T16:30:00Z"
  },
  "message": "Marking started successfully"
}
```

### Get My Active Assignments (Agent)

**Endpoint:** `GET /api/assignments/my-active`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "assignments": [
      {
        "markingJobId": "clxy456def",
        "status": "IN_PROGRESS",
        "property": {
          "title": "3 Bedroom Apartment",
          "address": "123 Main Street, Lagos"
        },
        "timeSlotExpiry": "2025-10-14T16:00:00Z",
        "timeRemaining": "2 hours 15 minutes"
      }
    ]
  }
}
```

---

## Completion API

### Submit Completion (Agent)

**Endpoint:** `POST /api/completion/:jobId/submit`

**Request Body:**
```json
{
  "boundaryData": {
    "coordinates": [
      [6.5244, 3.3792],
      [6.5245, 3.3793],
      [6.5246, 3.3792],
      [6.5245, 3.3791]
    ]
  },
  "completionImages": [
    "https://cdn.newcondo.com/images/img1.jpg",
    "https://cdn.newcondo.com/images/img2.jpg"
  ],
  "completionNotes": "Property marked successfully. All rooms photographed.",
  "locationAccuracy": "HIGH"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "markingJobId": "clxy456def",
    "status": "COMPLETED",
    "completedAt": "2025-10-14T15:00:00Z",
    "upfrontPayment": 1000,
    "pendingPayment": 4000,
    "confirmationDeadline": "2025-10-17T15:00:00Z"
  },
  "message": "Marking submitted. Awaiting property owner confirmation."
}
```

### Confirm Marking (Property Owner)

**Endpoint:** `POST /api/completion/:jobId/confirm`

**Request Body:**
```json
{
  "confirmed": true,
  "feedback": "Great job! Property marked accurately.",
  "rating": 5
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "markingJobId": "clxy456def",
    "status": "CONFIRMED",
    "confirmedAt": "2025-10-14T16:00:00Z",
    "agentPayment": {
      "upfront": 1000,
      "final": 4000,
      "total": 5000,
      "released": true
    }
  },
  "message": "Marking confirmed. Payment released to agent."
}
```

### Reject Marking (Property Owner)

**Endpoint:** `POST /api/completion/:jobId/reject`

**Request Body:**
```json
{
  "reason": "Wrong property marked",
  "details": "The agent marked the building next door, not mine."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "markingJobId": "clxy456def",
    "status": "QUEUED",
    "rejectedAt": "2025-10-14T16:00:00Z",
    "compensationPaid": 500,
    "queueReopened": true
  },
  "message": "Marking rejected. Job returned to queue."
}
```

### Get Completion Details

**Endpoint:** `GET /api/completion/:jobId`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "markingJobId": "clxy456def",
    "status": "COMPLETED",
    "completedAt": "2025-10-14T15:00:00Z",
    "confirmationDeadline": "2025-10-17T15:00:00Z",
    "boundaryData": {
      "coordinates": [...]
    },
    "completionImages": [
      "https://cdn.newcondo.com/images/img1.jpg"
    ],
    "completionNotes": "Property marked successfully",
    "agent": {
      "name": "Agent Smith",
      "reliabilityScore": 4.5
    }
  }
}
```

---

## Shareable Link API (Trusted Person)

### Get Link Details

**Endpoint:** `GET /api/shareable/:linkToken`

**Authentication:** Not required

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "markingJobId": "clxy456def",
    "property": {
      "title": "3 Bedroom Apartment",
      "address": "123 Main Street, Lagos"
    },
    "instructions": "Please mark the property boundaries accurately",
    "expiresAt": "2025-10-20T12:00:00Z"
  }
}
```

### Submit Marking via Link

**Endpoint:** `POST /api/shareable/:linkToken/submit`

**Authentication:** Not required

**Request Body:**
```json
{
  "markerName": "Trusted Friend",
  "markerPhone": "+2348098765432",
  "boundaryData": {
    "coordinates": [...]
  },
  "completionImages": [
    "https://cdn.newcondo.com/images/img1.jpg"
  ]
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "markingJobId": "clxy456def",
    "status": "COMPLETED",
    "completedAt": "2025-10-14T15:00:00Z"
  },
  "message": "Marking submitted successfully"
}
```

---

## Admin Oversight API

### Get All Marking Jobs (Admin)

**Endpoint:** `GET /api/admin/marking-jobs`

**Required Role:** ADMIN

**Query Parameters:**
- `status` (optional): Filter by status
- `startDate` (optional): Filter from date
- `endDate` (optional): Filter to date
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:** `200 OK`

### Resolve Dispute (Admin)

**Endpoint:** `POST /api/admin/marking-jobs/:id/resolve`

**Required Role:** ADMIN

**Request Body:**
```json
{
  "resolution": "AGENT_FAVOR",
  "notes": "Agent marked correctly. Owner error.",
  "compensationAdjustment": 0
}
```

**Response:** `200 OK`

### Agent Performance Report (Admin)

**Endpoint:** `GET /api/admin/agents/:agentId/performance`

**Required Role:** ADMIN

**Response:** `200 OK`

---

## Webhooks

### Payment Webhook

**Endpoint:** `POST /api/webhooks/payment`

**Headers:**
```
verif-hash: <flutterwave_signature>
```

**Payload:**
```json
{
  "event": "charge.completed",
  "data": {
    "id": 123456,
    "tx_ref": "marking-job-clxy456def",
    "amount": 20000,
    "status": "successful"
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `AUTH_001` | Invalid or expired token |
| `MARKING_001` | Property already has marking job |
| `MARKING_002` | Insufficient balance for marking |
| `MARKING_003` | Agent not available |
| `QUEUE_001` | Queue is full |
| `QUEUE_002` | Already in queue |
| `COMPLETION_001` | Time slot expired |
| `COMPLETION_002` | Missing required images |
| `PAYMENT_001` | Payment failed |

## Rate Limits

- **Default**: 100 requests per 15 minutes
- **Agent endpoints**: 200 requests per 15 minutes
- **Admin endpoints**: Unlimited

## Support

For API support: api-support@newcondo.com