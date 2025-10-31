// backend/admin-service/src/controllers/supportController.ts

import { Request, Response } from 'express';
import { PrismaClient, TicketStatus, TicketPriority, TicketCategory } from '@newcondo/db';
import { successResponse, errorResponse } from '../../../shared/src/utils/response';
import { adminController } from './adminController';

const prisma = new PrismaClient();

export class SupportController {
  // Get all support tickets
  async getAllTickets(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        priority,
        category,
        search,
        sortBy = 'createdAt',
        order = 'desc'
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (priority) {
        where.priority = priority;
      }

      if (category) {
        where.category = category;
      }

      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      const [tickets, total] = await Promise.all([
        prisma.supportTicket.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { [sortBy as string]: order },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true
              }
            }
          }
        }),
        prisma.supportTicket.count({ where })
      ]);

      return successResponse(res, {
        tickets,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      }, 'Support tickets retrieved successfully');
    } catch (error) {
      console.error('Get all tickets error:', error);
      return errorResponse(res, 'Failed to retrieve support tickets', 500);
    }
  }

  // Get ticket details
  async getTicketDetails(req: Request, res: Response) {
    try {
      const { ticketId } = req.params;

      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              verificationStatus: true,
              createdAt: true
            }
          }
        }
      });

      if (!ticket) {
        return errorResponse(res, 'Ticket not found', 404);
      }

      return successResponse(res, ticket, 'Ticket details retrieved successfully');
    } catch (error) {
      console.error('Get ticket details error:', error);
      return errorResponse(res, 'Failed to retrieve ticket details', 500);
    }
  }

  // Assign ticket to admin
  async assignTicket(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { ticketId } = req.params;

      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId }
      });

      if (!ticket) {
        return errorResponse(res, 'Ticket not found', 404);
      }

      // Update ticket status to in progress
      const updatedTicket = await prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: 'IN_PROGRESS',
          resolvedBy: adminId
        }
      });

      // Log admin action
      await adminController.logAdminAction(
        adminId!,
        'TICKET_RESOLVED',
        'SupportTicket',
        ticketId,
        `Assigned ticket to self: ${ticket.title}`,
        {}
      );

      return successResponse(res, updatedTicket, 'Ticket assigned successfully');
    } catch (error) {
      console.error('Assign ticket error:', error);
      return errorResponse(res, 'Failed to assign ticket', 500);
    }
  }

  // Update ticket priority
  async updateTicketPriority(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { ticketId } = req.params;
      const { priority } = req.body;

      if (!['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority)) {
        return errorResponse(res, 'Invalid priority', 400);
      }

      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId }
      });

      if (!ticket) {
        return errorResponse(res, 'Ticket not found', 404);
      }

      const updatedTicket = await prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          priority: priority as TicketPriority
        }
      });

      // Log admin action
      await adminController.logAdminAction(
        adminId!,
        'TICKET_RESOLVED',
        'SupportTicket',
        ticketId,
        `Updated ticket priority from ${ticket.priority} to ${priority}`,
        { oldPriority: ticket.priority, newPriority: priority }
      );

      return successResponse(res, updatedTicket, 'Ticket priority updated successfully');
    } catch (error) {
      console.error('Update ticket priority error:', error);
      return errorResponse(res, 'Failed to update ticket priority', 500);
    }
  }

  // Respond to ticket
  async respondToTicket(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { ticketId } = req.params;
      const { response } = req.body;

      if (!response) {
        return errorResponse(res, 'Response is required', 400);
      }

      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!ticket) {
        return errorResponse(res, 'Ticket not found', 404);
      }

      // Update ticket with response
      const updatedTicket = await prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          adminResponse: response,
          status: 'IN_PROGRESS',
          resolvedBy: adminId
        }
      });

      // Log admin action
      await adminController.logAdminAction(
        adminId!,
        'TICKET_RESOLVED',
        'SupportTicket',
        ticketId,
        `Responded to ticket: ${ticket.title}`,
        { responseLength: response.length }
      );

      // TODO: Send email notification to user

      return successResponse(res, updatedTicket, 'Response sent successfully');
    } catch (error) {
      console.error('Respond to ticket error:', error);
      return errorResponse(res, 'Failed to respond to ticket', 500);
    }
  }

  // Resolve ticket
  async resolveTicket(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { ticketId } = req.params;
      const { response } = req.body;

      if (!response) {
        return errorResponse(res, 'Resolution response is required', 400);
      }

      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!ticket) {
        return errorResponse(res, 'Ticket not found', 404);
      }

      // Resolve ticket
      const updatedTicket = await prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: 'RESOLVED',
          adminResponse: response,
          resolvedBy: adminId,
          resolvedAt: new Date()
        }
      });

      // Log admin action
      await adminController.logAdminAction(
        adminId!,
        'TICKET_RESOLVED',
        'SupportTicket',
        ticketId,
        `Resolved ticket: ${ticket.title}`,
        {}
      );

      // TODO: Send resolution email to user

      return successResponse(res, updatedTicket, 'Ticket resolved successfully');
    } catch (error) {
      console.error('Resolve ticket error:', error);
      return errorResponse(res, 'Failed to resolve ticket', 500);
    }
  }

  // Close ticket
  async closeTicket(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { ticketId } = req.params;

      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId }
      });

      if (!ticket) {
        return errorResponse(res, 'Ticket not found', 404);
      }

      if (ticket.status !== 'RESOLVED') {
        return errorResponse(res, 'Only resolved tickets can be closed', 400);
      }

      // Close ticket
      const updatedTicket = await prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: 'CLOSED'
        }
      });

      // Log admin action
      await adminController.logAdminAction(
        adminId!,
        'TICKET_RESOLVED',
        'SupportTicket',
        ticketId,
        `Closed ticket: ${ticket.title}`,
        {}
      );

      return successResponse(res, updatedTicket, 'Ticket closed successfully');
    } catch (error) {
      console.error('Close ticket error:', error);
      return errorResponse(res, 'Failed to close ticket', 500);
    }
  }

  // Reopen ticket
  async reopenTicket(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { ticketId } = req.params;
      const { reason } = req.body;

      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId }
      });

      if (!ticket) {
        return errorResponse(res, 'Ticket not found', 404);
      }

      if (!['RESOLVED', 'CLOSED'].includes(ticket.status)) {
        return errorResponse(res, 'Only resolved or closed tickets can be reopened', 400);
      }

      // Reopen ticket
      const updatedTicket = await prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: 'OPEN',
          adminResponse: ticket.adminResponse 
            ? `${ticket.adminResponse}\n\n[REOPENED: ${reason || 'No reason provided'}]`
            : `[REOPENED: ${reason || 'No reason provided'}]`
        }
      });

      // Log admin action
      await adminController.logAdminAction(
        adminId!,
        'TICKET_RESOLVED',
        'SupportTicket',
        ticketId,
        `Reopened ticket: ${ticket.title}`,
        { reason }
      );

      return successResponse(res, updatedTicket, 'Ticket reopened successfully');
    } catch (error) {
      console.error('Reopen ticket error:', error);
      return errorResponse(res, 'Failed to reopen ticket', 500);
    }
  }

  // Get support statistics
  async getSupportStatistics(req: Request, res: Response) {
    try {
      const { period = '30d' } = req.query;

      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      const [
        statusBreakdown,
        priorityBreakdown,
        categoryBreakdown,
        resolutionRate,
        averageResolutionTime,
        ticketTrend
      ] = await Promise.all([
        prisma.supportTicket.groupBy({
          by: ['status'],
          _count: { status: true }
        }),
        prisma.supportTicket.groupBy({
          by: ['priority'],
          _count: { priority: true },
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }),
        prisma.supportTicket.groupBy({
          by: ['category'],
          _count: { category: true },
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }),
        prisma.supportTicket.count({
          where: {
            status: { in: ['RESOLVED', 'CLOSED'] },
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }).then(resolved =>
          prisma.supportTicket.count({
            where: {
              createdAt: {
                gte: startDate,
                lte: endDate
              }
            }
          }).then(total => ({
            resolved,
            total,
            rate: total > 0 ? (resolved / total) * 100 : 0
          }))
        ),
        prisma.supportTicket.findMany({
          where: {
            status: { in: ['RESOLVED', 'CLOSED'] },
            resolvedAt: { not: null },
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          },
          select: {
            createdAt: true,
            resolvedAt: true
          }
        }).then(tickets => {
          if (tickets.length === 0) return 0;
          const totalTime = tickets.reduce((sum, ticket) => {
            const time = ticket.resolvedAt!.getTime() - ticket.createdAt.getTime();
            return sum + time;
          }, 0);
          return totalTime / tickets.length / (1000 * 60 * 60); // Hours
        }),
        prisma.supportTicket.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          },
          select: {
            createdAt: true,
            status: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        })
      ]);

      return successResponse(res, {
        period,
        dateRange: { startDate, endDate },
        statistics: {
          statusBreakdown,
          priorityBreakdown,
          categoryBreakdown,
          resolutionRate,
          averageResolutionTime,
          ticketTrend
        }
      }, 'Support statistics retrieved successfully');
    } catch (error) {
      console.error('Get support statistics error:', error);
      return errorResponse(res, 'Failed to retrieve support statistics', 500);
    }
  }

  // Bulk update tickets
  async bulkUpdateTickets(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { ticketIds, action, data } = req.body;

      if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
        return errorResponse(res, 'Ticket IDs are required', 400);
      }

      if (!action) {
        return errorResponse(res, 'Action is required', 400);
      }

      let updateData: any = {};

      switch (action) {
        case 'assign':
          updateData = {
            status: 'IN_PROGRESS',
            resolvedBy: adminId
          };
          break;
        case 'resolve':
          if (!data?.response) {
            return errorResponse(res, 'Response is required for resolution', 400);
          }
          updateData = {
            status: 'RESOLVED',
            adminResponse: data.response,
            resolvedBy: adminId,
            resolvedAt: new Date()
          };
          break;
        case 'close':
          updateData = {
            status: 'CLOSED'
          };
          break;
        case 'update_priority':
          if (!data?.priority) {
            return errorResponse(res, 'Priority is required', 400);
          }
          updateData = {
            priority: data.priority
          };
          break;
        default:
          return errorResponse(res, 'Invalid action', 400);
      }

      // Update tickets
      await prisma.supportTicket.updateMany({
        where: {
          id: { in: ticketIds }
        },
        data: updateData
      });

      // Log admin action
      await adminController.logAdminAction(
        adminId!,
        'TICKET_RESOLVED',
        'SupportTicket',
        'bulk',
        `Bulk ${action} on ${ticketIds.length} tickets`,
        { ticketIds, action, data }
      );

      return successResponse(res, {
        updated: ticketIds.length
      }, `Bulk ${action} completed successfully`);
    } catch (error) {
      console.error('Bulk update tickets error:', error);
      return errorResponse(res, 'Failed to bulk update tickets', 500);
    }
  }
}

export const supportController = new SupportController();