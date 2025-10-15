# Property Marking Service - Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Service Deployment](#service-deployment)
5. [Production Checklist](#production-checklist)
6. [Monitoring & Logging](#monitoring--logging)
7. [Scaling Considerations](#scaling-considerations)
8. [Troubleshooting](#troubleshooting)
9. [Rollback Procedures](#rollback-procedures)

---

## Prerequisites

### System Requirements
- **Node.js**: v18.x or higher
- **PostgreSQL**: v14.x or higher
- **Redis**: v7.x or higher (for queue management and caching)
- **PM2**: v5.x or higher (for process management)
- **Nginx**: Latest stable (for reverse proxy)

### Third-Party Services
- **Flutterwave Account**: For payment processing
- **Google Maps API**: For geocoding and location services
- **SMS Provider**: Twilio or Termii for notifications
- **Email Service**: Resend or SendGrid
- **Cloud Storage**: AWS S3 or Cloudinary for image uploads

### Access Requirements
- Database credentials with appropriate permissions
- API keys for all third-party services
- SSL certificates for HTTPS
- Server SSH access

---

## Environment Setup

### 1. Clone Repository
```bash
# Clone the monorepo
git clone https://github.com/your-org/newcondo-monorepo.git
cd newcondo-monorepo

# Install dependencies
npm install

# Build shared packages
npm run build --workspace=backend/shared
```

### 2. Environment Variables

Create `backend/marking-service/.env`:

```env
# Server Configuration
NODE_ENV=production
PORT=3005
HOST=0.0.0.0
SERVICE_NAME=marking-service

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/newcondo_db?schema=public
DIRECT_URL=postgresql://user:password@localhost:5432/newcondo_db?schema=public

# Redis (Queue Management)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=1d
REFRESH_TOKEN_SECRET=your-refresh-token-secret-min-32-chars
REFRESH_TOKEN_EXPIRES_IN=7d

# Flutterwave Payment
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxxxxxxxxxxxx
FLUTTERWAVE_SECRET_KEY=FLWSECK-xxxxxxxxxxxxx
FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_TESTxxxxx
FLUTTERWAVE_WEBHOOK_SECRET=your-webhook-secret

# Google Maps API
GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
GOOGLE_MAPS_GEOCODING_ENABLED=true

# SMS Service (Twilio/Termii)
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Email Service (Resend/SendGrid)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@newcondo.com

# File Upload (AWS S3/Cloudinary)
UPLOAD_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Service Configuration
MARKING_FEE_OWNER=20000
MARKING_FEE_NEWCONDO=25000
AGENT_COMMISSION_PERCENTAGE=25
INITIAL_PAYMENT_PERCENTAGE=5
TIME_SLOT_DURATION_HOURS=3
CONFIRMATION_WINDOW_DAYS=3
MAX_QUEUE_SIZE=50
PROXIMITY_RADIUS_KM=10

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=https://newcondo.com,https://admin.newcondo.com
CORS_CREDENTIALS=true

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=/var/log/newcondo/marking-service.log

# Monitoring
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
ENABLE_METRICS=true
METRICS_PORT=9105
```

### 3. Validate Environment
```bash
cd backend/marking-service
npm run validate:env
```

---

## Database Setup

### 1. Run Migrations
```bash
# From monorepo root
cd packages/db

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Verify database
npx prisma db pull
```

### 2. Seed Initial Data (Optional)
```bash
# Create test data for development
npx prisma db seed
```

### 3. Database Indexes
Ensure these indexes exist for optimal performance:

```sql
-- Marking Job Performance
CREATE INDEX CONCURRENTLY idx_marking_jobs_status_queue 
  ON "PropertyMarkingJob" (status, "queuePosition") 
  WHERE status IN ('QUEUED', 'ASSIGNED');

CREATE INDEX CONCURRENTLY idx_marking_jobs_assigned_agent 
  ON "PropertyMarkingJob" ("assignedAgentId", status) 
  WHERE "assignedAgentId" IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_marking_jobs_time_slot 
  ON "PropertyMarkingJob" ("timeSlotExpiry") 
  WHERE status = 'ASSIGNED';

-- Agent Availability
CREATE INDEX CONCURRENTLY idx_users_available_marking 
  ON "User" ("isAvailableForMarking", role) 
  WHERE "isAvailableForMarking" = true;

-- Virtual Accounts
CREATE INDEX CONCURRENTLY idx_virtual_accounts_user 
  ON "VirtualAccount" ("userId", "isActive");

-- Payment Tracking
CREATE INDEX CONCURRENTLY idx_payments_marking_jobs 
  ON "Payment" ("markingJobId", status) 
  WHERE "markingJobId" IS NOT NULL;
```

---

## Service Deployment

### Method 1: PM2 (Recommended)

#### 1. Install PM2
```bash
npm install -g pm2
```

#### 2. Create PM2 Ecosystem File

Create `backend/marking-service/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'marking-service',
    script: './dist/server.js',
    instances: 2,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3005
    },
    error_file: '/var/log/newcondo/marking-service-error.log',
    out_file: '/var/log/newcondo/marking-service-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

#### 3. Build and Start Service
```bash
cd backend/marking-service

# Build TypeScript
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup systemd
```

#### 4. PM2 Management Commands
```bash
# View logs
pm2 logs marking-service

# Monitor
pm2 monit

# Restart
pm2 restart marking-service

# Stop
pm2 stop marking-service

# Delete
pm2 delete marking-service

# List processes
pm2 list
```

### Method 2: Docker Deployment

#### 1. Create Dockerfile

Create `backend/marking-service/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY src ./src

# Build
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3005

CMD ["node", "dist/server.js"]
```

#### 2. Docker Compose

Create `backend/docker-compose.marking.yml`:

```yaml
version: '3.8'

services:
  marking-service:
    build:
      context: ./marking-service
      dockerfile: Dockerfile
    container_name: marking-service
    restart: unless-stopped
    ports:
      - "3005:3005"
    environment:
      - NODE_ENV=production
    env_file:
      - ./marking-service/.env
    depends_on:
      - postgres
      - redis
    networks:
      - newcondo-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3005/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  redis:
    image: redis:7-alpine
    container_name: marking-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - newcondo-network

networks:
  newcondo-network:
    external: true

volumes:
  redis-data:
```

#### 3. Deploy with Docker
```bash
# Build image
docker-compose -f docker-compose.marking.yml build

# Start services
docker-compose -f docker-compose.marking.yml up -d

# View logs
docker-compose -f docker-compose.marking.yml logs -f marking-service

# Stop services
docker-compose -f docker-compose.marking.yml down
```

### Method 3: Kubernetes Deployment

#### 1. Create Kubernetes Manifests

`k8s/marking-service/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: marking-service
  namespace: newcondo
spec:
  replicas: 3
  selector:
    matchLabels:
      app: marking-service
  template:
    metadata:
      labels:
        app: marking-service
    spec:
      containers:
      - name: marking-service
        image: your-registry/marking-service:latest
        ports:
        - containerPort: 3005
        envFrom:
        - configMapRef:
            name: marking-service-config
        - secretRef:
            name: marking-service-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3005
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3005
          initialDelaySeconds: 10
          periodSeconds: 5
```

`k8s/marking-service/service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: marking-service
  namespace: newcondo
spec:
  selector:
    app: marking-service
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3005
  type: ClusterIP
```

#### 2. Deploy to Kubernetes
```bash
# Apply configurations
kubectl apply -f k8s/marking-service/

# Check deployment
kubectl get pods -n newcondo

# View logs
kubectl logs -f deployment/marking-service -n newcondo
```

---

## Nginx Configuration

### 1. Create Nginx Config

`/etc/nginx/sites-available/marking-service`:

```nginx
upstream marking_service {
    least_conn;
    server 127.0.0.1:3005 max_fails=3 fail_timeout=30s;
    # Add more instances if needed
    # server 127.0.0.1:3006 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name marking.newcondo.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name marking.newcondo.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/marking.newcondo.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/marking.newcondo.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Logging
    access_log /var/log/nginx/marking-service-access.log;
    error_log /var/log/nginx/marking-service-error.log;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=marking_api:10m rate=10r/s;
    limit_req zone=marking_api burst=20 nodelay;

    # Proxy Settings
    location / {
        proxy_pass http://marking_service;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint (no rate limiting)
    location /health {
        proxy_pass http://marking_service;
        access_log off;
    }

    # Metrics endpoint (restricted)
    location /metrics {
        proxy_pass http://marking_service;
        allow 10.0.0.0/8;  # Internal network
        deny all;
    }
}
```

### 2. Enable and Test Nginx
```bash
# Test configuration
sudo nginx -t

# Enable site
sudo ln -s /etc/nginx/sites-available/marking-service /etc/nginx/sites-enabled/

# Reload Nginx
sudo systemctl reload nginx
```

---

## Production Checklist

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Database migrations completed
- [ ] SSL certificates installed
- [ ] Third-party API keys validated
- [ ] Redis connection tested
- [ ] Backup procedures in place
- [ ] Monitoring tools configured
- [ ] Load testing completed
- [ ] Security audit passed

### Deployment
- [ ] Service built successfully
- [ ] Health checks passing
- [ ] Log rotation configured
- [ ] PM2/Docker started successfully
- [ ] Nginx configuration applied
- [ ] DNS records updated
- [ ] Firewall rules configured

### Post-Deployment
- [ ] Health endpoint responding
- [ ] Payment processing tested
- [ ] Queue system functioning
- [ ] Notifications sending
- [ ] Monitoring dashboards active
- [ ] Error tracking enabled
- [ ] Performance metrics baseline established
- [ ] Documentation updated

---

## Monitoring & Logging

### 1. Health Check Endpoint
```bash
# Check service health
curl https://marking.newcondo.com/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2025-10-15T10:30:00Z",
#   "uptime": 86400,
#   "database": "connected",
#   "redis": "connected"
# }
```

### 2. Log Management

#### Configure Log Rotation

Create `/etc/logrotate.d/marking-service`:

```
/var/log/newcondo/marking-service*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 nodejs nodejs
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

#### View Logs
```bash
# Real-time logs
tail -f /var/log/newcondo/marking-service.log

# Search logs
grep "ERROR" /var/log/newcondo/marking-service.log

# PM2 logs
pm2 logs marking-service --lines 100
```

### 3. Monitoring Tools

#### Prometheus Metrics
The service exposes metrics at `/metrics`:

```
# HELP marking_jobs_total Total number of marking jobs
# TYPE marking_jobs_total counter
marking_jobs_total{status="completed"} 145
marking_jobs_total{status="queued"} 12

# HELP marking_job_duration_seconds Duration of marking jobs
# TYPE marking_job_duration_seconds histogram
marking_job_duration_seconds_bucket{le="1800"} 89
marking_job_duration_seconds_bucket{le="3600"} 134
```

#### Setup Sentry Error Tracking
Errors are automatically sent to Sentry if `SENTRY_DSN` is configured.

---

## Scaling Considerations

### Horizontal Scaling

#### 1. Add More Instances (PM2)
```bash
# Scale to 4 instances
pm2 scale marking-service 4

# Automatic scaling based on CPU
pm2 start ecosystem.config.js --instances max
```

#### 2. Load Balancer Configuration
Update Nginx upstream block:

```nginx
upstream marking_service {
    least_conn;
    server 127.0.0.1:3005 weight=3;
    server 127.0.0.1:3006 weight=2;
    server 127.0.0.1:3007 weight=2;
    server 127.0.0.1:3008 weight=1;
}
```

### Vertical Scaling

#### Increase Resources (Docker)
```yaml
services:
  marking-service:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### Database Optimization

#### Connection Pooling
Update `packages/db/src/index.ts`:

```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'error', 'warn'],
  __internal: {
    pool: {
      max: 20,
      min: 5,
      idleTimeoutMillis: 30000,
    },
  },
});
```

#### Read Replicas
Configure read replicas for heavy read operations.

---

## Troubleshooting

### Common Issues

#### 1. Service Won't Start

**Symptoms**: PM2 shows service as "errored"

**Solutions**:
```bash
# Check logs
pm2 logs marking-service --err

# Verify environment
cd backend/marking-service
npm run validate:env

# Test database connection
npx prisma db pull

# Check port availability
lsof -i :3005
```

#### 2. Database Connection Errors

**Symptoms**: "Connection refused" or timeout errors

**Solutions**:
```bash
# Test database connectivity
psql -h localhost -U user -d newcondo_db

# Check connection string
echo $DATABASE_URL

# Verify Prisma client
cd packages/db
npx prisma generate
```

#### 3. Queue Not Processing

**Symptoms**: Jobs stuck in QUEUED status

**Solutions**:
```bash
# Check Redis connection
redis-cli -h localhost -p 6379 PING

# Verify queue processor
pm2 logs marking-service | grep "queue"

# Inspect Redis keys
redis-cli KEYS "marking:queue:*"

# Clear stuck jobs (careful!)
redis-cli DEL "marking:queue:pending"
```

#### 4. Payment Webhooks Failing

**Symptoms**: Payments not confirming

**Solutions**:
```bash
# Test webhook endpoint
curl -X POST https://marking.newcondo.com/api/marking/webhooks/flutterwave \
  -H "verif-hash: your-webhook-secret" \
  -d '{"event": "test"}'

# Check webhook logs
grep "webhook" /var/log/newcondo/marking-service.log

# Verify Flutterwave configuration
curl https://api.flutterwave.com/v3/payments \
  -H "Authorization: Bearer $FLUTTERWAVE_SECRET_KEY"
```

#### 5. High Memory Usage

**Symptoms**: Service restarting frequently

**Solutions**:
```bash
# Monitor memory
pm2 monit

# Check for memory leaks
node --inspect dist/server.js

# Increase max memory
pm2 start ecosystem.config.js --max-memory-restart 2G

# Enable garbage collection logs
NODE_OPTIONS="--max-old-space-size=4096" pm2 restart marking-service
```

### Performance Issues

#### Slow API Responses

1. **Check Database Queries**:
```bash
# Enable query logging
DATABASE_LOGGING=true pm2 restart marking-service

# Analyze slow queries
grep "duration" /var/log/newcondo/marking-service.log | sort -n -k3
```

2. **Add Redis Caching**:
```typescript
// Cache frequently accessed data
const cachedAgents = await redis.get('agents:available');
if (!cachedAgents) {
  const agents = await prisma.user.findMany({...});
  await redis.set('agents:available', JSON.stringify(agents), 'EX', 300);
}
```

3. **Optimize Database Indexes**:
```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM "PropertyMarkingJob" 
WHERE status = 'QUEUED' 
ORDER BY "queuePosition";
```

---

## Rollback Procedures

### Quick Rollback (PM2)

```bash
# Stop current version
pm2 stop marking-service

# Checkout previous version
git checkout v1.0.0
cd backend/marking-service
npm install
npm run build

# Start previous version
pm2 start ecosystem.config.js

# Or reload from saved config
pm2 resurrect
```

### Database Rollback

```bash
# Rollback last migration
cd packages/db
npx prisma migrate resolve --rolled-back <migration-name>

# Or restore from backup
pg_restore -h localhost -U user -d newcondo_db backup.dump
```

### Docker Rollback

```bash
# Deploy previous image
docker-compose -f docker-compose.marking.yml pull
docker tag your-registry/marking-service:v1.0.0 your-registry/marking-service:latest
docker-compose -f docker-compose.marking.yml up -d

# Or use specific tag
docker-compose -f docker-compose.marking.yml up -d marking-service:v1.0.0
```

---

## Backup & Disaster Recovery

### Database Backups

```bash
# Daily automated backup
0 2 * * * pg_dump -h localhost -U user newcondo_db | gzip > /backups/db-$(date +\%Y\%m\%d).sql.gz

# Backup retention (keep 30 days)
find /backups -name "db-*.sql.gz" -mtime +30 -delete
```

### Service State Backup

```bash
# Backup PM2 configuration
pm2 save

# Backup environment files
tar -czf env-backup-$(date +%Y%m%d).tar.gz backend/marking-service/.env

# Backup uploaded files (if applicable)
aws s3 sync /var/uploads s3://newcondo-backups/uploads/
```

---

## Security Hardening

### 1. Firewall Rules
```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny 3005/tcp   # Block direct access to service
sudo ufw enable
```

### 2. Rate Limiting
Already configured in Nginx and application layer.

### 3. Secrets Management
Use environment-specific secrets:

```bash
# Production secrets should NEVER be in git
# Use AWS Secrets Manager, HashiCorp Vault, or similar

# Example with AWS Secrets Manager
aws secretsmanager get-secret-value \
  --secret-id marking-service/production \
  --query SecretString \
  --output text > .env
```

### 4. SSL/TLS
```bash
# Auto-renew Let's Encrypt certificates
sudo certbot renew --nginx --quiet

# Add to crontab
0 3 * * * certbot renew --nginx --quiet
```

---

## Maintenance

### Regular Tasks

**Daily**:
- Monitor error logs
- Check queue health
- Verify payment processing

**Weekly**:
- Review performance metrics
- Check disk space
- Update dependencies (security patches)

**Monthly**:
- Database optimization (VACUUM ANALYZE)
- Review and rotate logs
- Audit access logs
- Update SSL certificates (if needed)

### Maintenance Mode

```bash
# Enable maintenance mode
pm2 stop marking-service

# Update Nginx to show maintenance page
sudo cp /etc/nginx/maintenance.html /var/www/html/503.html

# Perform maintenance
npm install
npm run build
npx prisma migrate deploy

# Disable maintenance mode
pm2 start marking-service
```

---

## Support & Resources

### Documentation
- [Service README](./README.md)
- [API Documentation](./API.md)
- [Flow Diagrams](./FLOW.md)
- [Queue System](./QUEUE.md)

### Monitoring Dashboards
- Grafana: https://grafana.newcondo.com/marking-service
- Sentry: https://sentry.io/newcondo/marking-service

### Contacts
- **DevOps Team**: devops@newcondo.com
- **Backend Lead**: backend@newcondo.com
- **On-Call**: +234-XXX-XXX-XXXX

---

## Deployment Checklist Summary

```
□ Prerequisites verified
□ Environment variables configured
□ Database migrated
□ Service built and tested
□ PM2/Docker configured
□ Nginx configured
□ SSL certificates installed
□ Health checks passing
□ Monitoring enabled
□ Logs configured
□ Backups scheduled
□ Security hardened
□ Documentation updated
□ Team notified
□ Rollback plan ready
```

---

**Last Updated**: October 15, 2025  
**Version**: 1.0.0  
**Maintained By**: Newcondo DevOps Team