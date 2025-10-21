# Property Marking Service API Documentation

## Base URL
```
http://localhost:4003/api/v1
```

## Authentication
All endpoints require JWT authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Queue Management Endpoints

### 1. Get Available Marking Jobs (Agent Queue)
**Endpoint:** `GET /queue/available`  
**Auth Required:** Yes (Agent/Renter with Premium)  
**Description:** Get list of available marking jobs for the authenticated agent based on their service areas and proximity.

**Query Parameters:**
- `limit` (optional): Number of jobs to return (default: 20)
- `page` (optional): Page number for pagination (default: 1)

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "marking_job_123",
        "propertyId": "prop_456",
        "contactPersonName": "John Doe",
        "contactPersonPhone": "+2348012345678",
        "accessInstructions": "Gate code is 1234",
        "markingFee": 20000,
        "urgencyLevel": "NORMAL",
        "address": "123 Main St, Lagos",
        "city": "Lagos",
        "state": "Lagos State",
        "distance": 5.2,
        "estimatedTime": "30 minutes",
        "propertyImages": ["url1", "url2"],
        "createdAt": "2025-10-21T10:00:00Z"
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

### 2. Join Queue for Marking Job
**Endpoint:** `POST /queue/join/:jobId`  
**Auth Required:** Yes (Agent/Renter with Premium)  
**Description:** Agent joins the queue for a specific marking job.

**Request Body:**
```json
{
  "estimatedArrivalTime": "2025-10-21T14:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "queuePosition": 3,
    "timeSlotStart": "2025-10-21T14:00:00Z",
    "timeSlotEnd": "2025-10-21T17:00:00Z",
    "timeSlotDuration": 180,
    "jobId": "marking_job_123",
    "status": "QUEUED",
    "message": "You are in position 3. You will be notified when it's your turn."
  }
}
```

**Error Responses:**
- `400`: Already in queue for this job
- `404`: Marking job not found
- `409`: Job already completed or cancelled

---

### 3. Get My Queue Position
**Endpoint:** `GET /queue/my-position/:jobId`  
**Auth Required:** Yes (Agent/Renter with Premium)  
**Description:** Get current queue position and time slot information.

**Response:**
```json
{
  "success": true,
  "data": {
    "queuePosition": 2,
    "totalInQueue": 5,
    "timeSlotStart": "2025-10-21T14:00:00Z",
    "timeSlotEnd": "2025-10-21T17:00:00Z",
    "timeRemaining": 7200,
    "status": "ASSIGNED",
    "isMyTurn": false,
    "estimatedWaitTime": "6 hours"
  }
}
```

---

### 4. Leave Queue
**Endpoint:** `DELETE /queue/leave/:jobId`  
**Auth Required:** Yes (Agent/Renter with Premium)  
**Description:** Agent voluntarily leaves the queue.

**Response:**
```json
{
  "success": true,
  "message": "Successfully left the queue"
}
```

---

### 5. Get My Active Queue Jobs
**Endpoint:** `GET /queue/my-jobs`  
**Auth Required:** Yes (Agent/Renter with Premium)  
**Description:** Get all marking jobs where the agent is currently in queue.

**Response:**
```json
{
  "success": true,
  "data": {
    "activeJobs": [
      {
        "jobId": "marking_job_123",
        "propertyId": "prop_456",
        "queuePosition": 1,
        "status": "ASSIGNED",
        "timeSlotStart": "2025-10-21T11:00:00Z",
        "timeSlotEnd": "2025-10-21T14:00:00Z",
        "timeRemaining": 3600,
        "isMyTurn": true
      }
    ],
    "total": 1
  }
}
```

---

## Assignment Management Endpoints

