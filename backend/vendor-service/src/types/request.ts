// backend/vendor-service/src/types/request.ts
// Express augmentation — kept out of types/index.ts so the vendors app can
// import the DTOs without pulling in Express types.
export {};

declare global {
  namespace Express {
    interface Request {
      /** Set by requireVendor — the caller's Vendor row. */
      vendor?: { id: string; name: string; status: string; releaseMode: string; services: string[] };
    }
  }
}
