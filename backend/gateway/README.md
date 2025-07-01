# NewCondo API Gateway

The API Gateway serves as the single entry point for all client requests to the NewCondo microservices architecture. It handles routing, authentication, rate limiting, load balancing, and service discovery.

## Features

- **Request Routing**: Routes requests to appropriate microservices
- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Rate Limiting**: Configurable rate limiting with Redis backend
- **Load Balancing**: Multiple load balancing algorithms (round-robin, least-connections, weighted)
- **Circuit Breaker**: Prevents cascade failures with configurable thresholds
- **Service Discovery**: Dynamic service registration and health monitoring
- **Request/Response Transformation**: Standardized API responses
- **Logging & Metrics**: Comprehensive logging and metrics collection
- **Health Checks**: Service health monitoring and reporting
- **CORS Support**: Configurable CORS policies
- **Security**: Helmet.js integration for security headers

## Architecture

```
Client Request → Gateway → Service Discovery → Load Balancer → Target Service
                   ↓
              Rate Limiting, Auth, Logging, Metrics
```

## Services Routing

| Path | Service | Description |
|------|---------|-------------|
| `/api/v1/auth/**` | auth-service | Authentication and user management |
| `/api/v1/properties/**` | property-service | Property listings and management |
| `/api/v1/payments/**` | payment-service | Payment processing |
| `/api/v1/bookings/**` | booking-service | Property booking management |
| `/api/v1/admin/**` | admin-service | Administrative functions |
| `/api/v1/marking/**` | marking-service | Property marking services |
| `/api/v1/notifications/**` | notification-service | Notification management |
| `/api/v1/referrals/**` | referral-service | Referral system |
| `/api/v1/analytics/**` | analytics-service | Analytics and reporting |

## Quick Start

### Prerequisites

- Node.js 18+
- Redis (for rate limiting and service registry)
- Running microservices

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Build the application
npm run build

# Start development server
npm run dev

# Start production server
npm start
```

### Docker Deployment

```bash
# Build and start with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f gateway

# Stop services
docker-compose down
```

## Configuration

### Environment Variables

Key configuration options:

```bash
# Server
NODE_ENV=production
PORT=3000

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key

# Services
AUTH_SERVICE_URL=http://localhost:3001
PROPERTY_SERVICE_URL=http://localhost:3002
# ... other services
```

### Rate Limiting

Configure rate limiting in `.env`:

```bash
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100    # 100 requests per window
```

### Circuit Breaker

Configure circuit breaker settings:

```bash
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_RESET_TIMEOUT=60000
```

## API Documentation

### Health Check

```bash
GET /health
```

Returns gateway and service health status.

### Metrics

```bash
GET /metrics
```

Returns Prometheus-compatible metrics.

### Service Registry

```bash
GET /api/v1/services
```

Returns registered services and their health status.

## Development

### Project Structure

```
src/
├── config/           # Configuration files
├── middleware/       # Express middleware
├── routes/          # Route handlers
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── app.ts           # Express app setup
└── server.ts        # Server entry point
```

### Adding New Routes

1. Define route in `src/routes/index.ts`
2. Add service configuration
3. Update load balancer configuration
4. Add authentication rules if needed

### Middleware Chain

Request flow through middleware:

1. **Logger** - Request logging
2. **CORS** - Cross-origin resource sharing
3. **Rate Limiter** - Rate limiting
4. **Auth** - Authentication (for protected routes)
5. **Validation** - Request validation
6. **Proxy** - Request proxying to services

## Monitoring

### Health Checks

The gateway performs health checks on all registered services:

- **Interval**: 30 seconds (configurable)
- **Timeout**: 5 seconds (configurable)
- **Endpoint**: `/health` on each service

### Metrics

Available metrics:

- Request count and duration
- Service health status
- Rate limiting statistics
- Circuit breaker status
- Error rates and types

### Logging

Structured logging with different levels:

- **Error**: System errors and service failures
- **Warn**: Performance issues and deprecations
- **Info**: General operational information
- **Debug**: Detailed debugging information

## Security

### Authentication

- JWT-based authentication
- Role-based access control
- Token validation and refresh

### Security Headers

- Helmet.js for security headers
- CORS policy enforcement
- Request sanitization

### Rate Limiting

- IP-based rate limiting
- User-based rate limiting (authenticated users)
- Sliding window algorithm

## Troubleshooting

### Common Issues

1. **Service Unavailable**
   - Check service health status
   - Verify service URLs in configuration
   - Check network connectivity

2. **Authentication Errors**
   - Verify JWT secret configuration
   - Check token expiration
   - Validate user permissions

3. **Rate Limiting**
   - Check Redis connection
   - Verify rate limit configuration
   - Monitor request patterns

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=debug npm run dev
```

### Service Health

Check service health:

```bash
curl http://localhost:3000/health
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## License

MIT License - see LICENSE file for details.