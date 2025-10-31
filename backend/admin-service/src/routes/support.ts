import { Router } from 'express';
import { supportController } from '../controllers/supportController';
import { authenticateAdmin } from '../middleware/adminAuth';
import { validateRequest } from '../middleware/adminValidation';
import {
  ticketListSchema,
  respondToTicketSchema,
  updateTicketSchema,
  assignTicketSchema,
} from '../validations/supportSchemas';

const router = Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

/**
 * GET /api/admin/support
 * Get all support tickets with filters
 */
router.get(
  '/',
  validateRequest(ticketListSchema, 'query'),
  supportController.getTickets
);

/**
 * GET /api/admin/support/open
 * Get open support tickets
 */
router.get('/open', supportController.getOpenTickets);

/**
 * GET /api/admin/support/urgent
 * Get urgent priority tickets
 */
router.get('/urgent', supportController.getUrgentTickets);

/**
 * GET /api/admin/support/:ticketId
 * Get detailed ticket information
 */
router.get('/:ticketId', supportController.getTicketDetails);

/**
 * POST /api/admin/support/:ticketId/respond
 * Respond to a support ticket
 */
router.post(
  '/:ticketId/respond',
  validateRequest(respondToTicketSchema, 'body'),
  supportController.respondToTicket
);

/**
 * PUT /api/admin/support/:ticketId/status
 * Update ticket status
 */
router.put(
  '/:ticketId/status',
  validateRequest(updateTicketSchema, 'body'),
  supportController.updateTicketStatus
);

/**
 * POST /api/admin/support/:ticketId/assign
 * Assign ticket to an admin
 */
router.post(
  '/:ticketId/assign',
  validateRequest(assignTicketSchema, 'body'),
  supportController.assignTicket
);

/**
 * POST /api/admin/support/:ticketId/resolve
 * Mark ticket as resolved
 */
router.post('/:ticketId/resolve', supportController.resolveTicket);

/**
 * POST /api/admin/support/:ticketId/close
 * Close a ticket
 */
router.post('/:ticketId/close', supportController.closeTicket);

/**
 * POST /api/admin/support/:ticketId/reopen
 * Reopen a closed ticket
 */
router.post('/:ticketId/reopen', supportController.reopenTicket);

/**
 * PUT /api/admin/support/:ticketId/priority
 * Update ticket priority
 */
router.put('/:ticketId/priority', supportController.updateTicketPriority);

/**
 * PUT /api/admin/support/:ticketId/category
 * Update ticket category
 */
router.put('/:ticketId/category', supportController.updateTicketCategory);

/**
 * GET /api/admin/support/stats
 * Get support ticket statistics
 */
router.get('/stats', supportController.getTicketStats);

/**
 * GET /api/admin/support/:ticketId/history
 * Get ticket activity history
 */
router.get('/:ticketId/history', supportController.getTicketHistory);

/**
 * GET /api/admin/support/my-tickets
 * Get tickets assigned to current admin
 */
router.get('/my-tickets', supportController.getMyTickets);

/**
 * POST /api/admin/support/:ticketId/escalate
 * Escalate ticket to higher priority
 */
router.post('/:ticketId/escalate', supportController.escalateTicket);

export default router;