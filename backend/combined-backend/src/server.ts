import dotenv from 'dotenv';
dotenv.config();

// to keep render service alive!
//------------------------
import https from 'https';
//------------------------

import app from './app';
import { logger } from './utils/logger';
import { config } from './config/environment';
import { registerChargeHandler, startMoneyCron, type VerifiedPayment } from '@newcondo/payment-service';
import { confirmMarkingFeePaid, dripLapsedMarkingPayouts, advanceExpiredSlots } from '@newcondo/marking-service';

// MONEY CORE — packages that settle their own payments register here, so
// payment-service never imports them (that would make the graph circular).
registerChargeHandler('NC-MKFEE-', (ref: string, paid: VerifiedPayment) =>
  confirmMarkingFeePaid(ref, { amountNaira: paid.amountNaira, settledNaira: paid.settledNaira, via: paid.via, inboundTransferId: paid.inboundTransferId, transactionId: paid.transactionId }));

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

  // Scheduled money tasks (escrow release was never scheduled before — HELD
  // rent only released when a renter tapped "confirm"). Set RUN_CRONS=false
  // on any extra instance so jobs run once.
  if (process.env.RUN_CRONS !== 'false') {
    startMoneyCron({
      extra: [
        { name: 'marking-lapse-drip', schedule: '20 * * * *', run: () => dripLapsedMarkingPayouts() },
        { name: 'marking-slot-advance', schedule: '*/10 * * * *', run: () => advanceExpiredSlots() },
      ],
    });
  }

  if (config.NODE_ENV === 'development') {
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