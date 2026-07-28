// backend/property-service/src/services/publicBrowseService.ts
// ============================================================
// Public browse/search grid — ALIGNED TO schema.prisma:
//   isMarked        → Property.boundaryVerified
//   location fields → address / city / state
//   flats           → units (PropertyUnit, unitNumber + UnitStatus)
//   cover image     → PropertyImage.url (isPrimary first) — URLs are already
//                     CloudFront/presigned per your Document/Image pattern,
//                     so no extra S3 presigning here.
// Only PUBLISHED + boundaryVerified + admin-APPROVED properties are ever
// returned. Redis-cached 60s per filter combo.
// The service maps DB rows → the UI DTO the dashboard already consumes
// (label/status VACANT|OCCUPIED|UNDER_CONSTRUCTION), so the frontend
// stays unchanged.
// ============================================================
import { prisma } from "@newcondo/db";
import { redis } from "@newcondo/backend-shared";

export interface BrowseFilters {
  q?: string; state?: string; city?: string;
  minPrice?: number; maxPrice?: number; type?: string;
  page?: number; pageSize?: number;
}

/** UnitStatus (DB) → UI flat status */
const UNIT_UI: Record<string, string> = { AVAILABLE: "VACANT", OCCUPIED: "OCCUPIED", RESERVED: "OCCUPIED", MAINTENANCE: "UNDER_CONSTRUCTION", UNDER_CONSTRUCTION: "UNDER_CONSTRUCTION" };

export async function browseProperties(f: BrowseFilters) {
  const page = Math.max(1, f.page ?? 1);
  const pageSize = Math.min(48, f.pageSize ?? 24);
  const cacheKey = `browse:${JSON.stringify({ ...f, page, pageSize })}`;
  const cached = await redis.get(cacheKey).catch(() => null);
  if (cached) return JSON.parse(cached);

  const where = {
    status: "PUBLISHED" as const,
    boundaryVerified: true,
    adminApprovalStatus: "APPROVED" as const,
    ...(f.state && { state: f.state }),
    ...(f.city && { city: f.city }),
    ...(f.type && { propertyType: f.type as never }),
    ...(f.minPrice != null || f.maxPrice != null
      ? { price: { ...(f.minPrice != null && { gte: f.minPrice }), ...(f.maxPrice != null && { lte: f.maxPrice }) } }
      : {}),
    ...(f.q && { OR: [{ title: { contains: f.q, mode: "insensitive" as const } }, { city: { contains: f.q, mode: "insensitive" as const } }, { address: { contains: f.q, mode: "insensitive" as const } }] }),
  };

  const [total, items] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      orderBy: { approvedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, title: true, address: true, city: true, state: true, price: true,
        propertyType: true, structure: true, boundaryVerified: true,
        images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }], take: 1, select: { url: true } },
        agent: { select: { name: true } },
        units: { select: { unitNumber: true, status: true } },
      },
    }),
  ]);

  const result = {
    total, page, pageSize,
    items: items.map((p) => {
      // SINGLE_UNIT properties have no PropertyUnit rows — synthesize one from isAvailable
      const units = p.units.length ? p.units : [{ unitNumber: "Main unit", status: "AVAILABLE" }];
      const flats = units.map((u) => ({ label: u.unitNumber, status: UNIT_UI[u.status] ?? "OCCUPIED" }));
      return {
        id: p.id, title: p.title, area: p.city, state: p.state,
        price: Number(p.price ?? 0), propertyType: p.propertyType,
        coverUrl: p.images[0]?.url ?? null,
        isMarked: p.boundaryVerified,
        listingAgent: p.agent ? { name: p.agent.name } : null,
        flats,
        vacantFlats: flats.filter((fl) => fl.status === "VACANT").length,
      };
    }),
  };
  await redis.setex(cacheKey, 60, JSON.stringify(result)).catch(() => {});
  return result;
}
