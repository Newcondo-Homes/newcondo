/* ============================================================
   Service visits — owner / listing agent / tenant side of the vendor network.
   All calls → combined-backend /api/v1/services/* → @newcondo/vendor-service
   (routes/index.ts "visits" router). Role checks are server-side: only the
   property's owner, its listing agent or an ACTIVE tenant can see visits or
   create a code, and only on the visit day.
   ============================================================ */
import apiClient from "@/lib/api/client";

export interface ServiceVisit {
  jobId: string; propertyId: string; property: string; service: "FUMIGATION" | "WASTE_MANAGEMENT" | "INSPECTION"; status: string;
  scheduledFor: string | null; windowEnd: string | null; vendor: string | null; canGenerateCode: boolean; codeActive: boolean;
}
export interface VisitCode { code: string; qr: string; expiresAt: string; qrOptions: { errorCorrectionLevel: "L"; scale: number; margin: number } }
export interface VisitPhoto { key: string; url: string; expiresAt: string }
export interface ServiceWindow { days: number[]; startMinute: number; endMinute: number }

const unwrap = <T,>(res: { data?: T }) => { if (res.data === undefined) throw new Error("Empty response"); return res.data; };

export const getServiceVisits = () => apiClient.get<ServiceVisit[]>("/services/visits").then(unwrap);
/** Voids any earlier code for the visit — read the new one to the provider. */
export const createVisitCode = (jobId: string) => apiClient.post<VisitCode>(`/services/visits/${jobId}/code`).then(unwrap);
export const getServiceWindow = (propertyId: string) => apiClient.get<ServiceWindow>(`/services/properties/${propertyId}/window`).then(unwrap);
/** Rebooks unfrozen visits inside the new window and tells the vendor. */
export const setServiceWindow = (propertyId: string, w: ServiceWindow) => apiClient.put<{ window: ServiceWindow }>(`/services/properties/${propertyId}/window`, w).then(unwrap);
/** Private report photos → 10-minute presigned URLs (access-checked server-side). */
export const getVisitPhotos = (jobId: string) => apiClient.get<VisitPhoto[]>(`/services/visits/${jobId}/photos`).then(unwrap);