### 6. Get Current Assignment
**Endpoint:** `GET /assignments/current`  
**Auth Required:** Yes (Agent/Renter with Premium)  
**Description:** Get the agent's current active assignment (if any).

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "marking_job_123",
    "propertyId": "prop_456",
    "status": "ASSIGNED",
    "assignedAt": "2025-10-21T11:00:00Z",
    "timeSlotExpiry": "2025-10-21T14:00:00Z",
    "timeRemaining": 7200,
    "contactPersonName": "John Doe",
    "contactPersonPhone": "+2348012345678",
    "accessInstructions": "Gate code is 1234",
    "propertyDetails": {
      "address": "123 Main St, Lagos",
      "city": "Lagos",
      "state": "Lagos State",
      "images": ["url1", "url2"]
    },
    "markingFee": 20000,
    "partialPayment": 1000
  }
}
```

---

### 7. Start Marking Job
**Endpoint:** `POST /assignments/start/:jobId`  
**Auth Required:** Yes (Agent/Renter with Premium)  
**Description:** Mark the job as in progress when agent arrives at property.

**Request Body:**
```json
{
  "currentLocation": {
    "latitude": 6.5244,
    "longitude": 3.3792
  },
  "arrivalNote": "Arrived at property"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "marking_job_123",
    "status": "IN_PROGRESS",
    "startedAt": "2025-10-21T11:30:00Z",
    "timeSlotExpiry": "2025-10-21T14:00:00Z"
  }
}
```

---

### 8. Complete Marking Job
**Endpoint:** `POST /assignments/complete/:jobId`  
**Auth Required:** Yes (Agent/Renter with Premium)  
**Description:** Submit completed marking job with boundary data and images.

**Request Body:**
```json
{
  "boundaryCoordinates": {
    "type": "Polygon",
    "coordinates": [
      [
        [3.3792, 6.5244],
        [3.3795, 6.5244],
        [3.3795, 6.5247],
        [3.3792, 6.5247],
        [3.3792, 6.5244]
      ]
    ]
  },
  "completionImages": ["url1", "url2", "url3"],
  "completionNotes": "Property marked successfully. All boundaries verified.",
  "roomImages": ["kitchen_url", "bedroom_url", "bathroom_url"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "marking_job_123",
    "status": "COMPLETED",
    "completedAt": "2025-10-21T13:45:00Z",
    "partialPayment": 1000,
    "remainingPayment": 19000,
    "confirmationDeadline": "2025-10-24T13:45:00Z",
    "message": "Job completed. Awaiting property owner confirmation."
  }
}
```

---

### 9. Get Assignment History
**Endpoint:** `GET /assignments/history`  
**Auth Required:** Yes (Agent/Renter with Premium)  
**Description:** Get agent's marking job history with performance metrics.

**Query Parameters:**
- `limit` (optional): Number of records (default: 20)
- `page` (optional): Page number (default: 1)
- `status` (optional): Filter by status (COMPLETED, CANCELLED, EXPIRED)

**Response:**
```json
{
  "success": true,
  "data": {
    "assignments": [
      {
        "jobId": "marking_job_123",
        "propertyAddress": "123 Main St, Lagos",
        "status": "COMPLETED",
        "assignedAt": "2025-10-21T11:00:00Z",
        "completedAt": "2025-10-21T13:45:00Z",
        "duration": 165,
        "payment": 5000,
        "rating": 4.5
      }
    ],
    "statistics": {
      "totalJobs": 25,
      "completedJobs": 22,
      "cancelledJobs": 2,
      "expiredJobs": 1,
      "completionRate": 0.88,
      "averageRating": 4.3,
      "totalEarnings": 110000
    },
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 20,
      "totalPages": 2
    }
  }
}
```

---

## Time Slot Management Endpoints

### 10. Check Time Slot Availability
**Endpoint:** `GET /time-slots/check/:jobId`  
**Auth Required:** Yes (Agent/Renter with Premium)  
**Description:** Check if time slots are available for a marking job.

**Response:**
```json
{
  "success": true,
  "data": {
    "available": true,
    "currentQueueSize": 3,
    "maxQueueSize": 10,
    "estimatedWaitTime": "9 hours",
    "nextAvailableSlot": "2025-10-21T20:00:00Z"
  }
}
```

---

### 11. Extend Time Slot
**Endpoint:** `POST /time-slots/extend/:jobId`  
**Auth Required:** Yes (Agent/Renter with Premium)  
**Description:** Request additional time for current assignment (limited to once per job).

**Request Body:**
```json
{
  "reason": "Traffic delay",
  "estimatedArrival": "2025-10-21T14:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "newTimeSlotExpiry": "2025-10-21T15:00:00Z",
    "extensionGranted": 60,
    "message": "Time slot extended by 60 minutes"
  }
}
```

**Error Responses:**
- `400`: Extension already used
- `400`: Cannot extend more than 1 hour
- `403`: Extension not allowed for this job

---

## Notification Management Endpoints

### 12. Update Notification Preferences
**Endpoint:** `PUT /notifications/preferences`  
**Auth Required:** Yes (Agent/Renter with Premium)  
**Description:** Update notification preferences for marking jobs.

**Request Body:**
```json
{
  "emailNotifications": true,
  "smsNotifications": true,
  "pushNotifications": true,
  "notifyOnNewJobs": true,
  "notifyOnAssignment": true,
  "notifyOnCompletion": true,
  "notifyOnPayment": true,
  "quietHoursStart": "22:00",
  "quietHoursEnd": "07:00"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification preferences updated successfully"
}
```

---

### 13. Get Unread Notifications
**Endpoint:** `GET /notifications/unread`  
**Auth Required:** Yes (Agent/Renter with Premium)  
**Description:** Get unread notifications for the agent.

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_123",
        "type": "JOB_ASSIGNED",
        "title": "New Marking Job Assigned",
        "message": "You have been assigned a marking job at 123 Main St, Lagos",
        "jobId": "marking_job_123",
        "createdAt": "2025-10-21T11:00:00Z",
        "priority": "HIGH"
      }
    ],
    "unreadCount": 5
  }
}
```

