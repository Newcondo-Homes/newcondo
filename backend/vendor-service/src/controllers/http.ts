// backend/vendor-service/src/controllers/http.ts
// Shared handler type + JSON envelope for every controller.
//
// Why not `RequestHandler`? Its defaults are RequestHandler<ParamsDictionary,
// any, any, ParsedQs>. With `declaration: true`, TS has to spell those inner
// types out in the .d.ts, and they live in transitive packages
// (@types/express-serve-static-core, @types/qs) that pnpm doesn't hoist →
// TS2883 "inferred type cannot be named". `Handler` only references
// Request/Response/NextFunction from "express" itself, which vendor-service
// depends on directly, so the emitted types stay portable.
import type { Request, Response, NextFunction } from "express";

export type Handler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

/** Wrap a service call: 200/201 `{ success, data }` on success, errors to the error middleware. */
export const send = (fn: (req: Request, res: Response) => Promise<unknown>, status = 200): Handler =>
  async (req, res, next) => {
    try { res.status(status).json({ success: true, data: await fn(req, res) }); } catch (e) { next(e); }
  };
