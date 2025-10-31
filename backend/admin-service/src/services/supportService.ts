// backend/admin-service/src/services/supportService.ts

import { PrismaClient, TicketStatus, TicketCategory, TicketPriority, AdminActionType } from '@newcondo/db';
import { adminService } from './adminService';
import { notificationService } from './notificationService';

const prisma = new PrismaClient();

interface TicketFilters {
  status?: TicketStatus;
  category?: TicketCategory;
  priority?: TicketPriority;
  userId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

interface TicketResolution {
  ticketId: string;
  response: string;
  adminId: string;
  status?: TicketStatus;
}

class SupportService {
  /**
   * Get all support tickets with filters
   */
  async getTickets(adminId: string, filters: TicketFilters = {}) {
    await adminService.verifyAdminAccess(adminId);

    const {
      status,
      category,
      priority,
      userId,
      search,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20
    } = filters;

    const where: any = {};

    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;
    if (userId) where.userId = userId;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' }
        ],
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

    return {
      tickets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get ticket details
   */
  async getTicketDetails(adminId: string, ticketId: string) {
    await adminService.verifyAdminAccess(adminId);

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
      throw new Error('Ticket not found');
    }

    // Get user's related data based on ticket category
    let relatedData: any = {};

    switch (ticket.category) {
      case 'PROPERTY':
        relatedData.properties = await prisma.property.findMany({
          where: { ownerId: ticket.userId },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            status: true,
            adminApprovalStatus: true
          }
        });
        break;

      case 'BILLING':
        relatedData.payments = await prisma.payment.findMany({
          where: { userId: ticket.userId },
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            amount: true,
            paymentType: true,
            status: true,
            createdAt: true
          }
        });
        break;

