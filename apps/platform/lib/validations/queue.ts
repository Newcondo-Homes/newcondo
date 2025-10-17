// apps/platform/lib/validations/queue.ts
import { z } from "zod";

// Join marking job queue
export const joinQueueSchema = z.object({
  markingJobId: z.string().cuid("Invalid marking job ID"),
  agentId: z.string().cuid("Invalid agent ID"),
  availableFrom: z
    .string()
    .datetime()
    .describe("When agent can start marking"),
  serviceAreas: z
    .array(z.string())
    .min(1, "At least one service area required")
    .describe("Cities/areas where agent operates"),
});

// Accept queue position (agent confirms they'll do the marking)
export const acceptQueuePositionSchema = z.object({
  markingJobId: z.string().cuid("Invalid marking job ID"),
  agentId: z.string().cuid("Invalid agent ID"),
  acceptedAt: z
    .string()
    .datetime()
    .describe("When agent accepted the position"),
});

// Complete marking within 3-hour window
export const completeQueueTaskSchema = z.object({
  markingJobId: z.string().cuid("Invalid marking job ID"),
  agentId: z.string().cuid("Invalid agent ID"),
  completionTime: z
    .string()
    .datetime()
    .describe("When the marking was completed"),
  boundaryData: z
    .object({
      coordinates: z
        .array(
          z.object({
            lat: z.number().min(-90).max(90),
            lng: z.number().min(-180).max(180),
          })
        )
        .min(3, "Boundary must have at least 3 points"),
      area: z.number().positive().optional(),
      markedAt: z.string().datetime(),
    })
    .describe("Property boundary marked by agent"),
  photosUrls: z
    .array(z.string().url())
    .min(3, "Minimum 3 photos required")
    .max(15, "Maximum 15 photos allowed"),
  accessNotes: z
    .string()
    .max(300, "Notes must not exceed 300 characters")
    .optional(),
});

// Abandon queue position (agent can't make it)
export const abandonQueueSchema = z.object({
  markingJobId: z.string().cuid("Invalid marking job ID"),
  agentId: z.string().cuid("Invalid agent ID"),
  abandonmentReason: z
    .string()
    .min(5, "Reason must be at least 5 characters")
    .max(200, "Reason must not exceed 200 characters"),
  abandonedAt: z
    .string()
    .datetime()
    .describe("When agent abandoned the position"),
});

// Skip to next agent in queue
export const skipToNextAgentSchema = z.object({
  markingJobId: z.string().cuid("Invalid marking job ID"),
  currentAgentId: z.string().cuid("Invalid current agent ID"),
  skipReason: z
    .enum([
      "TIMEOUT_EXPIRED",
      "ABANDONED",
      "UNREACHABLE",
      "QUALITY_ISSUE",
      "AGENT_REQUESTED",
    ])
    .describe("Reason for skipping to next agent"),
  skippedAt: z
    .string()
    .datetime(),
});

// Get queue position and details
export const getQueuePositionSchema = z.object({
  markingJobId: z.string().cuid("Invalid marking job ID"),
  agentId: z.string().cuid("Invalid agent ID").optional(),
});

// Get queue status for a marking job
export const getQueueStatusSchema = z.object({
  markingJobId: z.string().cuid("Invalid marking job ID"),
});

// Update agent availability
export const updateAgentAvailabilitySchema = z.object({
  agentId: z.string().cuid("Invalid agent ID"),
  isAvailable: z.boolean().describe("Mark agent as available/unavailable"),
  availableUntil: z
    .string()
    .datetime()
    .optional(),
  serviceAreas: z
    .array(z.string())
    .min(1, "At least one service area required")
    .optional(),
});

// Mark time slot as completed
export const completeTimeSlotSchema = z.object({
  markingJobId: z.string().cuid("Invalid marking job ID"),
  agentId: z.string().cuid("Invalid agent ID"),
  timeSlotIndex: z
    .number()
    .int()
    .min(0)
    .describe("Which 3-hour time slot"),
  completedSuccessfully: z
    .boolean()
    .describe("Was the marking completed successfully"),
  compensationAmount: z
    .number()
    .positive()
    .describe("Compensation for this time slot"),
});

// Request time extension
export const requestTimeExtensionSchema = z.object({
  markingJobId: z.string().cuid("Invalid marking job ID"),
  agentId: z.string().cuid("Invalid agent ID"),
  extensionHours: z
    .number()
    .int()
    .min(1)
    .max(24)
    .describe("Number of hours to extend"),
  reason: z
    .string()
    .min(10, "Reason must be at least 10 characters")
    .max(200),
});

// Notify agent of new marking opportunity
export const agentNotificationSchema = z.object({
  agentId: z.string().cuid("Invalid agent ID"),
  markingJobId: z.string().cuid("Invalid marking job ID"),
  propertyLocation: z.object({
    state: z.string(),
    lga: z.string(),
    city: z.string(),
    address: z.string(),
  }),
  distance: z
    .number()
    .positive()
    .describe("Distance in kilometers from agent"),
  fee: z
    .number()
    .positive()
    .describe("Marking job fee"),
  urgency: z
    .enum(["LOW", "NORMAL", "HIGH", "URGENT"])
    .default("NORMAL"),
  queuePosition: z
    .number()
    .int()
    .positive()
    .describe("Agent's position in queue"),
  timeWindowExpiry: z
    .string()
    .datetime()
    .describe("When 3-hour window expires"),
});

export type JoinQueueInput = z.infer<typeof joinQueueSchema>;
export type AcceptQueuePositionInput = z.infer<
  typeof acceptQueuePositionSchema
>;
export type CompleteQueueTaskInput = z.infer<typeof completeQueueTaskSchema>;
export type AbandonQueueInput = z.infer<typeof abandonQueueSchema>;
export type SkipToNextAgentInput = z.infer<typeof skipToNextAgentSchema>;
export type GetQueuePositionInput = z.infer<typeof getQueuePositionSchema>;
export type GetQueueStatusInput = z.infer<typeof getQueueStatusSchema>;
export type UpdateAgentAvailabilityInput = z.infer<
  typeof updateAgentAvailabilitySchema
>;
export type CompleteTimeSlotInput = z.infer<typeof completeTimeSlotSchema>;
export type RequestTimeExtensionInput = z.infer<
  typeof requestTimeExtensionSchema
>;
export type AgentNotificationInput = z.infer<typeof agentNotificationSchema>;