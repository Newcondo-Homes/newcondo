/**
 * Support Validation Schemas
 * Zod schemas for support ticket management operations
 */

import { z } from 'zod';

/**
 * Schema for responding to ticket
 */
export const respondToTicketSchema = z.object({
  ticketId: z.string().cuid('Invalid ticket ID format'),
  response: z.string().min(10, 'Response must be at least 10 characters').max(5000, 'Response must not exceed 5000 characters'),
  updateStatus: z.enum(['IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  internal: z.boolean().optional().default(false),
});

export type RespondToTicketInput = z.infer<typeof respondToTicketSchema>;

/**
 * Schema for updating ticket status
 */
export const updateTicketStatusSchema = z.object({
  ticketId: z.string().cuid('Invalid ticket ID format'),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  notes: z.string().max(1000, 'Notes must not exceed 1000 characters').optional(),
});

export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;

/**
 * Schema for updating ticket priority
 */
export const updateTicketPrioritySchema = z.object({
  ticketId: z.string().cuid('Invalid ticket ID format'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  reason: z.string().max(500, 'Reason must not exceed 500 characters').optional(),
});

export type UpdateTicketPriorityInput = z.infer<typeof updateTicketPrioritySchema>;

/**
 * Schema for assigning ticket
 */
export const assignTicketSchema = z.object({
  ticketId: z.string().cuid('Invalid ticket ID format'),
  assignedTo: z.string().cuid('Invalid admin ID format'),
  notes: z.string().max(500, 'Notes must not exceed 500 characters').optional(),
});

export type AssignTicketInput = z.infer<typeof assignTicketSchema>;

/**
 * Schema for adding internal note
 */
export const addInternalNoteSchema = z.object({
  ticketId: z.string().cuid('Invalid ticket ID format'),
  note: z.string().min(10, 'Note must be at least 10 characters').max(2000, 'Note must not exceed 2000 characters'),
});

export type AddInternalNoteInput = z.infer<typeof addInternalNoteSchema>;

/**
 * Schema for escalating ticket
 */
export const escalateTicketSchema = z.object({
  ticketId: z.string().cuid('Invalid ticket ID format'),
  reason: z.string().min(20, 'Reason must be at least 20 characters').max(1000, 'Reason must not exceed 1000 characters'),
  escalateTo: z.string().cuid('Invalid admin ID format').optional(),
});

export type EscalateTicketInput = z.infer<typeof escalateTicketSchema>;

/**
 * Schema for merging tickets
 */
export const mergeTicketsSchema = z.object({
  primaryTicketId: z.string().cuid('Invalid primary ticket ID format'),
  duplicateTicketIds: z.array(z.string().cuid()).min(1, 'At least one duplicate ticket must be provided').max(10, 'Cannot merge more than 10 tickets at once'),
}).refine((data) => !data.duplicateTicketIds.includes(data.primaryTicketId), {
  message: 'Cannot merge a ticket with itself',
  path: ['duplicateTicketIds'],
});

export type MergeTicketsInput = z.infer<typeof mergeTicketsSchema>;

/**
 * Schema for bulk updating ticket status
 */
export const bulkUpdateStatusSchema = z.object({
  ticketIds: z.array(z.string().cuid()).min(1, 'At least one ticket ID must be provided').max(50, 'Cannot update more than 50 tickets at once'),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  notes: z.string().max(1000, 'Notes must not exceed 1000 characters').optional(),
});

export type BulkUpdateStatusInput = z.infer<typeof bulkUpdateStatusSchema>;

/**
 * Schema for sending feedback request
 */
export const sendFeedbackRequestSchema = z.object({
  ticketId: z.string().cuid('Invalid ticket ID format'),
  message: z.string().max(1000, 'Message must not exceed 1000 characters').optional(),
});

export type SendFeedbackRequestInput = z.infer<typeof sendFeedbackRequestSchema>;

/**
 * Schema for support ticket filters
 */
export const supportFiltersSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  category: z.enum(['TECHNICAL', 'BILLING', 'PROPERTY', 'VERIFICATION', 'GENERAL']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  userId: z.string().cuid().optional(),
  assignedTo: z.string().cuid().optional(),
  search: z.string().max(100).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'priority', 'status', 'responseTime']).optional(),
});

export type SupportFiltersInput = z.infer<typeof supportFiltersSchema>;

/**
 * Schema for exporting tickets
 */
export const exportTicketsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  category: z.enum(['TECHNICAL', 'BILLING', 'PROPERTY', 'VERIFICATION', 'GENERAL']).optional(),
  format: z.enum(['csv', 'xlsx', 'pdf']).default('csv'),
});

export type ExportTicketsInput = z.infer<typeof exportTicketsSchema>;

/**
 * Validation helper functions
 */
export const validateRespondToTicket = (data: unknown) => {
  return respondToTicketSchema.parse(data);
};

export const validateUpdateTicketStatus = (data: unknown) => {
  return updateTicketStatusSchema.parse(data);
};

export const validateUpdateTicketPriority = (data: unknown) => {
  return updateTicketPrioritySchema.parse(data);
};

export const validateAssignTicket = (data: unknown) => {
  return assignTicketSchema.parse(data);
};

export const validateAddInternalNote = (data: unknown) => {
  return addInternalNoteSchema.parse(data);
};

export const validateEscalateTicket = (data: unknown) => {
  return escalateTicketSchema.parse(data);
};

export const validateMergeTickets = (data: unknown) => {
  return mergeTicketsSchema.parse(data);
};

export const validateBulkUpdateStatus = (data: unknown) => {
  return bulkUpdateStatusSchema.parse(data);
};

export const validateSendFeedbackRequest = (data: unknown) => {
  return sendFeedbackRequestSchema.parse(data);
};

export const validateSupportFilters = (data: unknown) => {
  return supportFiltersSchema.parse(data);
};

export const validateExportTickets = (data: unknown) => {
  return exportTicketsSchema.parse(data);
};