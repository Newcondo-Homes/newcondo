// backend/vendor-service/src/services/vendorAccountService.ts
// ============================================================
// Vendor accounts. A vendor is a User with role VENDOR plus one Vendor row
// (company or individual). New vendors are PENDING — they can sign in, set up
// areas and bank, but are matched and paid only after an admin verifies them.
// Bank changes need the current password (account-takeover guard) and are
// name-checked with Flutterwave before they're saved.
// ============================================================
import axios from "axios";
import bcrypt from "bcryptjs";
import { prisma } from "@newcondo/db";
import {
  VENDORS, providerServices, flutterwaveConfig, sendBrandedEmail, VendorEmailTemplates, publishNotification,
  badRequest, conflict, forbidden, notFound, badGateway, type VendorProviderType, type VendorServiceType, type VendorReleaseMode,
} from "@newcondo/backend-shared";
import type { VendorProfileDTO } from "../types";
import { haversineKm, parseLatLng } from "../utils/geo";

const FLW_BASE = flutterwaveConfig.FLUTTERWAVE_BASE_URL || "https://api.flutterwave.com/v3";
const mask = (n: string | null) => (n ? `••${n.slice(-4)}` : null);

export interface RegisterVendorInput {
  businessName: string; providerType: VendorProviderType; extraServices?: VendorServiceType[];
  contactName: string; email: string; phone: string; password: string; cacNumber?: string;
}

export async function registerVendor(i: RegisterVendorInput): Promise<{ userId: string; vendorId: string }> {
  const email = i.email.trim().toLowerCase();
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) throw conflict("An account with this email already exists");
  const spec = VENDORS.providerTypes[i.providerType];
  const primary = spec.services[0];
  const extra = (i.extraServices ?? []).filter((s) => VENDORS.addableServices[primary].includes(s));
  const passwordHash = await bcrypt.hash(i.password, 12);
  const { user, vendor } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { email, name: i.contactName.trim(), phone: i.phone, passwordHash, role: "VENDOR", companyName: spec.kind === "COMPANY" ? i.businessName.trim() : null } });
    const vendor = await tx.vendor.create({
      data: { userId: user.id, name: i.businessName.trim(), kind: spec.kind, providerType: i.providerType, category: primary, services: [primary, ...extra],
        contactName: i.contactName.trim(), email, phone: i.phone, cacNumber: i.cacNumber ?? null,
        capacityPerDay: VENDORS.services[primary].defaultDailyCapacity, maxClients: VENDORS.services[primary].defaultMaxClients, releaseMode: VENDORS.payout.defaultReleaseMode },
    });
    return { user, vendor };
  });
  void sendBrandedEmail(email, VendorEmailTemplates.welcome({ name: i.contactName.split(" ")[0] }));
  return { userId: user.id, vendorId: vendor.id };
}

export async function getVendorProfile(vendorId: string): Promise<VendorProfileDTO> {
  const v = await prisma.vendor.findUnique({ where: { id: vendorId }, include: { areas: { orderBy: { createdAt: "asc" } } } });
  if (!v) throw notFound("Vendor not found");
  const clients = await prisma.vendorAssignment.findMany({ where: { vendorId, status: { in: ["ACTIVE", "PAUSED"] } }, distinct: ["propertyId"], select: { property: { select: { gpsCoordinates: true } } } });
  const locs = clients.map((c) => parseLatLng(c.property.gpsCoordinates)).filter((x): x is NonNullable<typeof x> => !!x);
  return {
    id: v.id, name: v.name, kind: v.kind, providerType: v.providerType, services: v.services, contactName: v.contactName, email: v.email, phone: v.phone,
    status: v.status, rating: v.rating, capacityPerDay: v.capacityPerDay, maxClients: v.maxClients, releaseMode: v.releaseMode as VendorReleaseMode,
    bank: { bankName: v.bankName, accountNumberMasked: mask(v.accountNumber), accountName: v.accountName, verified: !!v.bankVerifiedAt },
    areas: v.areas.map((a) => ({ id: a.id, state: a.state, lga: a.lga, area: a.area, radiusKm: a.radiusKm, clients: locs.filter((l) => haversineKm(l, a) <= a.radiusKm).length })),
  };
}

