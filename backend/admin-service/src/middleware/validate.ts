// backend/admin-service/src/middleware/validate.ts
// zod validation with strict objects — unknown keys (e.g. "role": "SUPER_ADMIN") are rejected.
import type { Request, Response, NextFunction } from "express";
import type { ZodTypeAny } from "zod";

export const validate = (schema: ZodTypeAny, where: "body" | "query" = "body") =>
  (req: Request, res: Response, next: NextFunction): void => {
    const r = schema.safeParse(req[where]);
    if (!r.success) {
      res.status(400).json({ success: false, message: "Validation failed", errors: r.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) });
      return;
    }
    if (where === "body") req.body = r.data; else req.validQuery = r.data;
    next();
  };
