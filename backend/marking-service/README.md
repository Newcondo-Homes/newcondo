# Property Marking Service

The Property Marking Service is a microservice responsible for managing property marking jobs, agent queue system, and assignment logic for the NewCondo platform.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Queue System](#queue-system)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)

## Overview

The Property Marking Service enables property owners to request professional property marking services, either through NewCondo agents or by assigning someone they know. It implements a sophisticated queue system for agent assignment with time-slot management and automatic rotation.

### Key Capabilities

- Property marking job creation and management
- First-come-first-served agent queue system
- 3-hour time slot management with automatic rotation
- Agent performance tracking and reliability scoring
- Payment processing integration with Flutterwave
- Multi-channel notifications (Email, SMS, Push)
- Geographic proximity-based agent matching

## Features

### 1. Marking Job Management

- Create marking jobs for properties requiring boundary verification
- Multiple assignment options:
  - Self-marking by property owner
  - Assign to NewCondo admin team
  - Send shareable link to someone they know
  - Assign to available agents in the queue
- Job status tracking (QUEUED, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED, EXPIRED)
- Contact person information management
- Access instructions and preferred time slots

### 2. Agent Queue System

- **First-Come-First-Served (FCFS)** queue implementation
- Real-time queue position tracking
- 3-hour time slot allocation per agent
- Automatic rotation when time limits expire
- Queue size limits (configurable, default: 50)
- Priority queue support for urgent jobs

### 3. Agent Assignment Logic

- Geographic proximity-based matching
- Agent availability checking
- Reliability score consideration
- Service area verification
- Automatic re-assignment on timeout
- Manual admin override capability

### 4. Performance Tracking

- Agent reliability scoring (0.00 to 5.00)
- Job completion rate tracking
- Average completion time metrics
- Success/failure history
- Performance-based queue priority

### 5. Payment Integration

- Marking fee: ₦20,000 (configurable)
- Agent commission: 25% of marking fee
- Initial partial payment: ₦1,000 on job acceptance
- Remaining payment on job completion and verification
- Virtual account integration
- Payment confirmation workflow

### 6. Notification System

- **Email notifications** via Resend
- **SMS notifications** via Termii
- **Push notifications** via Firebase (optional)
- Multi-channel delivery with fallback
- Notification retry mechanism
- Template-based messaging

## Architecture

### Service Dependencies

```
┌─────────────────────────────────────────────────────────┐
│                   Marking Service                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Controllers (Express Routes)                     │  │
│  │  - markingJobController                          │  │
│  │  - queueController                               │  │
│  │  - assignmentController                          │  │
│  │  - completionController                          │  │
│  └──────────────────────────────────────────────────┘  │
│                        ▼                                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Services (Business Logic)                        │  │
│  │  - markingJobService                             │  │
│  │  - queueService                                  │  │
│  │  - assignmentService                             │  │
│  │  - timeSlotService                               │  │
│  │  - notificationService                           │  │
│  │  - completionService                             │  │
│  └──────────────────────────────────────────────────┘  │
│                        ▼                                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Data Layer                                       │  │
│  │  - PostgreSQL (via Prisma)                       │  │
│  │  - Redis (Queue & Caching)                       │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ▼
    ┌─────────────────────────────────────────────┐
    │  External Services                          │
    │  - Payment Service (Flutterwave)            │
    │  - Notification Service (Resend, Termii)    │
    │  - Property Service (Boundary data)         │
    │  - Google Maps API (Geolocation)            │
    └─────────────────────────────────────────────┘
```

### Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (via Prisma ORM)
- **Cache/Queue**: Redis
- **Payment**: Flutterwave
- **Notifications**: Resend (Email), Termii (SMS)
- **Maps**: Google Maps API

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL 14+
- Redis 6+
- Flutterwave account (for payments)
- Resend account (for emails)
- Termii account (for SMS)
- Google Maps API key

### Installation

1. **Clone the repository**

```bash
cd backend/marking-service
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
```

3. **Set up environment variables**

```bash
cp .env.example .env.local
# Edit .env.local with your actual credentials
```

4. **Set up database**

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

5. **Start Redis**

```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Or install locally and start
redis-server
```

6. **Start the service**

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm run build
npm start
```

The service will start on `http://localhost:3006` (or your configured PORT).

## API Documentation

See [API_ENDPOINTS.md](./API_ENDPOINTS.md) for complete API documentation.

### Quick Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/marking-jobs` | POST | Create a new marking job |
| `/api/marking-jobs/:id` | GET | Get marking job details |
| `/api/marking-jobs/:id/assign` | POST | Assign job to agent |
| `/api/queue/join` | POST | Join the marking queue |
| `/api/queue/position` | GET | Get current queue position |
| `/api/queue/leave` | POST | Leave the queue |
| `/api/assignments/accept` | POST | Accept an assigned job |
| `/api/assignments/complete` | POST | Complete a marking job |
| `/api/assignments/active` | GET | Get active assignments |

## Queue System

The queue system is the core of the marking service. See [QUEUE_SYSTEM.md](./QUEUE_SYSTEM.md) for detailed documentation.

### Key Concepts

1. **First-Come-First-Served (FCFS)**: Agents are assigned jobs in the order they join the queue
2. **Time Slots**: Each agent gets 3 hours to complete a job
3. **Automatic Rotation**: If time expires, job moves to next agent in queue
4. **Geographic Matching**: Only agents within reasonable proximity are notified
5. **Performance Tracking**: Reliability scores affect future assignments

### Queue Workflow

```
Property Owner Creates Job
         ↓
Job Added to Queue (QUEUED)
         ↓
Notify Nearby Agents → Agents Join Queue
         ↓
First Agent Assigned (ASSIGNED) → 3-hour timer starts
         ↓
Agent Accepts Job → Partial payment released
         ↓
Agent Completes Job (IN_PROGRESS → COMPLETED)
         ↓
Owner Verifies → Full payment released
```

## Environment Variables

See `.env.example` for all available environment variables.

### Critical Variables

```bash
# Database
DATABASE_URL="postgresql://..."

# Redis
REDIS_URL="redis://localhost:6379"

# Payment
FLUTTERWAVE_SECRET_KEY="..."
MARKING_FEE_AMOUNT=20000
AGENT_COMMISSION_PERCENTAGE=25

# Queue Configuration
TIME_SLOT_DURATION_HOURS=3
MAX_COMPLETION_DAYS=3

# Notifications
RESEND_API_KEY="..."
TERMII_API_KEY="..."
```

## Development

### Project Structure

```
src/
├── controllers/          # Request handlers
│   ├── markingJobController.ts
│   ├── queueController.ts
│   ├── assignmentController.ts
│   └── completionController.ts
├── routes/              # API routes
│   ├── markingJobs.ts
│   ├── queue.ts
│   ├── assignments.ts
│   └── completion.ts
├── services/            # Business logic
│   ├── markingJobService.ts
│   ├── queueService.ts
│   ├── assignmentService.ts
│   ├── timeSlotService.ts
│   ├── notificationService.ts
│   └── completionService.ts
├── middleware/          # Express middleware
│   ├── markingValidation.ts
│   ├── queueValidation.ts
│   └── agentAuth.ts
├── types/               # TypeScript types
│   ├── markingJob.ts
│   ├── queue.ts
│   └── assignment.ts
├── app.ts              # Express app setup
└── server.ts           # Server entry point
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test queueService.test.ts

# Generate coverage report
npm run test:coverage
```

### Code Style

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Testing

### Test Coverage

- **Unit Tests**: Service logic, calculations, validations
- **Integration Tests**: API endpoints, database interactions
- **E2E Tests**: Complete workflows (job creation to completion)

### Key Test Scenarios

1. Queue management (join, position, rotation)
2. Time slot expiration and auto-reassignment
3. Payment processing and commission splits
4. Notification delivery and retries
5. Agent reliability scoring
6. Geographic proximity filtering

## Deployment

### Production Checklist

- [ ] Update all environment variables in `.env`
- [ ] Enable production database
- [ ] Configure Redis cluster
- [ ] Set up monitoring (Sentry, DataDog, etc.)
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Set up SSL/TLS certificates
- [ ] Enable automated backups
- [ ] Configure log rotation
- [ ] Set up health check endpoints
- [ ] Enable security headers
- [ ] Configure firewall rules

### Docker Deployment

```dockerfile
# Build
docker build -t newcondo-marking-service .

# Run
docker run -p 3006:3006 \
  --env-file .env \
  newcondo-marking-service
```

### Health Checks

```bash
# Service health
GET /health

# Queue status
GET /queue/health

# Database connection
GET /health/db
```

## Monitoring & Logging

### Key Metrics to Monitor

- Queue length and wait times
- Agent response times
- Job completion rates
- Payment success rates
- Notification delivery rates
- API response times
- Error rates

### Log Levels

- **ERROR**: Critical issues requiring immediate attention
- **WARN**: Issues that should be investigated
- **INFO**: Important operational events
- **DEBUG**: Detailed debugging information

## Troubleshooting

### Common Issues

**Queue not processing jobs**
- Check Redis connection
- Verify queue cleanup job is running
- Check agent availability in the area

**Notifications not sending**
- Verify API keys (Resend, Termii)
- Check notification service logs
- Verify retry mechanism is working

**Payment processing failures**
- Verify Flutterwave credentials
- Check webhook configuration
- Review transaction logs

## Support

For issues, questions, or contributions:

- Create an issue in the repository
- Contact the development team
- Check the wiki for additional documentation

## License

Copyright © 2024 NewCondo. All rights reserved.























<!-- # Property Marking Service

The Property Marking Service handles the complete workflow for property boundary marking, agent assignment, queue management, and job completion tracking.

## Overview

This service enables property owners to have their properties professionally marked on satellite maps by verified agents. It includes:

- **Job Creation & Payment Processing**
- **Agent Queue Management** with time-slot rotation
- **Real-time Job Assignment & Tracking**
- **Photo & Boundary Data Upload**
- **Performance Metrics & Analytics**
- **Automated Notifications** (Email/SMS)

---

## Features

### 1. Job Management
- Create marking jobs with property and contact details
- Payment processing integration with Flutterwave
- Multiple marking options (self, friend, agent, admin)
- Job status tracking (QUEUED, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED)

### 2. Agent Queue System
- First-come-first-served queue implementation
- 3-hour time slot per agent
- Automatic rotation on timeout
- Proximity-based agent matching
- Reliability score filtering

### 3. Completion Workflow
- Photo evidence upload (minimum 5 photos)
- Boundary coordinate submission
- Initial payment release (5% = ₦1,000)
- Owner confirmation system (48-hour window)
- Final payment release on confirmation

### 4. Performance Tracking
- Agent statistics and metrics
- Reliability scoring (0-5.00)
- Completion rate tracking
- Earnings history
- Job history with filters

---

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (via Prisma ORM)
- **Cache**: Redis (for queue management)
- **Payment**: Flutterwave API
- **Maps**: Google Maps API
- **Notifications**: Twilio (SMS), Resend/SendGrid (Email)
- **File Upload**: Cloudinary or AWS S3

---

## Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- pnpm (package manager)

### Setup

1. **Install dependencies**
```bash
cd backend/marking-service
pnpm install
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Run database migrations**
```bash
pnpm prisma migrate dev
```

4. **Start the service**
```bash
# Development
pnpm dev

# Production
pnpm build
pnpm start
```

The service will start on `http://localhost:3006`

---

## API Endpoints

### Job Management

#### Create Marking Job
```http
POST /api/marking/jobs
Authorization: Bearer {token}
Content-Type: application/json

{
  "propertyId": "string",
  "markingOption": "AGENT_ASSIGNMENT", // or "SELF", "FRIEND", "ADMIN"
  "contactPersonName": "string",
  "contactPersonPhone": "string",
  "accessInstructions": "string",
  "preferredTime": "2025-10-25T10:00:00Z"
}
```

#### Get Job Details
```http
GET /api/marking/jobs/:jobId
Authorization: Bearer {token}
```

#### Update Job Status
```http
PATCH /api/marking/jobs/:jobId/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "IN_PROGRESS"
}
```

### Queue Management

#### Get Available Jobs (Agents)
```http
GET /api/marking/queue/available
Authorization: Bearer {token}
Query Params:
  - latitude: number
  - longitude: number
  - radius: number (optional, default: 50km)
```

#### Join Queue
```http
POST /api/marking/queue/:jobId/join
Authorization: Bearer {token}
```

#### Get Queue Status
```http
GET /api/marking/queue/:jobId/status
Authorization: Bearer {token}
```

### Completion

#### Upload Completion Data
```http
POST /api/marking/jobs/:jobId/complete
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "boundaryData": JSON,
  "completionNotes": "string",
  "images": File[] (min 5 images)
}
```

#### Confirm Marking (Owner)
```http
POST /api/marking/jobs/:jobId/confirm
Authorization: Bearer {token}
Content-Type: application/json

{
  "isApproved": boolean,
  "feedback": "string",
  "rating": number (1-5)
}
```

### Agent Management

#### Get Agent Statistics
```http
GET /api/marking/agents/:agentId/statistics
Authorization: Bearer {token}
```

#### Get Performance Metrics
```http
GET /api/marking/agents/:agentId/performance
Authorization: Bearer {token}
```

#### Get Job History
```http
GET /api/marking/agents/:agentId/history
Authorization: Bearer {token}
Query Params:
  - status: string (optional)
  - dateFrom: string (optional)
  - dateTo: string (optional)
  - page: number (optional)
  - limit: number (optional)
```

#### Update Service Areas
```http
PUT /api/marking/agents/:agentId/service-areas
Authorization: Bearer {token}
Content-Type: application/json

{
  "serviceAreas": ["Lagos", "Abuja", "Port Harcourt"]
}
```

### Notifications

#### Get Notifications
```http
GET /api/marking/notifications
Authorization: Bearer {token}
Query Params:
  - unreadOnly: boolean (optional)
  - page: number (optional)
```

#### Mark as Read
```http
PATCH /api/marking/notifications/:notificationId/read
Authorization: Bearer {token}
```

---

## Business Logic

### Marking Fee Structure

| Option | Cost (NGN) | Agent Commission | Platform Fee |
|--------|------------|------------------|--------------|
| Self Mark | 0 | 0 | 0 |
| Friend Mark | 0 | 0 | 0 |
| Agent Assignment | 20,000 | 5,000 (25%) | 15,000 (75%) |
| Admin Mark | 25,000 | 0 | 25,000 |

### Payment Flow

1. **Initial Payment (On Assignment)**
   - Agent receives 5% (₦1,000) immediately
   - Held in virtual account (non-withdrawable)

2. **Confirmation Period**
   - Owner has 48 hours to confirm
   - Up to 3 confirmation cycles

3. **Final Payment**
   - On owner confirmation: Full 25% (₦5,000) released
   - After 3 failed confirmations: Full payout to agent

### Queue Time Management

- **Time Slot**: 3 hours per agent
- **Auto-Rotation**: If agent doesn't complete within 3 hours, next agent gets the job
- **Max Completion Time**: 3 days from initial assignment
- **Queue Position**: First-come-first-served

### Agent Eligibility

- Must be verified agent or premium renter
- Reliability score ≥ 2.5
- Must have service area matching property location
- Must have `isAvailableForMarking` = true

---

## Error Handling

### Common Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Invalid request | Malformed request body |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not found | Resource doesn't exist |
| 409 | Conflict | Duplicate or conflicting action |
| 422 | Validation error | Invalid input data |
| 429 | Too many requests | Rate limit exceeded |
| 500 | Server error | Internal server error |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "contactPersonPhone",
      "issue": "Invalid phone number format"
    }
  },
  "timestamp": "2025-10-24T10:30:00Z"
}
```

---

## Testing

### Run Tests
```bash
# Unit tests
pnpm test

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:coverage
```

### Test Database
```bash
# Setup test database
pnpm prisma migrate dev --name init