---

## Performance & Analytics Endpoints

### 14. Get Performance Metrics
**Endpoint:** `GET /analytics/performance`  
**Auth Required:** Yes (Agent/Renter with Premium)  
**Description:** Get detailed performance metrics and reliability score.

**Query Parameters:**
- `period` (optional): DAY, WEEK, MONTH, ALL (default: MONTH)

**Response:**
```json
{
  "success": true,
  "data": {
    "reliabilityScore": 4.35,
    "totalJobs": 25,
    "completedJobs": 22,
    "completionRate": 0.88,
    "averageCompletionTime": 145,
    "onTimeRate": 0.95,
    "averageRating": 4.3,
    "totalEarnings": 110000,
    "rankPosition": 12,
    "badges": ["FAST_MARKER", "RELIABLE_AGENT"],
    "period": {
      "start": "2025-09-21T00:00:00Z",
      "end": "2025-10-21T23:59:59Z"
    }
  }
}
```

---

## Error Responses

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

### Common Error Codes:
- `UNAUTHORIZED`: Missing or invalid authentication token
- `FORBIDDEN`: User doesn't have permission for this action
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid request data
- `CONFLICT`: Resource conflict (e.g., already in queue)
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error

---

## Webhook Events

The marking service sends webhook events for real-time updates:

### Event Types:
1. `job.created` - New marking job created
2. `job.assigned` - Agent assigned to job
3. `job.started` - Agent started marking
4. `job.completed` - Job completed
5. `job.expired` - Time slot expired
6. `queue.updated` - Queue position changed
7. `payment.released` - Payment released to agent

### Webhook Payload:
```json
{
  "event": "job.assigned",
  "timestamp": "2025-10-21T11:00:00Z",
  "data": {
    "jobId": "marking_job_123",
    "agentId": "agent_456",
    "propertyId": "prop_789"
  }
}
```

---

## Rate Limits

- **Standard Users**: 100 requests per 15 minutes
- **Premium Users**: 300 requests per 15 minutes
- **Webhook Endpoints**: 1000 requests per 15 minutes

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1634825400
```

---

## Testing

### Health Check
```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "service": "marking-service",
  "version": "1.0.0",
  "timestamp": "2025-10-21T12:00:00Z"
}
```