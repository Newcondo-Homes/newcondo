// backend/vendor-service/src/controllers/serviceVisitController.ts
// Platform-side (owner / listing agent / tenant) handlers: visit list, visit
// code, availability window. Role checks live in the services.
import { send, type Handler } from "./http";
import { generateVisitCode } from "../services/visitCodeService";
import { listVisitsFor, setServiceWindow, windowFor } from "../services/schedulingService";
import { handleVoiceCallback } from "../services/reminderService";
import { hasPropertyAccess } from "../services/serviceability";
import { visitPhotos } from "../services/visitPhotoService";
import { forbidden } from "@newcondo/backend-shared";

export const myVisits: Handler = send((req) => listVisitsFor(req.user!.id));
export const createVisitCode: Handler = send((req) => generateVisitCode(String(req.params.jobId), req.user!.id), 201);
export const getVisitPhotos: Handler = send((req) => visitPhotos(String(req.params.jobId), { id: req.user!.id, role: req.user!.role }));
export const getWindow: Handler = send(async (req) => {
  const propertyId = String(req.params.propertyId);
  if (!(await hasPropertyAccess(propertyId, req.user!.id))) throw forbidden("Not your property");
  return windowFor(propertyId);
});
export const putWindow: Handler = send((req) => setServiceWindow(String(req.params.propertyId), req.user!.id, req.body));

/** PUBLIC — Africa's Talking voice callback. Responds with XML. */
export const voiceCallback: Handler = async (req, res) => {
  const xml = await handleVoiceCallback(req.body ?? {}).catch(() => '<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  res.type("application/xml").send(xml);
};
