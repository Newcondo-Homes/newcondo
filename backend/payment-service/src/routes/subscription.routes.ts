import { Router, Request, Response } from "express";
import type { Router as ExpressRouter } from "express";

import { authMiddleware } from "@newcondo/backend-shared";

import {
  initiateSubscription,
} from "../services/subscription.service";
import { SubscriptionPlan } from "@newcondo/db";

const router: ExpressRouter = Router();

// POST /api/subscriptions/initiate
// Owners and agents call this to start a paid subscription
router.post("/initiate", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { planType } = req.body as { planType: SubscriptionPlan };
    const userId = req.user!.id;

    if (!planType || !Object.values(SubscriptionPlan).includes(planType)) {
      return res.status(400).json({ error: "Invalid plan type" });
    }

    const result = await initiateSubscription(userId, planType);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("Subscription initiation error:", err.message);
    return res.status(400).json({ error: err.message });
  }
});

// GET /api/subscriptions/me
// Returns the current user's subscription
router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { PrismaClient } = await import("@newcondo/db");
    const prisma = new PrismaClient();

    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user!.id },
      include: {
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    return res.status(200).json({ success: true, data: subscription });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;