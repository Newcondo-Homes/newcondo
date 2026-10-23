// backend/admin-service/src/utils/audit.ts
// Append-only audit trail (AdminAction). Every mutating admin route calls this
// inside the same transaction as the change, so a change without a log row
// can't exist. The table has onDelete: Restrict and no update/delete route.
import { prisma } from "@newcondo/db";
import type { Prisma, AdminActionType } from "@newcondo/db";
import type { Request } from "express";
import { createHash } from "crypto";

type Tx = Prisma.TransactionClient | typeof prisma;

export const ipHash = (req: Request) => createHash("sha256").update(`${req.ip ?? ""}|${process.env.IP_HASH_SALT ?? ""}`).digest("hex").slice(0, 24);

export async function audit(tx: Tx, req: Request, a: { action: AdminActionType; targetType: string; targetId: string; description: string; metadata?: Record<string, unknown> }) {
  await tx.adminAction.create({
    data: {
      adminId: req.staff!.userId, action: a.action, targetType: a.targetType, targetId: a.targetId, description: a.description,
      metadata: { ...(a.metadata ?? {}), ip: ipHash(req), ua: String(req.headers["user-agent"] ?? "").slice(0, 160) } as Prisma.InputJsonValue,
    },
  });
}
