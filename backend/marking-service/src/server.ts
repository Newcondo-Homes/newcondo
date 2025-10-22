import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import app from './app';
import { connectDatabase } from '../../../shared/src/config/database';

// Configuration
const PORT = process.env.MARKING_SERVICE_PORT || 3005;
const HOST = process.env.HOST || 'localhost';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Database connection
let isConnected = false;

async function connectToDatabase() {
  try {
    await connectDatabase();
    isConnected = true;
    console.log('📦 Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Server startup
async function startServer() {
  try {
    // Connect to database first
    await connectToDatabase();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Marking Service running on http://${HOST}:${PORT}`);
      console.log(`📊 Environment: ${NODE_ENV}`);
      console.log(`🏠 Property boundary marking and verification service`);
      console.log(`📝 Available endpoints:`);
      console.log(`   - GET  /health - Health check`);
      console.log(`   - GET  /info - Service information`);
      console.log(`   - POST /api/v1/marking-jobs - Create marking job`);
      console.log(`   - GET  /api/v1/queue - View queue status`);
      console.log(`   - POST /api/v1/assignments - Assign jobs to agents`);
      console.log(`   - POST /api/v1/completion - Complete marking jobs`);
      console.log('');
      console.log(`🔗 Integration:`);
      console.log(`   - Property Service: http://localhost:${process.env.PROPERTY_SERVICE_PORT || 3002}`);
      console.log(`   - Payment Service: http://localhost:${process.env.PAYMENT_SERVICE_PORT || 3003}`);
      console.log(`   - Notification Service: http://localhost:${process.env.NOTIFICATION_SERVICE_PORT || 3007}`);
    });

    // Handle server shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received, starting graceful shutdown...`);
      
      server.close(async (err) => {
        if (err) {
          console.error('❌ Error closing server:', err);
          process.exit(1);
        }

        console.log('✅ HTTP server closed');

        // Close database connection
        if (isConnected) {
          try {
            // Add database cleanup here if needed
            console.log('✅ Database connection closed');
          } catch (error) {
            console.error('❌ Error closing database connection:', error);
          }
        }

        console.log('✅ Marking service shut down gracefully');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('❌ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception in marking service:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

    return server;

  } catch (error) {
    console.error('❌ Failed to start marking service:', error);
    process.exit(1);
  }
}

// Development mode helpers
if (NODE_ENV === 'development') {
  console.log('🔧 Development mode features:');
  console.log('   - Hot reload enabled');
  console.log('   - Detailed error messages');
  console.log('   - Relaxed CORS policy');
  console.log('   - Increased rate limits');
  console.log('');
}

// Production mode warnings
if (NODE_ENV === 'production') {
  console.log('🔒 Production mode active:');
  console.log('   - Security headers enabled');
  console.log('   - Strict CORS policy');
  console.log('   - Rate limiting active');
  console.log('   - Error details hidden');
  console.log('');
}

// Required environment variables check
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'PLATFORM_URL',
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\nPlease check your .env file and try again.');
  process.exit(1);
}

// Start the server
startServer().catch((error) => {
  console.error('❌ Failed to start marking service:', error);
  process.exit(1);
});

export default app;




// /**
//  * Property Marking Service - Server Entry Point
//  * Location: backend/marking-service/src/server.ts
//  */

// import dotenv from 'dotenv';
// import path from 'path';
// import app from './app';

// // Load environment variables
// dotenv.config({ path: path.resolve(__dirname, '../.env') });

// // ==============================================
// // ENVIRONMENT VALIDATION
// // ==============================================

// const requiredEnvVars = [
//   'DATABASE_URL',
//   'DIRECT_URL',
//   'PORT',
//   'JWT_SECRET',
//   'ALLOWED_ORIGINS',
// ];

// const missingEnvVars = requiredEnvVars.filter(
//   (envVar) => !process.env[envVar]
// );

// if (missingEnvVars.length > 0) {
//   console.error(
//     '❌ Missing required environment variables:',
//     missingEnvVars.join(', ')
//   );
//   process.exit(1);
// }

// // ==============================================
// // SERVER CONFIGURATION
// // ==============================================

// const PORT = parseInt(process.env.PORT || '3004', 10);
// const HOST = process.env.HOST || '0.0.0.0';
// const NODE_ENV = process.env.NODE_ENV || 'development';

// // Service configuration
// const SERVICE_CONFIG = {
//   name: 'marking-service',
//   version: process.env.SERVICE_VERSION || '1.0.0',
//   port: PORT,
//   host: HOST,
//   environment: NODE_ENV,
//   features: {
//     markingJobManagement: true,
//     agentQueueSystem: true,
//     proximityBasedAssignment: true,
//     timeSlotManagement: true,
//     paymentProcessing: true,
//     ownerConfirmationSystem: true,
//   },
//   pricing: {
//     markingFee: parseInt(process.env.MARKING_FEE || '20000', 10),
//     agentCommissionRate: parseFloat(process.env.AGENT_COMMISSION_RATE || '0.25'),
//     partialPayment: parseInt(process.env.PARTIAL_PAYMENT || '1000', 10),
//     adminMarkingFee: parseInt(process.env.ADMIN_MARKING_FEE || '25000', 10),
//   },
//   timeWindows: {
//     agentTimeSlotHours: parseInt(process.env.AGENT_TIME_SLOT_HOURS || '3', 10),
//     ownerConfirmationDays: parseInt(process.env.OWNER_CONFIRMATION_DAYS || '3', 10),
//     maxJobDurationDays: parseInt(process.env.MAX_JOB_DURATION_DAYS || '3', 10),
//   },
//   proximity: {
//     maxDistanceKm: parseInt(process.env.MAX_ASSIGNMENT_DISTANCE_KM || '50', 10),
//     preferredDistanceKm: parseInt(process.env.PREFERRED_DISTANCE_KM || '20', 10),
//   },
// };

// // ==============================================
// // DATABASE CONNECTION
// // ==============================================

// async function connectDatabase() {
//   try {
//     // TODO: Initialize Prisma client
//     // const prisma = new PrismaClient();
//     // await prisma.$connect();
//     console.log('✅ Database connected successfully');
//     return true;
//   } catch (error) {
//     console.error('❌ Database connection failed:', error);
//     return false;
//   }
// }

// // ==============================================
// // REDIS CONNECTION (Optional)
// // ==============================================

// async function connectRedis() {
//   try {
//     // TODO: Initialize Redis client if needed for queue management
//     // const redis = createRedisClient();
//     // await redis.connect();
//     console.log('✅ Redis connected successfully');
//     return true;
//   } catch (error) {
//     console.error('⚠️  Redis connection failed (optional):', error);
//     return false; // Non-critical, service can work without Redis
//   }
// }

// // ==============================================
// // BACKGROUND JOBS & SCHEDULED TASKS
// // ==============================================

// function initializeBackgroundJobs() {
//   console.log('🔄 Initializing background jobs...');

//   // TODO: Set up cron jobs or task schedulers

//   // 1. Job expiration checker (runs every 5 minutes)
//   // Check for expired time slots and move to next agent in queue
//   // setInterval(checkExpiredTimeSlots, 5 * 60 * 1000);

//   // 2. Owner confirmation deadline checker (runs every hour)
//   // Check for expired confirmation deadlines and process partial payments
//   // setInterval(checkConfirmationDeadlines, 60 * 60 * 1000);

//   // 3. Stale job cleaner (runs daily)
//   // Archive or cleanup old completed/cancelled jobs
//   // setInterval(cleanupStaleJobs, 24 * 60 * 60 * 1000);

//   // 4. Agent queue health monitor (runs every 10 minutes)
//   // Monitor queue health and send alerts if issues detected
//   // setInterval(monitorQueueHealth, 10 * 60 * 1000);

//   console.log('✅ Background jobs initialized');
// }

// // ==============================================
// // WEBHOOK HANDLERS (If needed)
// // ==============================================

// function initializeWebhooks() {
//   console.log('🔗 Initializing webhook handlers...');

//   // TODO: Set up webhook handlers for:
//   // - Payment service notifications
//   // - Property service updates
//   // - Notification service callbacks

//   console.log('✅ Webhook handlers initialized');
// }

// // ==============================================
// // SERVER STARTUP
// // ==============================================

// async function startServer() {
//   console.log('\n🚀 Starting Property Marking Service...\n');
//   console.log('📋 Service Configuration:');
//   console.log(JSON.stringify(SERVICE_CONFIG, null, 2));
//   console.log('\n');

//   try {
//     // Connect to database
//     const dbConnected = await connectDatabase();
//     if (!dbConnected) {
//       throw new Error('Failed to connect to database');
//     }

//     // Connect to Redis (optional)
//     await connectRedis();

//     // Initialize background jobs
//     initializeBackgroundJobs();

//     // Initialize webhooks
//     initializeWebhooks();

//     // Start the Express server
//     const server = app.listen(PORT, HOST, () => {
//       console.log('\n✅ Server is running!\n');
//       console.log(`🌐 Environment: ${NODE_ENV}`);
//       console.log(`🏠 Host: ${HOST}`);
//       console.log(`🔌 Port: ${PORT}`);
//       console.log(`📡 Health check: http://${HOST}:${PORT}/health`);
//       console.log(`📊 Service info: http://${HOST}:${PORT}/info`);
//       console.log('\n🎯 Available endpoints:');
//       console.log(`   POST   /api/marking-jobs              Create marking job`);
//       console.log(`   GET    /api/marking-jobs/:id          Get job details`);
//       console.log(`   PATCH  /api/marking-jobs/:id/status   Update job status`);
//       console.log(`   POST   /api/queue/join                Join agent queue`);
//       console.log(`   GET    /api/queue/:jobId              Get queue status`);
//       console.log(`   POST   /api/assignments/accept        Accept assignment`);
//       console.log(`   POST   /api/completion/submit         Submit completion`);
//       console.log(`   POST   /api/completion/confirm        Confirm by owner`);
//       console.log('\n⏳ Waiting for requests...\n');
//     });

//     // Handle server errors
//     server.on('error', (error: NodeJS.ErrnoException) => {
//       if (error.code === 'EADDRINUSE') {
//         console.error(`❌ Port ${PORT} is already in use`);
//         console.error('   Try using a different port or stop the other process');
//       } else {
//         console.error('❌ Server error:', error);
//       }
//       process.exit(1);
//     });

//     // Graceful shutdown handler
//     const gracefulShutdown = async () => {
//       console.log('\n⏳ Shutting down gracefully...');

//       server.close(async () => {
//         console.log('✅ HTTP server closed');

//         try {
//           // TODO: Close database connection
//           // await prisma.$disconnect();
//           console.log('✅ Database connection closed');

//           // TODO: Close Redis connection
//           // await redis.quit();
//           console.log('✅ Redis connection closed');

//           console.log('👋 Goodbye!\n');
//           process.exit(0);
//         } catch (error) {
//           console.error('❌ Error during shutdown:', error);
//           process.exit(1);
//         }
//       });

//       // Force shutdown after 10 seconds
//       setTimeout(() => {
//         console.error('❌ Forced shutdown due to timeout');
//         process.exit(1);
//       }, 10000);
//     };

//     // Listen for shutdown signals
//     process.on('SIGTERM', gracefulShutdown);
//     process.on('SIGINT', gracefulShutdown);

//   } catch (error) {
//     console.error('\n❌ Failed to start server:', error);
//     process.exit(1);
//   }
// }

// // ==============================================
// // START THE SERVER
// // ==============================================

// startServer().catch((error) => {
//   console.error('❌ Unhandled error during startup:', error);
//   process.exit(1);
// });

// // Export for testing purposes
// export { app, SERVICE_CONFIG };







// import app from './app';
// import { PrismaClient } from '@newcondo/db';
// import { redisClient } from '../../shared/src/config/redis';

// const PORT = process.env.PORT || 4003;
// const prisma = new PrismaClient();

// // Graceful shutdown handler
// const gracefulShutdown = async (signal: string) => {
//   console.log(`\n${signal} received. Starting graceful shutdown...`);
  
//   try {
//     // Close database connection
//     await prisma.$disconnect();
//     console.log('Database connection closed');
    
//     // Close Redis connection
//     await redisClient.quit();
//     console.log('Redis connection closed');
    
//     // Exit process
//     process.exit(0);
//   } catch (error) {
//     console.error('Error during graceful shutdown:', error);
//     process.exit(1);
//   }
// };

// // Start server
// const startServer = async () => {
//   try {
//     // Test database connection
//     await prisma.$connect();
//     console.log('✅ Database connected successfully');
    
//     // Test Redis connection
//     await redisClient.ping();
//     console.log('✅ Redis connected successfully');
    
//     // Start Express server
//     const server = app.listen(PORT, () => {
//       console.log(`🚀 Marking Service running on port ${PORT}`);
//       console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
//       console.log(`🔗 Health check: http://localhost:${PORT}/health`);
//     });
    
//     // Handle graceful shutdown
//     process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
//     process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
//     // Handle uncaught errors
//     process.on('uncaughtException', (error) => {
//       console.error('Uncaught Exception:', error);
//       gracefulShutdown('uncaughtException');
//     });
    
//     process.on('unhandledRejection', (reason, promise) => {
//       console.error('Unhandled Rejection at:', promise, 'reason:', reason);
//       gracefulShutdown('unhandledRejection');
//     });
    
//   } catch (error) {
//     console.error('Failed to start server:', error);
//     process.exit(1);
//   }
// };

// startServer();










// // backend/marking-service/src/server.ts

// import dotenv from 'dotenv';
// import app from './app';
// import { PrismaClient } from '@newcondo/db';
// import Redis from 'ioredis';

// // Load environment variables
// dotenv.config();

// const PORT = process.env.MARKING_SERVICE_PORT || 4003;
// const NODE_ENV = process.env.NODE_ENV || 'development';

// // Initialize Prisma
// const prisma = new PrismaClient({
//   log: NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
// });

// // Initialize Redis
// const redis = new Redis({
//   host: process.env.REDIS_HOST || 'localhost',
//   port: parseInt(process.env.REDIS_PORT || '6379'),
//   password: process.env.REDIS_PASSWORD,
//   retryStrategy: (times) => {
//     const delay = Math.min(times * 50, 2000);
//     return delay;
//   },
// });

// // Handle Redis connection events
// redis.on('connect', () => {
//   console.log('✅ Redis connected successfully');
// });

// redis.on('error', (error) => {
//   console.error('❌ Redis connection error:', error);
// });

// // Graceful shutdown handler
// const gracefulShutdown = async () => {
//   console.log('\n🛑 Received shutdown signal, closing connections...');

//   try {
//     // Close Redis connection
//     await redis.quit();
//     console.log('✅ Redis connection closed');

//     // Disconnect Prisma
//     await prisma.$disconnect();
//     console.log('✅ Prisma disconnected');

//     // Exit process
//     process.exit(0);
//   } catch (error) {
//     console.error('❌ Error during shutdown:', error);
//     process.exit(1);
//   }
// };

// // Handle shutdown signals
// process.on('SIGTERM', gracefulShutdown);
// process.on('SIGINT', gracefulShutdown);

// // Handle uncaught exceptions
// process.on('uncaughtException', (error) => {
//   console.error('❌ Uncaught Exception:', error);
//   gracefulShutdown();
// });

// // Handle unhandled promise rejections
// process.on('unhandledRejection', (reason, promise) => {
//   console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
//   gracefulShutdown();
// });

// // Database connection check
// async function checkDatabaseConnection() {
//   try {
//     await prisma.$connect();
//     console.log('✅ Database connected successfully');
//   } catch (error) {
//     console.error('❌ Database connection failed:', error);
//     process.exit(1);
//   }
// }

// // Start server
// async function startServer() {
//   try {
//     // Check database connection
//     await checkDatabaseConnection();

//     // Start listening
//     const server = app.listen(PORT, () => {
//       console.log(`
// ╔════════════════════════════════════════╗
// ║   Marking Service Started Successfully  ║
// ╠════════════════════════════════════════╣
// ║ Port:        ${PORT}                    
// ║ Environment: ${NODE_ENV}                
// ║ Time:        ${new Date().toISOString()} 
// ╚════════════════════════════════════════╝
//       `);
//     });

//     // Handle server errors
//     server.on('error', (error: NodeJS.ErrnoException) => {
//       if (error.code === 'EADDRINUSE') {
//         console.error(`❌ Port ${PORT} is already in use`);
//       } else {
//         console.error('❌ Server error:', error);
//       }
//       process.exit(1);
//     });
//   } catch (error) {
//     console.error('❌ Failed to start server:', error);
//     process.exit(1);
//   }
// }

// // Start the server
// startServer();

// // Export for testing
// export { prisma, redis };