// backend/vendor-service/src/middleware/validate.ts
// zod body/query validation — rejects unknown keys so nothing unexpected
// (e.g. vendorId, status) can be smuggled into a service call.
import type { Request, Response, NextFunction } from "express";
import type { ZodTypeAny } from "zod";

export const validate = (schema: ZodTypeAny, where: "body" | "query" = "body") =>
  (req: Request, res: Response, next: NextFunction): void => {
    const r = schema.safeParse(req[where]);
    if (!r.success) {
      res.status(400).json({ success: false, message: "Validation failed", errors: r.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) });
      return;
    }
    (req as unknown as Record<string, unknown>)[where === "body" ? "body" : "validQuery"] = r.data;
    next();
  };
