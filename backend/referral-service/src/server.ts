import app from './app'
import { prisma } from '@newcondo/db'
import dotenv from 'dotenv';

// Configure dotenv to load .env file
dotenv.config();

const PORT = process.env.PORT || 3001

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect()
    console.log('Database connected successfully')

    app.listen(PORT, () => {
      console.log(`Auth service running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()













// // backend/referral-service/src/server.ts

// import dotenv from 'dotenv';
// import app from './app';
// import { PrismaClient } from '@newcondo/db';
// import { redisClient } from './middleware/rateLimiting';

// // Load environment variables
// dotenv.config();

// const PORT = process.env.PORT || 3007;
// const prisma = new PrismaClient();

// /**
//  * Start server
//  */
// async function startServer() {
//   try {
//     // Test database connection
//     await prisma.$connect();
//     console.log('✅ Database connected successfully');

//     // Test Redis connection
//     if (redisClient.isOpen) {
//       console.log('✅ Redis connected successfully');
//     }

//     // Start Express server
//     const server = app.listen(PORT, () => {
//       console.log(`🚀 Referral Service running on port ${PORT}`);
//       console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
//       console.log(`🔗 Health check: http://localhost:${PORT}/health`);
//       console.log(`📊 API Base: http://localhost:${PORT}/api`);
//     });

//     // Graceful shutdown
//     const gracefulShutdown = async (signal: string) => {
//       console.log(`\n${signal} received. Starting graceful shutdown...`);

//       // Stop accepting new connections
//       server.close(async () => {
//         console.log('✅ HTTP server closed');

//         try {
//           // Close database connection
//           await prisma.$disconnect();
//           console.log('✅ Database connection closed');

//           // Close Redis connection
//           await redisClient.quit();
//           console.log('✅ Redis connection closed');

//           console.log('✅ Graceful shutdown completed');
//           process.exit(0);
//         } catch (error) {
//           console.error('❌ Error during shutdown:', error);
//           process.exit(1);
//         }
//       });

//       // Force shutdown after 30 seconds
//       setTimeout(() => {
//         console.error('❌ Forced shutdown after timeout');
//         process.exit(1);
//       }, 30000);
//     };

//     // Listen for termination signals
//     process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
//     process.on('SIGINT', () => gracefulShutdown('SIGINT'));

//     // Handle uncaught exceptions
//     process.on('uncaughtException', (error) => {
//       console.error('❌ Uncaught Exception:', error);
//       gracefulShutdown('UNCAUGHT_EXCEPTION');
//     });

//     // Handle unhandled promise rejections
//     process.on('unhandledRejection', (reason, promise) => {
//       console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
//       gracefulShutdown('UNHANDLED_REJECTION');
//     });

//   } catch (error) {
//     console.error('❌ Failed to start server:', error);
//     process.exit(1);
//   }
// }

// // Start the server
// startServer();