      case 'VERIFICATION':
        relatedData.documents = await prisma.document.findMany({
          where: { userId: ticket.userId },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            documentType: true,
            status: true,
            createdAt: true
          }
        });
        break;
    }

    // Get ticket history (previous tickets from same user)
    const ticketHistory = await prisma.supportTicket.findMany({
      where: {
        userId: ticket.userId,
        id: { not: ticketId }
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        createdAt: true,
        resolvedAt: true
      }
    });

    return {
      ticket,
      relatedData,
      ticketHistory
    };
  }

  /**
   * Respond to ticket
   */
  async respondToTicket(resolution: TicketResolution) {
    const { ticketId, response, adminId, status } = resolution;

    await adminService.verifyAdminAccess(adminId);

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
      throw new Error('Ticket not found');
    }

    // Update ticket
    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        adminResponse: response,
        status: status || (ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status),
        resolvedBy: status === 'RESOLVED' ? adminId : ticket.resolvedBy,
        resolvedAt: status === 'RESOLVED' ? new Date() : ticket.resolvedAt
      }
    });

    // Log admin action
    await adminService.logAction(
      adminId,
      AdminActionType.TICKET_RESOLVED,
      'SupportTicket',
      ticketId,
      `Ticket response: ${status || 'in progress'}`,
      { response: response.substring(0, 100) }
    );

    // Send notification to user
    if (ticket.user.email) {
      await notificationService.sendTicketResponse({
        userId: ticket.userId,
        email: ticket.user.email,
        name: ticket.user.name || 'User',
        ticketTitle: ticket.title,
        response,
        status: updatedTicket.status
      });
    }

    return updatedTicket;
  }

  /**
   * Resolve ticket
   */
  async resolveTicket(adminId: string, ticketId: string, response: string) {
    return this.respondToTicket({
      ticketId,
      response,
      adminId,
      status: 'RESOLVED'
    });
  }

  /**
   * Close ticket
   */
  async closeTicket(adminId: string, ticketId: string, notes?: string) {
    await adminService.verifyAdminAccess(adminId);

    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: 'CLOSED',
        resolvedBy: adminId,
        resolvedAt: new Date(),
        adminResponse: notes || ticket.adminResponse
      }
    });

    await adminService.logAction(
      adminId,
      AdminActionType.TICKET_RESOLVED,
      'SupportTicket',
      ticketId,
      'Ticket closed',
      { notes }
    );

    return ticket;
  }

  /**
   * Reopen ticket
   */
  async reopenTicket(adminId: string, ticketId: string, reason: string) {
    await adminService.verifyAdminAccess(adminId);

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: 'OPEN',
        resolvedBy: null,
        resolvedAt: null
      }
    });

    await adminService.logAction(
      adminId,
      AdminActionType.TICKET_RESOLVED,
      'SupportTicket',
      ticketId,
      `Ticket reopened: ${reason}`,
      { reason }
    );

    // Notify user
    if (ticket.user.email) {
      await notificationService.sendTicketResponse({
        userId: ticket.userId,
        email: ticket.user.email,
        name: ticket.user.name || 'User',
        ticketTitle: ticket.title,
        response: `Your ticket has been reopened. Reason: ${reason}`,
        status: 'OPEN'
      });
    }

    return updatedTicket;
  }

  /**
   * Update ticket priority
   */
  async updateTicketPriority(
    adminId: string,
    ticketId: string,
    priority: TicketPriority,
    reason: string
  ) {
    await adminService.verifyAdminAccess(adminId);

    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { priority }
    });

    await adminService.logAction(
      adminId,
      AdminActionType.TICKET_RESOLVED,
      'SupportTicket',
      ticketId,
      `Priority updated to ${priority}: ${reason}`,
      { priority, reason }
    );

    return ticket;
  }

  /**
   * Assign ticket category
   */
  async updateTicketCategory(
    adminId: string,
    ticketId: string,
    category: TicketCategory
  ) {
    await adminService.verifyAdminAccess(adminId);

    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { category }
    });

    await adminService.logAction(
      adminId,
      AdminActionType.TICKET_RESOLVED,
      'SupportTicket',
      ticketId,
      `Category updated to ${category}`
    );

    return ticket;
  }

  /**
   * Get support statistics
   */
  async getSupportStats(adminId: string) {
    await adminService.verifyAdminAccess(adminId);

    const [open, inProgress, resolved, closed, avgResolutionTime] = await Promise.all([
      prisma.supportTicket.count({ where: { status: 'OPEN' } }),
      prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
      prisma.supportTicket.count({ where: { status: 'CLOSED' } }),
      this.calculateAverageResolutionTime()
    ]);

    // Get tickets by category
    const byCategory = await prisma.supportTicket.groupBy({
      by: ['category'],
      _count: true
    });

    // Get tickets by priority
    const byPriority = await prisma.supportTicket.groupBy({
      by: ['priority'],
      where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
      _count: true
    });

    return {
      counts: {
        open,
        inProgress,
        resolved,
        closed,
        total: open + inProgress + resolved + closed,
        pending: open + inProgress
      },
      byCategory: byCategory.map(c => ({
        category: c.category,
        count: c._count
      })),
      byPriority: byPriority.map(p => ({
        priority: p.priority,
        count: p._count
      })),
      avgResolutionTimeHours: avgResolutionTime
    };
  }

  /**
   * Calculate average resolution time
   */
  private async calculateAverageResolutionTime(): Promise<number> {
    const resolvedTickets = await prisma.supportTicket.findMany({
      where: {
        status: { in: ['RESOLVED', 'CLOSED'] },
        resolvedAt: { not: null }
      },
      select: {
        createdAt: true,
        resolvedAt: true
      },
      take: 100,
      orderBy: { resolvedAt: 'desc' }
    });

    if (resolvedTickets.length === 0) return 0;

    const totalTime = resolvedTickets.reduce((sum, ticket) => {
      if (!ticket.resolvedAt) return sum;
      const resolutionTime = ticket.resolvedAt.getTime() - ticket.createdAt.getTime();
      return sum + resolutionTime;
    }, 0);

    // Return average in hours
    return totalTime / resolvedTickets.length / (1000 * 60 * 60);
  }

  /**
   * Bulk update ticket status
   */
  async bulkUpdateTickets(
    adminId: string,
    ticketIds: string[],
    status: TicketStatus,
    notes?: string
  ) {
    await adminService.verifyAdminAccess(adminId);

    const updateData: any = { status };
    
    if (status === 'RESOLVED' || status === 'CLOSED') {
      updateData.resolvedBy = adminId;
      updateData.resolvedAt = new Date();
      if (notes) {
        updateData.adminResponse = notes;
      }
    }

    await prisma.supportTicket.updateMany({
      where: {
        id: { in: ticketIds }
      },
      data: updateData
    });

    await adminService.logAction(
      adminId,
      AdminActionType.TICKET_RESOLVED,
      'SupportTicket',
      'bulk',
      `Bulk status update: ${ticketIds.length} tickets to ${status}`,
      { ticketIds, notes }
    );

    return {
      success: true,
      updated: ticketIds.length
    };
  }

  /**
   * Search tickets
   */
  async searchTickets(adminId: string, query: string, limit: number = 20) {
    await adminService.verifyAdminAccess(adminId);

    const tickets = await prisma.supportTicket.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          {
            user: {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } }
              ]
            }
          }
        ]
      },
      take: limit,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return tickets;
  }

  /**
   * Get ticket trends
   */
  async getTicketTrends(adminId: string, days: number = 30) {
    await adminService.verifyAdminAccess(adminId);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const tickets = await prisma.supportTicket.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      select: {
        createdAt: true,
        category: true,
        priority: true,
        status: true
      }
    });

    // Daily ticket creation trend
    const dailyTrend = tickets.reduce((acc, ticket) => {
      const date = ticket.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, total: 0, byCategory: {} };
      }
      acc[date].total += 1;
      acc[date].byCategory[ticket.category] = (acc[date].byCategory[ticket.category] || 0) + 1;
      return acc;
    }, {} as Record<string, any>);

    return {
      period: `Last ${days} days`,
      total: tickets.length,
      dailyTrend: Object.values(dailyTrend),
      avgTicketsPerDay: tickets.length / days
    };
  }
}

export const supportService = new SupportService();