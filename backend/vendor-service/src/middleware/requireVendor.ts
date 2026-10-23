// backend/vendor-service/src/middleware/requireVendor.ts
// Runs AFTER shared authMiddleware. Resolves the caller's Vendor row and
// refuses anyone who isn't a VENDOR user, or whose vendor is suspended.
import type { Request, Response, NextFunction } from "express";
import { prisma } from "@newcondo/db";
import "../types/request";

export async function requireVendor(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) { res.status(401).json({ success: false, message: "Authentication required" }); return; }
  if (req.user.role !== "VENDOR") { res.status(403).json({ success: false, message: "Vendor account required" }); return; }
  const v = await prisma.vendor.findUnique({ where: { userId: req.user.id }, select: { id: true, name: true, status: true, releaseMode: true, services: true, isActive: true } });
  if (!v || !v.isActive || v.status === "SUSPENDED") { res.status(403).json({ success: false, message: "This vendor account is not active" }); return; }
  req.vendor = { id: v.id, name: v.name, status: v.status, releaseMode: v.releaseMode, services: v.services };
  next();
}
