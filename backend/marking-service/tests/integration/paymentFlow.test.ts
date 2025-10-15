import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import app from '../../src/app';

const prisma = new PrismaClient();

describe('Payment Flow Integration Tests', () => {
  let propertyOwnerId: string;
  let agentId: string;
  let propertyId: string;
  let markingJobId: string;
  let authToken: string;
  let agentToken: string;

  beforeAll(async () => {
    // Create test property owner
    const owner = await prisma.user.create({
      data: {
        email: 'payment-owner@test.com',
        name: 'Payment Test Owner',
        role: 'OWNER',
        passwordHash: 'hashed_password',
        verificationStatus: 'VERIFIED',
      },
    });
    propertyOwnerId = owner.id;

    // Create test agent
    const agent = await prisma.user.create({
      data: {
        email: 'payment-agent@test.com',
        name: 'Payment Test Agent',
        role: 'AGENT',
        passwordHash: 'hashed_password',
        verificationStatus: 'VERIFIED',
        isAvailableForMarking: true,
        agentServiceAreas: ['Lagos'],
      },
    });
    agentId = agent.id;

    // Create virtual accounts
    await prisma.virtualAccount.create({
      data: {
        accountNumber: '1234567890',
        accountName: owner.name!,
        bankCode: '044',
        userId: propertyOwnerId,
        balance: 50000,
        isActive: true,
      },
    });

    await prisma.virtualAccount.create({
      data: {
        accountNumber: '0987654321',
        accountName: agent.name!,
        bankCode: '044',
        userId: agentId,
        balance: 0,
        isActive: true,
      },
    });

    // Create test property
    const property = await prisma.property.create({
      data: {
        title: 'Payment Test Property',
        description: 'Property for payment flow testing',
        price: 500000,
        address: '123 Payment St, Lagos',
        city: 'Lagos',
        state: 'Lagos',
        ownerId: propertyOwnerId,
        propertyType: 'APARTMENT',
        status: 'DRAFT',
        gpsCoordinates: JSON.stringify({ lat: 6.5244, lng: 3.3792 }),
      },
    });
    propertyId = property.id;

    // Mock auth tokens
    authToken = 'mock-owner-token';
    agentToken = 'mock-agent-token';
  });

  afterAll(async () => {
    await prisma.payment.deleteMany({
      where: { userId: { in: [propertyOwnerId, agentId] } },
    });
    await prisma.propertyMarkingJob.deleteMany({
      where: { propertyId },
    });
    await prisma.virtualAccount.deleteMany({
      where: { userId: { in: [propertyOwnerId, agentId] } },
    });
    await prisma.property.delete({ where: { id: propertyId } });
    await prisma.user.deleteMany({
      where: { id: { in: [propertyOwnerId, agentId] } },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up marking jobs before each test
    await prisma.propertyMarkingJob.deleteMany({
      where: { propertyId },
    });
  });

  describe('Payment Processing', () => {
    it('should create marking job with pending payment', async () => {
      const response = await request(app)
        .post('/api/marking-jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId,
          markingOption: 'ASSIGN_TO_AGENTS',
          contactPersonName: 'John Contact',
          contactPersonPhone: '+2348012345678',
          accessInstructions: 'Gate code: 1234',
          preferredTime: new Date(Date.now() + 86400000).toISOString(),
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('markingJob');
      expect(response.body.data.markingJob.paymentStatus).toBe('PENDING');
      expect(response.body.data.markingJob.markingFee).toBe('20000.00');

      markingJobId = response.body.data.markingJob.id;
    });

    it('should process payment for marking job', async () => {
      // Create marking job
      const job = await prisma.propertyMarkingJob.create({
        data: {
          propertyId,
          requestedBy: propertyOwnerId,
          contactPersonName: 'John Contact',
          contactPersonPhone: '+2348012345678',
          markingFee: 20000,
          paymentStatus: 'PENDING',
          status: 'QUEUED',
        },
      });

      const response = await request(app)
        .post(`/api/marking-jobs/${job.id}/payment`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentMethod: 'VIRTUAL_ACCOUNT',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.payment.status).toBe('SUCCESS');
      expect(response.body.data.payment.amount).toBe('20000.00');

      // Verify payment record created
      const payment = await prisma.payment.findFirst({
        where: {
          userId: propertyOwnerId,
          markingJobId: job.id,
        },
      });

      expect(payment).toBeTruthy();
      expect(payment?.status).toBe('SUCCESS');
      expect(payment?.paymentType).toBe('PROPERTY_MARKING');

      // Verify marking job updated
      const updatedJob = await prisma.propertyMarkingJob.findUnique({
        where: { id: job.id },
      });

      expect(updatedJob?.paymentStatus).toBe('SUCCESS');
    });

    it('should deduct from virtual account balance', async () => {
      const job = await prisma.propertyMarkingJob.create({
        data: {
          propertyId,
          requestedBy: propertyOwnerId,
          contactPersonName: 'John Contact',
          contactPersonPhone: '+2348012345678',
          markingFee: 20000,
          paymentStatus: 'PENDING',
          status: 'QUEUED',
        },
      });

      const initialBalance = await prisma.virtualAccount.findFirst({
        where: { userId: propertyOwnerId },
      });

      await request(app)
        .post(`/api/marking-jobs/${job.id}/payment`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentMethod: 'VIRTUAL_ACCOUNT',
        });

      const updatedBalance = await prisma.virtualAccount.findFirst({
        where: { userId: propertyOwnerId },
      });

      expect(Number(updatedBalance?.balance)).toBe(
        Number(initialBalance?.balance) - 20000
      );
    });

    it('should reject payment with insufficient balance', async () => {
      // Update balance to insufficient
      await prisma.virtualAccount.update({
        where: { userId: propertyOwnerId },
        data: { balance: 10000 },
      });

      const job = await prisma.propertyMarkingJob.create({
        data: {
          propertyId,
          requestedBy: propertyOwnerId,
          contactPersonName: 'John Contact',
          contactPersonPhone: '+2348012345678',
          markingFee: 20000,
          paymentStatus: 'PENDING',
          status: 'QUEUED',
        },
      });

      const response = await request(app)
        .post(`/api/marking-jobs/${job.id}/payment`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentMethod: 'VIRTUAL_ACCOUNT',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_BALANCE');

      // Restore balance for other tests
      await prisma.virtualAccount.update({
        where: { userId: propertyOwnerId },
        data: { balance: 50000 },
      });
    });
  });

  describe('Agent Compensation', () => {
    it('should pay partial compensation when agent marks property', async () => {
      const job = await prisma.propertyMarkingJob.create({
        data: {
          propertyId,
          requestedBy: propertyOwnerId,
          assignedAgentId: agentId,
          contactPersonName: 'John Contact',
          contactPersonPhone: '+2348012345678',
          markingFee: 20000,
          paymentStatus: 'SUCCESS',
          status: 'ASSIGNED',
          assignedAt: new Date(),
          timeSlotExpiry: new Date(Date.now() + 10800000), // 3 hours
        },
      });

      await prisma.payment.create({
        data: {
          userId: propertyOwnerId,
          markingJobId: job.id,
          amount: 20000,
          paymentType: 'PROPERTY_MARKING',
          status: 'HELD',
        },
      });

      const response = await request(app)
        .post(`/api/marking-jobs/${job.id}/complete`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          completionNotes: 'Property marked successfully',
          completionImages: ['https://example.com/image1.jpg'],
          boundaryData: {
            coordinates: [
              [6.5244, 3.3792],
              [6.5245, 3.3793],
            ],
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify partial payment to agent (1000 naira)
      const agentBalance = await prisma.virtualAccount.findFirst({
        where: { userId: agentId },
      });

      expect(Number(agentBalance?.balance)).toBe(1000);

      // Verify job status
      const updatedJob = await prisma.propertyMarkingJob.findUnique({
        where: { id: job.id },
      });

      expect(updatedJob?.status).toBe('COMPLETED');
      expect(updatedJob?.completedAt).toBeTruthy();
    });

    it('should release full compensation after owner confirmation', async () => {
      const job = await prisma.propertyMarkingJob.create({
        data: {
          propertyId,
          requestedBy: propertyOwnerId,
          assignedAgentId: agentId,
          contactPersonName: 'John Contact',
          contactPersonPhone: '+2348012345678',
          markingFee: 20000,
          paymentStatus: 'SUCCESS',
          status: 'COMPLETED',
          assignedAt: new Date(Date.now() - 3600000),
          completedAt: new Date(),
          completionNotes: 'Property marked',
          completionImages: ['https://example.com/image1.jpg'],
        },
      });

      await prisma.payment.create({
        data: {
          userId: propertyOwnerId,
          markingJobId: job.id,
          amount: 20000,
          paymentType: 'PROPERTY_MARKING',
          status: 'HELD',
        },
      });

      // Reset agent balance
      await prisma.virtualAccount.update({
        where: { userId: agentId },
        data: { balance: 1000 },
      });

      const response = await request(app)
        .post(`/api/marking-jobs/${job.id}/verify`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          approved: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify full compensation (25% of 20,000 = 5,000)
      const agentBalance = await prisma.virtualAccount.findFirst({
        where: { userId: agentId },
      });

      expect(Number(agentBalance?.balance)).toBe(5000);

      // Verify payment released
      const payment = await prisma.payment.findFirst({
        where: { markingJobId: job.id },
      });

      expect(payment?.status).toBe('RELEASED');
      expect(payment?.isReleased).toBe(true);
    });

    it('should compensate agent incrementally if owner misses deadlines', async () => {
      const job = await prisma.propertyMarkingJob.create({
        data: {
          propertyId,
          requestedBy: propertyOwnerId,
          assignedAgentId: agentId,
          contactPersonName: 'John Contact',
          contactPersonPhone: '+2348012345678',
          markingFee: 20000,
          paymentStatus: 'SUCCESS',
          status: 'COMPLETED',
          assignedAt: new Date(Date.now() - 259200000), // 3 days ago
          completedAt: new Date(Date.now() - 259200000),
          maxCompletionTime: new Date(Date.now() - 1), // Expired
        },
      });

      await prisma.payment.create({
        data: {
          userId: propertyOwnerId,
          markingJobId: job.id,
          amount: 20000,
          paymentType: 'PROPERTY_MARKING',
          status: 'HELD',
          confirmationPeriodEnd: new Date(Date.now() - 1),
        },
      });

      // Reset agent balance
      await prisma.virtualAccount.update({
        where: { userId: agentId },
        data: { balance: 1000 },
      });

      const response = await request(app)
        .post('/api/marking-jobs/process-expired')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // Verify incremental compensation
      const agentBalance = await prisma.virtualAccount.findFirst({
        where: { userId: agentId },
      });

      // Should receive additional compensation for missed deadline
      expect(Number(agentBalance?.balance)).toBeGreaterThan(1000);
    });
  });

  describe('Payment Security', () => {
    it('should prevent double payment for same marking job', async () => {
      const job = await prisma.propertyMarkingJob.create({
        data: {
          propertyId,
          requestedBy: propertyOwnerId,
          contactPersonName: 'John Contact',
          contactPersonPhone: '+2348012345678',
          markingFee: 20000,
          paymentStatus: 'PENDING',
          status: 'QUEUED',
        },
      });

      // First payment
      await request(app)
        .post(`/api/marking-jobs/${job.id}/payment`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentMethod: 'VIRTUAL_ACCOUNT',
        });

      // Second payment attempt
      const response = await request(app)
        .post(`/api/marking-jobs/${job.id}/payment`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentMethod: 'VIRTUAL_ACCOUNT',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PAYMENT_ALREADY_PROCESSED');
    });

    it('should hold payment until verification', async () => {
      const job = await prisma.propertyMarkingJob.create({
        data: {
          propertyId,
          requestedBy: propertyOwnerId,
          assignedAgentId: agentId,
          contactPersonName: 'John Contact',
          contactPersonPhone: '+2348012345678',
          markingFee: 20000,
          paymentStatus: 'SUCCESS',
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      const payment = await prisma.payment.create({
        data: {
          userId: propertyOwnerId,
          markingJobId: job.id,
          amount: 20000,
          paymentType: 'PROPERTY_MARKING',
          status: 'HELD',
          confirmationPeriodEnd: new Date(Date.now() + 259200000),
        },
      });

      // Verify payment is held
      expect(payment.status).toBe('HELD');
      expect(payment.isReleased).toBe(false);

      // Verify funds not yet in agent account
      const initialAgentBalance = await prisma.virtualAccount.findFirst({
        where: { userId: agentId },
      });

      // Agent should only have partial payment
      expect(Number(initialAgentBalance?.balance)).toBeLessThan(5000);
    });

    it('should refund on job cancellation', async () => {
      const job = await prisma.propertyMarkingJob.create({
        data: {
          propertyId,
          requestedBy: propertyOwnerId,
          contactPersonName: 'John Contact',
          contactPersonPhone: '+2348012345678',
          markingFee: 20000,
          paymentStatus: 'SUCCESS',
          status: 'QUEUED',
        },
      });

      await prisma.payment.create({
        data: {
          userId: propertyOwnerId,
          markingJobId: job.id,
          amount: 20000,
          paymentType: 'PROPERTY_MARKING',
          status: 'SUCCESS',
        },
      });

      const initialBalance = await prisma.virtualAccount.findFirst({
        where: { userId: propertyOwnerId },
      });

      const response = await request(app)
        .post(`/api/marking-jobs/${job.id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify refund
      const updatedBalance = await prisma.virtualAccount.findFirst({
        where: { userId: propertyOwnerId },
      });

      expect(Number(updatedBalance?.balance)).toBe(
        Number(initialBalance?.balance) + 20000
      );

      // Verify payment status
      const payment = await prisma.payment.findFirst({
        where: { markingJobId: job.id },
      });

      expect(payment?.status).toBe('REFUNDED');
    });
  });
});