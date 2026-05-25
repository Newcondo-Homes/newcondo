import dotenv from 'dotenv';
dotenv.config();

// to keep render service alive!
//------------------------
import https from 'https';
//------------------------

import app from './app';
import { logger } from './utils/logger';
import { config } from './config/environment';

const PORT = config.PORT || 5000;
const HOST = '0.0.0.0';

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  process.exit(0);
};

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
app.listen(PORT, HOST, () => {
  logger.info(`🚀 Combined NewCondo Backend running on port ${PORT}`);
  logger.info(`📡 Health check available at: http://localhost:${PORT}/health`);
  logger.info(`🔗 API Documentation: http://localhost:${PORT}/api/docs`);
  logger.info(`🌍 Environment: ${config.NODE_ENV}`);

  if (config.NODE_ENV === 'production') {
    const PING_URL = 'https://newcondo-combined-backend.onrender.com/health';
    const INTERVAL = 14 * 60 * 1000; // 14 minutes

    logger.info(`⏰ Self-pinger initialized. Will ping ${PING_URL} every 14 minutes.`);

    setInterval(() => {
      https.get(PING_URL, (res) => {
        if (res.statusCode === 200) {
          logger.info('💓 Self-ping successful. Keeping the instance awake.');
        } else {
          logger.warn(`⚠️ Self-ping returned status code: ${res.statusCode}`);
        }
      }).on('error', (err) => {
        logger.error('❌ Error during self-ping:', err.message);
      });
    }, INTERVAL);
  }
});

// export { app };