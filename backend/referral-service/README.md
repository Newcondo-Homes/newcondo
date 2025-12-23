# NewCondo Referral Service

A comprehensive referral and rewards system for the NewCondo platform.

## Features

- 🎁 **Dual-sided Rewards** - Both referrer and referred users earn rewards
- 🔗 **Unique Referral Links** - Generate shareable links with tracking
- 📊 **Advanced Analytics** - Track performance, conversions, and earnings
- 💰 **Multiple Reward Types** - Service credits, rent discounts, commission credits
- 🎯 **Smart Attribution** - Multi-touch attribution with 30-day window
- 🔒 **Fraud Prevention** - Rate limiting and suspicious activity detection
- 📱 **Social Sharing** - Pre-built integrations for WhatsApp, Facebook, Twitter
- 💳 **Auto-payout** - Automatic reward distribution to virtual accounts

## Architecture

```
referral-service/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Custom middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── types/           # TypeScript types
│   ├── utils/           # Helper functions
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
└── dist/                # Compiled JavaScript
```

## API Endpoints

### Referrals
- `GET /api/referrals/dashboard` - Get referral dashboard
- `GET /api/referrals/code` - Get/create referral code
- `GET /api/referrals/links` - Get shareable links
- `GET /api/referrals/validate/:code` - Validate referral code
- `GET /api/referrals` - List user's referrals
- `POST /api/referrals/regenerate` - Regenerate referral code

### Tracking
- `POST /api/tracking/click` - Track referral click
- `POST /api/tracking/conversion` - Track conversion
- `GET /api/tracking/analytics/:code` - Get click analytics
- `GET /api/tracking/performance` - Get performance metrics
- `GET /api/tracking/attribution` - Get attribution data

### Rewards
- `GET /api/rewards/balance` - Get reward balance
- `GET /api/rewards` - List user's rewards
- `GET /api/rewards/summary` - Get reward summary
- `POST /api/rewards/apply` - Apply reward to transaction
- `POST /api/rewards/:id/redeem` - Redeem reward

### Analytics
- `GET /api/analytics/overview` - Get analytics overview
- `GET /api/analytics/trends` - Get referral trends
- `GET /api/analytics/performance` - Get performance metrics
- `GET /api/analytics/channels` - Get channel analytics
- `GET /api/analytics/leaderboard` - Get top referrers

## Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

## Environment Variables

```env
# Server
PORT=3007
NODE_ENV=development

# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Platform
PLATFORM_URL=http://localhost:3000

# Referral Config
REFERRAL_CODE_PREFIX=NC
ATTRIBUTION_WINDOW_DAYS=30
MAX_REFERRALS_PER_DAY=10
```

## Referral Types & Rewards

| Referral Type | Referrer Reward | Referred Reward |
|---------------|-----------------|-----------------|
| Owner → Owner | ₦10,000 credit | ₦10,000 credit |
| Owner → Agent | ₦5,000 credit | ₦5,000 credit |
| Owner → Renter | ₦2,000 credit | ₦2,000 credit |
| Agent → Owner | ₦7,000 credit | ₦3,000 discount |
| Agent → Agent | ₦3,000 credit | ₦3,000 credit |
| Agent → Renter | ₦5,000 credit | ₦5,000 rent credit |
| Renter → Renter | ₦2,000 credit | ₦2,000 credit |

## Commission Structure

- Platform takes 20% of rent amount
- Listing agent gets 50% of platform commission (10% of rent)
- Sub-agent gets 50% of platform commission (10% of rent) when applicable
- Commissions split equally between listing and sub-agents when both present

## Usage Examples

### Generate Referral Link

```typescript
// GET /api/referrals/links
{
  "success": true,
  "data": {
    "referralCode": "NC12345678",
    "referralLink": "https://newcondo.ng/register?ref=NC12345678",
    "shareLinks": {
      "whatsapp": "https://wa.me/?text=...",
      "facebook": "https://facebook.com/sharer...",
      "twitter": "https://twitter.com/intent/tweet...",
      "email": "mailto:?subject=...",
      "sms": "Join NewCondo..."
    }
  }
}
```

### Track Referral Click

```typescript
// POST /api/tracking/click
{
  "referralCode": "NC12345678",
  "sessionId": "abc-123",
  "referrerUrl": "https://facebook.com",
  "landingPage": "https://newcondo.ng/register"
}
```

### Check Reward Balance

```typescript
// GET /api/rewards/balance
{
  "success": true,
  "data": {
    "userId": "user123",
    "totalBalance": 25000,
    "availableBalance": 20000,
    "pendingBalance": 5000,
    "expiringSoon": [
      {
        "amount": 10000,
        "expiryDate": "2025-03-23T00:00:00Z"
      }
    ],
    "rewardsByType": {
      "SERVICE_CREDIT": 15000,
      "RENT_CREDIT": 5000
    }
  }
}
```

## Rate Limits

- General API: 100 requests per 15 minutes
- Referral creation: 10 per day per user
- Click tracking: 10 per minute per IP
- Reward redemption: 5 per hour per user
- Analytics: 20 per 5 minutes per user

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Monitoring

The service exposes a health check endpoint:

```bash
GET /health
```

Response:
```json
{
  "success": true,
  "data": {
    "service": "referral-service",
    "status": "healthy",
    "timestamp": "2025-01-23T10:00:00Z",
    "uptime": 3600
  }
}
```

## Security

- JWT authentication for protected routes
- Rate limiting on all endpoints
- Fraud detection for suspicious referral patterns
- Input validation with Zod schemas
- Helmet.js security headers
- CORS configuration

## Contributing

1. Create a feature branch
2. Make your changes
3. Add tests
4. Submit a pull request

## License

MIT License - NewCondo Team