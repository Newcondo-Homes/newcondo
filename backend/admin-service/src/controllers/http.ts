// backend/admin-service/src/controllers/http.ts — handler type + JSON envelope.
// BigInt (ledger kobo) and Decimal are serialised safely: BigInt → string.
import type { Request, Response, NextFunction } from "express";

export type Handler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

const safe = (v: unknown) => JSON.parse(JSON.stringify(v, (_k, x) => (typeof x === "bigint" ? x.toString() : x)));

export const send = (fn: (req: Request, res: Response) => Promise<unknown>, status = 200): Handler =>
  async (req, res, next) => {
    try {
      const data = await fn(req, res);
      res.status(status).json({ success: true, data: data === undefined ? null : safe(data) });
    } catch (e) { next(e); }
  };

export const q = <T>(req: Request) => req.validQuery as T;