export async function updateVendorProfile(vendorId: string, p: { name?: string; contactName?: string; phone?: string; capacityPerDay?: number; extraServices?: VendorServiceType[] }) {
  const v = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { providerType: true } });
  if (!v) throw notFound("Vendor not found");
  const primary = providerServices(v.providerType as VendorProviderType)[0];
  await prisma.vendor.update({
    where: { id: vendorId },
    data: {
      ...(p.name ? { name: p.name.trim() } : {}), ...(p.contactName ? { contactName: p.contactName.trim() } : {}), ...(p.phone ? { phone: p.phone } : {}),
      ...(p.capacityPerDay ? { capacityPerDay: Math.max(1, Math.min(30, Math.round(p.capacityPerDay))) } : {}),
      ...(p.extraServices ? { services: [primary, ...p.extraServices.filter((s) => VENDORS.addableServices[primary].includes(s))] } : {}),
    },
  });
  return getVendorProfile(vendorId);
}

export async function addServiceArea(vendorId: string, a: { state: string; lga: string; area: string; lat: number; lng: number; radiusKm: number }) {
  // TODO(geo): reject areas outside ACTIVE_AREAS once its shape is exported for this check.
  const radiusKm = Math.max(1, Math.min(VENDORS.matching.maxRadiusKm, a.radiusKm || VENDORS.matching.defaultRadiusKm));
  if (await prisma.vendorServiceArea.count({ where: { vendorId } }) >= 10) throw badRequest("You can add up to 10 service areas");
  await prisma.vendorServiceArea.create({ data: { vendorId, state: a.state, lga: a.lga, area: a.area.trim(), lat: a.lat, lng: a.lng, radiusKm } });
  return getVendorProfile(vendorId);
}

export async function removeServiceArea(vendorId: string, areaId: string) {
  const a = await prisma.vendorServiceArea.findUnique({ where: { id: areaId }, select: { vendorId: true } });
  if (!a || a.vendorId !== vendorId) throw notFound("Area not found");
  // Existing clients keep their vendor; only NEW matches stop coming from here.
  await prisma.vendorServiceArea.delete({ where: { id: areaId } });
  return getVendorProfile(vendorId);
}

export async function setVendorBank(vendorId: string, userId: string, b: { bankCode: string; bankName: string; accountNumber: string; currentPassword: string }) {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!u?.passwordHash || !(await bcrypt.compare(b.currentPassword, u.passwordHash))) throw forbidden("Your password is incorrect");
  let accountName: string;
  try {
    const r = await axios.post(`${FLW_BASE}/accounts/resolve`, { account_number: b.accountNumber, account_bank: b.bankCode }, { headers: { Authorization: `Bearer ${flutterwaveConfig.FLUTTERWAVE_SECRET_KEY}` }, timeout: 15_000 });
    accountName = r.data?.data?.account_name;
    if (r.data?.status !== "success" || !accountName) throw new Error(r.data?.message ?? "not resolved");
  } catch (e) {
    throw badGateway(`We couldn't verify that account: ${(e as Error).message}`);
  }
  await prisma.vendor.update({ where: { id: vendorId }, data: { bankCode: b.bankCode, bankName: b.bankName, accountNumber: b.accountNumber, accountName, bankVerifiedAt: new Date() } });
  await publishNotification({ userId, kind: "wallet", title: "Payout account changed", body: `${b.bankName} ${mask(b.accountNumber)} · ${accountName}. Not you? Contact support now.`, to: "/settings" });
  return getVendorProfile(vendorId);
}

export async function setReleaseMode(vendorId: string, mode: VendorReleaseMode) {
  await prisma.vendor.update({ where: { id: vendorId }, data: { releaseMode: mode } });
  return getVendorProfile(vendorId);
}

/** Admin: approve documents + bank. Called from admin-service. */
export async function verifyVendor(vendorId: string) {
  const v = await prisma.vendor.update({ where: { id: vendorId }, data: { status: "VERIFIED", verifiedAt: new Date() }, select: { email: true, contactName: true, name: true, userId: true } });
  if (v.email) void sendBrandedEmail(v.email, VendorEmailTemplates.verified({ name: v.contactName ?? v.name }));
  if (v.userId) await publishNotification({ userId: v.userId, kind: "verify", title: "You're verified", body: "You'll now be matched with subscribed properties in your areas.", to: "/dashboard" });
}
