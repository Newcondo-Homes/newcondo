# Property Marking Service Foundation 🏷️

## Overview

The Property Marking Service is a core microservice in the Newcondo platform that manages the process of physically marking and verifying property boundaries. This service enables property owners to request marking services, assigns jobs to available agents, handles payments, and manages the entire marking workflow.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Service Components](#service-components)
- [Integration Points](#integration-points)
- [Security](#security)
- [Monitoring](#monitoring)

## Features

### Core Functionality

- **Job Request Management**: Property owners can request marking services
- **Smart Agent Matching**: Proximity-based assignment to qualified agents
- **Queue Management**: First-come-first-served queue system with 3-hour time windows
- **Payment Processing**: Integrated with Flutterwave for marking job payments
- **Virtual Account Integration**: Automatic virtual account creation for agents
- **Compensation System**: Tiered compensation with upfront and final payments
- **Notification System**: Multi-channel notifications (Email, SMS, Push)
- **Admin Oversight**: Comprehensive admin dashboard for monitoring

### Marking Options

1. **Self-Marking**: Property owner marks the property themselves
2. **Newcondo Admin Marking**: Admin-assigned marking job (₦25,000)
3. **Trusted Person Marking**: Shareable link for trusted individuals
4. **Agent Assignment**: Broadcast to nearby agents (₦20,000)

## Architecture

### Technology Stack

- **Runtime**: Node.js + Express.js + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache/Queue**: Redis for queue management
- **Payment**: Flutterwave Payment Gateway
- **Maps**: Google Maps API for geolocation
- **Notifications**: Integration with Notification Service

### Service Structure

```
marking-service/
├── controllers/     # Request handlers
├── routes/          # API endpoints
├── services/        # Business logic
├── middleware/      # Validation & auth
├── types/           # TypeScript definitions
└── utils/           # Helper functions
```

## Getting Started

### Prerequisites

- Node.js >= 18.x
- PostgreSQL >= 14.x
- Redis >= 6.x
- Google Maps API Key
- Flutterwave Account

### Installation

```bash
# Navigate to marking service
cd backend/marking-service

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your credentials

# Run migrations
npx prisma migrate dev

# Start the service
npm run dev
```

### Environment Setup

See `.env.example` for all required environment variables. Key configurations:

- **Database**: PostgreSQL connection string
- **Redis**: Cache and queue management
- **Payment**: Flutterwave API credentials
- **Maps**: Google Maps API key
- **Notification**: Notification service URL

## Service Components

### 1. Marking Job Controller
Handles marking job creation, updates, and retrieval.

**Key Endpoints:**
- `POST /api/marking-jobs` - Create marking job
- `GET /api/marking-jobs/:id` - Get job details
- `PATCH /api/marking-jobs/:id` - Update job status

### 2. Queue Controller
Manages agent queue and job assignments.

**Key Endpoints:**
- `GET /api/queue/available-agents` - Get nearby agents
- `POST /api/queue/assign` - Assign job to agent
- `POST /api/queue/join` - Agent joins queue

### 3. Assignment Controller
Handles job-to-agent assignment logic.

**Key Endpoints:**
- `POST /api/assignments/broadcast` - Broadcast to agents
- `GET /api/assignments/:jobId` - Get assignment details
- `POST /api/assignments/:id/accept` - Agent accepts job

### 4. Completion Controller
Manages marking job completion and verification.

**Key Endpoints:**
- `POST /api/completion/:jobId/submit` - Submit completion
- `POST /api/completion/:jobId/confirm` - Owner confirms
- `POST /api/completion/:jobId/reject` - Owner rejects

## Integration Points

### Payment Service
- Virtual account creation
- Payment processing
- Commission distribution
- Refund handling

### Notification Service
- Job assignment notifications
- Queue position updates
- Completion alerts
- Payment confirmations

### Property Service
- Property boundary updates
- Boundary verification
- Duplicate detection
- Property status updates

### Admin Service
- Job oversight
- Dispute resolution
- Performance monitoring
- Agent management

## Security

### Authentication
- JWT-based authentication
- Role-based access control (RBAC)
- API key authentication for service-to-service

### Authorization
- Property owner verification
- Agent credential validation
- Admin privilege checks

### Data Protection
- Encrypted payment information
- Secure GPS coordinates storage
- PII data encryption at rest

## Monitoring

### Health Checks
- Service health endpoint: `GET /health`
- Database connectivity check
- Redis connectivity check
- External service availability

### Metrics
- Active jobs count
- Queue length
- Average completion time
- Agent performance scores
- Payment success rate

### Logging
- Structured JSON logging
- Request/response logging
- Error tracking
- Audit trail for admin actions

## Payment Flow

### Standard Marking Job (₦20,000)
1. Property owner pays ₦20,000
2. Payment held in escrow
3. Agent completes marking
4. Agent receives ₦1,000 upfront
5. Owner confirms within 72 hours
6. Agent receives remaining ₦4,000 (25% total)
7. Platform retains ₦15,000 (75%)

### Admin Marking (₦25,000)
1. Property owner pays ₦25,000
2. Admin assigns internal team
3. Marking completed
4. Payment released to platform

## Queue Management

### Agent Queue System
- **First-come-first-served** queue
- **3-hour time window** per agent
- **Automatic rotation** on timeout
- **Priority support** for high-rated agents

### Queue States
- `WAITING` - In queue awaiting turn
- `ACTIVE` - Agent's turn to complete
- `TIMEOUT` - Time window expired
- `COMPLETED` - Job finished
- `CANCELLED` - Job cancelled

## Compensation Logic

### Attempt-Based Compensation
1. **Attempt 1**: ₦1,000 upfront
2. **Timeout**: Partial compensation
3. **Max Attempts**: Full release to agent
4. **Confirmation**: Full payment released

See [COMPENSATION.md](./COMPENSATION.md) for detailed logic.

## API Documentation

Full API documentation available at [API.md](./API.md)

## Flow Diagrams

Visual flow diagrams available at [FLOW.md](./FLOW.md)

## Deployment

Deployment guide available at [DEPLOYMENT.md](./DEPLOYMENT.md)

## Contributing

### Development Workflow
1. Create feature branch
2. Implement changes
3. Write tests
4. Submit pull request
5. Code review
6. Merge to main

### Code Standards
- TypeScript strict mode
- ESLint + Prettier
- Comprehensive error handling
- Unit test coverage > 80%

## Support

For issues and questions:
- Technical: tech@newcondo.com
- Business: support@newcondo.com
- Emergency: admin@newcondo.com

## License

Proprietary - Newcondo Platform © 2025