// backend/marking-service/src/index.ts — barrel for combined-backend
export {
  MARKING_FEES, MARKER_PAYOUT, PAYOUT_HOLD, SLOT_HOURS, CONFIRM_HOURS,
  createMarkingJob, availableJobs, joinQueue, advanceExpiredSlots, abandonSlot,
  presignMarkingPhotos, completeMarking, confirmMarking, disputeMarking,
  ownerJobs, agentHistory,
} from "./services/markingJobService";
export type {
  MarkingMethod, MarkingJobDTO, AvailableJobDTO, PresignedPhoto, CompleteMarkingResult,
} from "./services/markingJobService";
export type { MarkingCheckout } from "./services/markingPayment.service";
export { segmentBuilding, extractGreenPolygon } from "./services/segmentationService";
export { initiateMarkingPayment, confirmMarkingFeePaid } from "./services/markingPayment.service";
