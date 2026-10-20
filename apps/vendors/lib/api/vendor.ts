// apps/vendors/lib/api/vendor.ts
// Every call the vendors app makes. All go to combined-backend →
// @newcondo/vendor-service (routes/index.ts → controllers/vendorController.ts).
// Payout on verify is injected by combined-backend/src/routes/vendors.ts.
import api, { unwrap } from "./client";
import type { VendorProfileDTO, VendorJobDTO, VendorClientDTO, VendorOverviewDTO } from "@/lib/types";

export const registerVendor = (b: Record<string, unknown>) => api.post("/vendors/register", b).then(unwrap<{ userId: string; vendorId: string }>);

export const getMe = () => api.get("/vendors/me").then(unwrap<VendorProfileDTO>);
export const updateMe = (b: Partial<{ name: string; contactName: string; phone: string; capacityPerDay: number; extraServices: string[] }>) => api.patch("/vendors/me", b).then(unwrap<VendorProfileDTO>);
export const addArea = (b: { state: string; lga: string; area: string; lat: number; lng: number; radiusKm: number }) => api.post("/vendors/me/areas", b).then(unwrap<VendorProfileDTO>);
export const removeArea = (id: string) => api.delete(`/vendors/me/areas/${id}`).then(unwrap<VendorProfileDTO>);
export const setBank = (b: { bankCode: string; bankName: string; accountNumber: string; currentPassword: string }) => api.put("/vendors/me/bank", b).then(unwrap<VendorProfileDTO>);
export const setReleaseMode = (mode: "INSTANT" | "END_OF_DAY") => api.put("/vendors/me/release-mode", { mode }).then(unwrap<VendorProfileDTO>);

export const getOverview = () => api.get("/vendors/me/overview").then(unwrap<VendorOverviewDTO>);
export const getJobs = (tab: string, page = 1) => api.get(`/vendors/me/jobs?tab=${tab}&page=${page}`).then(unwrap<{ jobs: VendorJobDTO[]; page: number; hasMore: boolean }>);
export const getJob = (id: string) => api.get(`/vendors/me/jobs/${id}`).then(unwrap<VendorJobDTO>);
export const getClients = () => api.get("/vendors/me/clients").then(unwrap<VendorClientDTO[]>);
export const getPayouts = (page = 1) => api.get(`/vendors/me/payouts?page=${page}`).then(unwrap<{ jobs: VendorJobDTO[]; hasMore: boolean; batches: { reference: string; amountKobo: string; jobCount: number; status: string; createdAt: string }[] }>);
export const rescheduleJob = (id: string, reason: string) => api.post(`/vendors/me/jobs/${id}/reschedule`, { reason }).then(unwrap);

/** S3 photo upload: presign → PUT straight to S3 → attach keys. Bytes never touch our servers. */
export async function uploadJobPhotos(jobId: string, files: File[]): Promise<number> {
  const signed = await api.post(`/vendors/me/jobs/${jobId}/photos/presign`, { files: files.map((f) => ({ contentType: f.type, size: f.size })) }).then(unwrap<{ key: string; uploadUrl: string }[]>);
  await Promise.all(signed.map((s, i) => fetch(s.uploadUrl, { method: "PUT", body: files[i], headers: { "Content-Type": files[i].type } }).then((r) => { if (!r.ok) throw new Error("Upload failed — check your connection and retry"); })));
  const { photoCount } = await api.post(`/vendors/me/jobs/${jobId}/photos`, { keys: signed.map((s) => s.key) }).then(unwrap<{ photoCount: number }>);
  return photoCount;
}

export const verifyVisit = (jobId: string, code: string) => api.post(`/vendors/me/jobs/${jobId}/verify`, { code }).then(unwrap<{ jobId: string; payout: "PROCESSING" | "BATCHED" | "RETRYING"; receiveNaira?: number }>);
