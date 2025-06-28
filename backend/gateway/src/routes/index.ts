// backend/gateway/src/routes/index.ts
import { Router } from "express";
import { authMiddleware, adminMiddleware } from "../middleware/auth";

const router = Router();

// API documentation endpoint
router.get("/", (req, res) => {
  res.json({
    name: "NewCondo API Gateway",
    version: "1.0.0",
    description: "Central API gateway for NewCondo microservices",
    endpoints: {
      auth: "/api/auth",
      properties: "/api/properties",
      payments: "/api/payments",
      bookings: "/api/bookings",
      marking: "/api/marking",
      referrals: "/api/referrals",
      notifications: "/api/notifications",
      analytics: "/api/analytics",
      admin: "/api/admin",
      webhooks: "/api/webhooks",
    },
    documentation: "/api/docs",
    health: "/health",
  });
});

// API documentation
router.get("/docs", (req, res) => {
  res.json({
    openapi: "3.0.0",
    info: {
      title: "NewCondo API",
      version: "1.0.0",
      description: "API documentation for NewCondo platform",
    },
    servers: [
      {
        url: `${req.protocol}://${req.get("host")}/api`,
        description: "API Gateway",
      },
    ],
    paths: {
      "/auth/login": {
        post: {
          summary: "User login",
          tags: ["Authentication"],
        },
      },
      "/auth/register": {
        post: {
          summary: "User registration",
          tags: ["Authentication"],
        },
      },
      "/properties": {
        get: {
          summary: "Get properties",
          tags: ["Properties"],
        },
      },
      // Add more endpoint documentation as needed
    },
  });
});

export { router as serviceRoutes };
