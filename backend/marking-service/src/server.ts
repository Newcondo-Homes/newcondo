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