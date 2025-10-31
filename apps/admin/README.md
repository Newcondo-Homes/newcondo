# Newcondo Admin Dashboard

Admin dashboard for managing the Newcondo property rental platform. This application provides comprehensive tools for user verification, property approval, payment monitoring, boundary dispute resolution, and marking job oversight.

## 🚀 Features

### Core Admin Features
- **User Management**: Verify/reject user documents, manage user accounts
- **Property Approval**: Review and approve/reject property listings
- **Document Verification**: Verify identity documents, property ownership, and legal documents
- **Transaction Monitoring**: Monitor all payments, refunds, and virtual account activities
- **Analytics Dashboard**: View platform metrics, revenue reports, and user statistics

### Property Marking Oversight
- **Marking Job Management**: Monitor and oversee property marking jobs
- **Agent Queue Oversight**: Manage agent queues and time slot assignments
- **Quality Control**: Review marking job completions and approve/reject submissions
- **Agent Performance**: Track agent reliability scores and completion rates

### Dispute Resolution
- **Boundary Disputes**: Resolve property boundary conflicts and overlaps
- **Duplicate Management**: Handle duplicate property reports and resolutions
- **Support Tickets**: Manage user support requests and issues

### Advanced Features
- **Real-time Updates**: Live notifications for critical admin actions
- **Advanced Filtering**: Filter by status, date range, location, and more
- **Bulk Actions**: Process multiple items simultaneously
- **Audit Logs**: Track all admin actions for compliance

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL database
- Redis (for real-time features)
- Backend services running (admin-service, property-service, etc.)

## 🛠️ Installation

1. **Clone the monorepo** (if not already done):
```bash
git clone <repository-url>
cd newcondo-monorepo
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
cd apps/admin
cp .env.example .env.local
```

4. **Configure your environment variables** in `.env.local`:
   - Database URLs
   - NextAuth secret and URL
   - API service URLs
   - Google Maps API key
   - UploadThing credentials
   - Redis URL

5. **Run database migrations** (from monorepo root):
```bash
cd packages/db
npx prisma migrate dev
npx prisma generate
```

## 🚀 Running the Application

### Development Mode
```bash
# From apps/admin directory
npm run dev
```

The admin dashboard will be available at `http://localhost:3001`

### Production Build
```bash
# Build the application
npm run build

# Start production server
npm run start
```

## 🏗️ Project Structure

```
apps/admin/
├── app/                      # Next.js 15 App Router
│   ├── (auth)/              # Authentication routes
│   ├── (dashboard)/         # Protected admin routes
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing/redirect page
├── components/              # Admin-specific components
│   ├── admin/              # Admin feature components
│   └── shared/             # Shared UI components
├── hooks/                   # Custom React hooks
├── lib/                     # Utilities and API clients
│   ├── api/                # API service clients
│   ├── validations/        # Zod schemas
│   ├── constants/          # Constants and enums
│   └── utils/              # Helper functions
├── store/                   # Zustand state management
├── types/                   # TypeScript type definitions
└── public/                  # Static assets
```

## 🔒 Authentication

The admin dashboard uses NextAuth v5 for authentication with role-based access control. Only users with the `ADMIN` role can access the dashboard.

### Admin Roles & Permissions
- **Super Admin**: Full access to all features
- **Verifier**: User and property verification only
- **Support**: Support ticket management
- **Finance**: Payment and transaction monitoring

## 🧪 Testing

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint
```

## 📦 Shared Packages

This application uses the following shared packages from the monorepo:

- `@newcondo/db`: Prisma schema and database client
- `@newcondo/ui`: Shared shadcn/ui components
- `@newcondo/auth`: NextAuth configuration

## 🔧 Configuration

### API Services
Configure backend service URLs in `.env.local`:
- Admin Service: Port 4005
- Property Service: Port 4001
- Payment Service: Port 4002
- Marking Service: Port 4004
- Analytics Service: Port 4006
- Notification Service: Port 4007

### Google Maps Integration
The admin dashboard uses Google Maps API for:
- Viewing property boundaries
- Validating property locations
- Resolving boundary disputes

Get your API key from [Google Cloud Console](https://console.cloud.google.com/)

### UploadThing Integration
Used for viewing and managing uploaded documents:
- Identity verification documents
- Property ownership documents
- Marking job completion photos

Get your credentials from [UploadThing](https://uploadthing.com/)

## 🔐 Security Features

- **Session Management**: Automatic timeout after inactivity
- **Rate Limiting**: Prevent API abuse
- **CSRF Protection**: Built-in with NextAuth
- **Secure Headers**: X-Frame-Options, CSP, etc.
- **Audit Logging**: All admin actions are logged

## 📊 Key Features

### User Management
- View all users with advanced filtering
- Verify/reject identity documents
- View user activity and transaction history
- Suspend/activate user accounts
- Reset user passwords

### Property Management
- Approve/reject property listings
- View property boundaries on maps
- Resolve duplicate property reports
- Manage property availability status
- View property performance metrics

### Payment Monitoring
- View all transactions in real-time
- Process refunds
- Monitor virtual account balances
- Track commission distributions
- Generate financial reports

### Marking Job Oversight
- View all marking jobs and their status
- Monitor agent queue positions
- Review marking job completions
- Approve/reject marking submissions
- Track agent performance metrics

### Support & Disputes
- Manage support tickets
- Resolve boundary disputes
- Handle duplicate property reports
- View dispute resolution history

## 🐛 Troubleshooting

### Common Issues

1. **Backend services not responding**:
   - Ensure all backend services are running
   - Check service URLs in `.env.local`
   - Verify network connectivity

2. **Database connection errors**:
   - Verify PostgreSQL is running
   - Check database credentials in `.env.local`
   - Run migrations: `npx prisma migrate dev`

3. **Google Maps not loading**:
   - Verify API key is valid
   - Enable Maps JavaScript API in Google Cloud Console
   - Check for API quota limits

4. **Authentication issues**:
   - Clear browser cookies
   - Verify NEXTAUTH_SECRET is set
   - Check user role is set to ADMIN

## 📝 Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_URL` | NextAuth base URL | Yes |
| `NEXTAUTH_SECRET` | NextAuth secret key | Yes |
| `NEXT_PUBLIC_API_URL` | Base API URL | Yes |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key | Yes |
| `UPLOADTHING_SECRET` | UploadThing secret key | Yes |
| `REDIS_URL` | Redis connection string | Optional |

## 🤝 Contributing

This is part of the Newcondo monorepo. Please follow the project's contribution guidelines.

## 📄 License

Proprietary - All rights reserved

## 📧 Support

For admin dashboard support:
- Email: admin@newcondo.com
- Technical Issues: dev@newcondo.com

---

**Note**: This is an internal admin tool. Access is restricted to authorized administrators only.