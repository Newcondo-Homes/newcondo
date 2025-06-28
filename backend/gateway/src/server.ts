// backend/gateway/src/server.ts
import app from "./app";
import { config } from "./config/environment";

const PORT = config.PORT || 8000;

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`🔗 Gateway URL: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 Environment: ${config.NODE_ENV}`);

  // Log service endpoints
  console.log("\n📡 Service Endpoints:");
  console.log(`Auth Service: ${config.AUTH_SERVICE_URL}`);
  console.log(`Property Service: ${config.PROPERTY_SERVICE_URL}`);
  console.log(`Payment Service: ${config.PAYMENT_SERVICE_URL}`);
  console.log(`Booking Service: ${config.BOOKING_SERVICE_URL}`);
  console.log(`Marking Service: ${config.MARKING_SERVICE_URL}`);
  console.log(`Admin Service: ${config.ADMIN_SERVICE_URL}`);
  console.log(`Referral Service: ${config.REFERRAL_SERVICE_URL}`);
  console.log(`Notification Service: ${config.NOTIFICATION_SERVICE_URL}`);
  console.log(`Analytics Service: ${config.ANALYTICS_SERVICE_URL}`);
});