# Seed test data
pnpm prisma db seed
```

---

## Monitoring & Logging

### Log Levels
- **ERROR**: Critical errors requiring immediate attention
- **WARN**: Warning messages for potential issues
- **INFO**: General informational messages
- **DEBUG**: Detailed debugging information

### Metrics Tracked
- Job creation rate
- Queue wait times
- Completion rates
- Payment processing times
- Agent performance scores
- API response times

---

## Security

### Authentication
- JWT-based authentication
- Token expiration: 1 hour
- Refresh token expiration: 7 days

### Authorization
- Role-based access control (RBAC)
- Agent verification required
- Premium subscription check for renters

### Data Protection
- PII encryption at rest
- HTTPS for all communications
- Rate limiting on all endpoints
- Input validation and sanitization

---

## Deployment

### Production Checklist
- [ ] Update environment variables
- [ ] Configure database connection
- [ ] Setup Redis cluster
- [ ] Configure CDN for images
- [ ] Setup monitoring (Sentry, DataDog)
- [ ] Configure backup strategy
- [ ] Setup CI/CD pipeline
- [ ] Load testing completed
- [ ] Security audit completed

### Environment Variables
See `.env.example` for all required variables.

---

## Support

For issues or questions:
- **Email**: dev@newcondo.com
- **Documentation**: https://docs.newcondo.com/marking-service
- **GitHub Issues**: https://github.com/newcondo/monorepo/issues

---

## License

Proprietary - NewCondo Platform © 2025 -->