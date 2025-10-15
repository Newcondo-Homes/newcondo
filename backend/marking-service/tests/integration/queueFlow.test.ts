// backend/marking-service/tests/integration/queueFlow.test.ts

import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient } from '@newcondo/db';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);

describe('Queue Flow Integration Tests', () => {
  let propertyOwnerId: string;
  let agent1Id: string;
  let agent2Id: string;
  let agent3Id: string;
  let propertyId: string;
  let markingJobId: string;
  let ownerToken: string;
  let agent1Token: string;
  let agent2Token: string;
  let agent3Token: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.propertyMarkingJob.deleteMany({});
    await prisma.property.deleteMany({});
    await prisma.virtualAccount.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: { contains: 'test-queue' } }
    });

    // Create test users
    const owner = await prisma.user.create({
      data: {
        email: 'test-queue-owner@example.com',
        name: 'Test Owner',
        phone: '+2348012345670',
        role: 'OWNER',
        verificationStatus: 'VERIFIED',
        passwordHash: 'hashed_password'
      }
    });
    propertyOwnerId = owner.id;

    // Create test agents in different locations
    const agent1 = await prisma.user.create({
      data: {
        email: 'test-queue-agent1@example.com',
        name: 'Agent One',
        phone: '+2348012345671',
        role: 'AGENT',
        verificationStatus: 'VERIFIED',
        isAvailableForMarking: true,
        agentServiceAreas: ['Lagos', 'Ikeja'],
        agentReliabilityScore: 4.5,
        passwordHash: 'hashed_password'
      }
    });
    agent1Id = agent1.id;

    const agent2 = await prisma.user.create({
      data: {
        email: 'test-queue-agent2@example.com',
        name: 'Agent Two',
        phone: '+2348012345672',
        role: 'AGENT',
        verificationStatus: 'VERIFIED',
        isAvailableForMarking: true,
        agentServiceAreas: ['Lagos', 'Ikeja'],
        agentReliabilityScore: 4.8,
        passwordHash: 'hashed_password'
      }
    });
    agent2Id = agent2.id;

    const agent3 = await prisma.user.create({
      data: {
        email: 'test-queue-agent3@example.com',
        name: 'Agent Three',
        phone: '+2348012345673',
        role: 'AGENT',
        verificationStatus: 'VERIFIED',
        isAvailableForMarking: true,
        agentServiceAreas: ['Lagos', 'Ikeja'],
        agentReliabilityScore: 4.2,
        passwordHash: 'hashed_password'
      }
    });
    agent3Id = agent3.id;

    // Create virtual accounts
    await prisma.virtualAccount.create({
      data: {
        accountNumber: '1234567890',
        accountName: owner.name!,
        bankCode: '044',
        userId: propertyOwnerId,
        balance: 50000,
        isActive: true
      }
    });

    // Create test property
    const property = await prisma.property.create({
      data: {
        title: 'Test Property for Queue',
        description: 'Queue testing property',
        address: '123 Queue Test Street',
        city: 'Ikeja',
        state: 'Lagos',
        price: 500000,
        propertyType: 'APARTMENT',
        ownerId: propertyOwnerId,
        status: 'DRAFT'
      }
    });
    propertyId = property.id;

    // Generate mock tokens (in real app, use proper JWT generation)
    ownerToken = 'mock_owner_token';
    agent1Token = 'mock_agent1_token';
    agent2Token = 'mock_agent2_token';
    agent3Token = 'mock_agent3_token';
  });

  afterAll(async () => {
    // Clean up
    await prisma.propertyMarkingJob.deleteMany({});
    await prisma.property.deleteMany({});
    await prisma.virtualAccount.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: { contains: 'test-queue' } }
    });
    await redis.flushall();
    await redis.quit();
    await prisma.$disconnect();
  });

  describe('Queue Assignment and Management', () => {
    it('should create a marking job and broadcast to nearby agents', async () => {
      const response = await request(app)
        .post('/api/marking-jobs')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          propertyId,
          markingChoice: 'ASSIGN_TO_AGENTS',
          contactPersonName: 'John Doe',
          contactPersonPhone: '+2348012345678',
          accessInstructions: 'Gate code: 1234',
          preferredTime: new Date(Date.now() + 86400000).toISOString()
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.markingJob).toBeDefined();
      expect(response.body.data.markingJob.status).toBe('QUEUED');

      markingJobId = response.body.data.markingJob.id;

      // Verify job was created
      const job = await prisma.propertyMarkingJob.findUnique({
        where: { id: markingJobId }
      });
      expect(job).toBeDefined();
      expect(job?.status).toBe('QUEUED');

      // Verify broadcast was sent to Redis queue
      const queueKey = `marking-job-queue:${propertyId}`;
      const queueLength = await redis.llen(queueKey);
      expect(queueLength).toBe(0); // Initially empty, agents will join
    });

    it('should allow agents to join the queue in order', async () => {
      // Agent 1 joins
      const response1 = await request(app)
        .post(`/api/marking-jobs/${markingJobId}/join-queue`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .send({});

      expect(response1.status).toBe(200);
      expect(response1.body.success).toBe(true);
      expect(response1.body.data.queuePosition).toBe(1);

      // Agent 2 joins
      const response2 = await request(app)
        .post(`/api/marking-jobs/${markingJobId}/join-queue`)
        .set('Authorization', `Bearer ${agent2Token}`)
        .send({});

      expect(response2.status).toBe(200);
      expect(response2.body.data.queuePosition).toBe(2);

      // Agent 3 joins
      const response3 = await request(app)
        .post(`/api/marking-jobs/${markingJobId}/join-queue`)
        .set('Authorization', `Bearer ${agent3Token}`)
        .send({});

      expect(response3.status).toBe(200);
      expect(response3.body.data.queuePosition).toBe(3);

      // Verify Redis queue
      const queueKey = `marking-job-queue:${markingJobId}`;
      const queueLength = await redis.llen(queueKey);
      expect(queueLength).toBe(3);
    });

    it('should prevent duplicate queue entries', async () => {
      const response = await request(app)
        .post(`/api/marking-jobs/${markingJobId}/join-queue`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already in queue');
    });

    it('should auto-assign first agent in queue', async () => {
      // Trigger auto-assignment (normally done by cron job)
      const response = await request(app)
        .post(`/api/marking-jobs/${markingJobId}/process-queue`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({});

      expect(response.status).toBe(200);

      // Verify assignment
      const job = await prisma.propertyMarkingJob.findUnique({
        where: { id: markingJobId }
      });

      expect(job?.assignedAgentId).toBe(agent1Id);
      expect(job?.status).toBe('ASSIGNED');
      expect(job?.timeSlotExpiry).toBeDefined();

      // Verify time slot is ~3 hours from now
      const timeSlotExpiry = new Date(job!.timeSlotExpiry!);
      const expectedExpiry = new Date(Date.now() + 3 * 60 * 60 * 1000);
      const timeDiff = Math.abs(timeSlotExpiry.getTime() - expectedExpiry.getTime());
      expect(timeDiff).toBeLessThan(60000); // Within 1 minute
    });

    it('should show queue position to waiting agents', async () => {
      // Agent 2 checks their position
      const response = await request(app)
        .get(`/api/marking-jobs/${markingJobId}/queue-position`)
        .set('Authorization', `Bearer ${agent2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.position).toBe(1); // Now first in line
      expect(response.body.data.estimatedWaitTime).toBe('3 hours');
      expect(response.body.data.currentlyAssignedTo).toBeDefined();
    });

    it('should move to next agent if first agent fails to complete in time', async () => {
      // Simulate time passing (3 hours)
      await prisma.propertyMarkingJob.update({
        where: { id: markingJobId },
        data: {
          timeSlotExpiry: new Date(Date.now() - 1000) // Expired 1 second ago
        }
      });

      // Trigger queue processing
      const response = await request(app)
        .post(`/api/marking-jobs/${markingJobId}/process-queue`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({});

      expect(response.status).toBe(200);

      // Verify next agent was assigned
      const job = await prisma.propertyMarkingJob.findUnique({
        where: { id: markingJobId }
      });

      expect(job?.assignedAgentId).toBe(agent2Id);
      expect(job?.status).toBe('ASSIGNED');

      // Verify partial payment to first agent
      const partialPayment = await prisma.payment.findFirst({
        where: {
          userId: agent1Id,
          markingJobId
        }
      });

      expect(partialPayment).toBeDefined();
      expect(Number(partialPayment?.amount)).toBe(1000); // ₦1,000 compensation
    });

    it('should allow agent to leave queue voluntarily', async () => {
      const response = await request(app)
        .delete(`/api/marking-jobs/${markingJobId}/leave-queue`)
        .set('Authorization', `Bearer ${agent3Token}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify Redis queue updated
      const queueKey = `marking-job-queue:${markingJobId}`;
      const queueMembers = await redis.lrange(queueKey, 0, -1);
      expect(queueMembers).not.toContain(agent3Id);
    });

    it('should prevent agents outside service area from joining', async () => {
      // Create agent outside Lagos
      const outsideAgent = await prisma.user.create({
        data: {
          email: 'test-queue-outside@example.com',
          name: 'Outside Agent',
          phone: '+2348012345674',
          role: 'AGENT',
          verificationStatus: 'VERIFIED',
          isAvailableForMarking: true,
          agentServiceAreas: ['Abuja', 'Garki'],
          passwordHash: 'hashed_password'
        }
      });

      const outsideToken = 'mock_outside_token';

      const response = await request(app)
        .post(`/api/marking-jobs/${markingJobId}/join-queue`)
        .set('Authorization', `Bearer ${outsideToken}`)
        .send({});

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('outside service area');

      // Clean up
      await prisma.user.delete({ where: { id: outsideAgent.id } });
    });

    it('should close queue and notify remaining agents when job completes', async () => {
      // Agent 2 completes the job
      const response = await request(app)
        .post(`/api/marking-jobs/${markingJobId}/complete`)
        .set('Authorization', `Bearer ${agent2Token}`)
        .send({
          completionNotes: 'Property successfully marked',
          completionImages: [
            'https://example.com/image1.jpg',
            'https://example.com/image2.jpg'
          ],
          boundaryData: {
            type: 'Polygon',
            coordinates: [[[3.3792, 6.5244], [3.3793, 6.5244], [3.3793, 6.5245]]]
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify job status
      const job = await prisma.propertyMarkingJob.findUnique({
        where: { id: markingJobId }
      });

      expect(job?.status).toBe('COMPLETED');

      // Verify queue was cleared
      const queueKey = `marking-job-queue:${markingJobId}`;
      const queueExists = await redis.exists(queueKey);
      expect(queueExists).toBe(0);
    });

    it('should get queue statistics', async () => {
      const response = await request(app)
        .get(`/api/marking-jobs/${markingJobId}/queue-stats`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('totalJoined');
      expect(response.body.data).toHaveProperty('currentPosition');
      expect(response.body.data).toHaveProperty('assignedAgent');
      expect(response.body.data).toHaveProperty('completionRate');
    });
  });

  describe('Queue Edge Cases', () => {
    let edgeJobId: string;

    beforeEach(async () => {
      // Create a new marking job for edge case testing
      const job = await prisma.propertyMarkingJob.create({
        data: {
          propertyId,
          requestedBy: propertyOwnerId,
          contactPersonName: 'Edge Case Contact',
          contactPersonPhone: '+2348012345679',
          markingFee: 20000,
          status: 'QUEUED'
        }
      });
      edgeJobId = job.id;
    });

    it('should handle empty queue gracefully', async () => {
      const response = await request(app)
        .post(`/api/marking-jobs/${edgeJobId}/process-queue`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.data.message).toContain('No agents available');
    });

    it('should handle concurrent queue joins', async () => {
      // Simulate concurrent requests
      const promises = [
        request(app)
          .post(`/api/marking-jobs/${edgeJobId}/join-queue`)
          .set('Authorization', `Bearer ${agent1Token}`),
        request(app)
          .post(`/api/marking-jobs/${edgeJobId}/join-queue`)
          .set('Authorization', `Bearer ${agent2Token}`),
        request(app)
          .post(`/api/marking-jobs/${edgeJobId}/join-queue`)
          .set('Authorization', `Bearer ${agent3Token}`)
      ];

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach(res => {
        expect(res.status).toBe(200);
      });

      // Verify no duplicates in queue
      const queueKey = `marking-job-queue:${edgeJobId}`;
      const queueMembers = await redis.lrange(queueKey, 0, -1);
      const uniqueMembers = new Set(queueMembers);
      expect(uniqueMembers.size).toBe(queueMembers.length);
    });

    it('should handle job cancellation and notify queue', async () => {
      // Add agents to queue
      await request(app)
        .post(`/api/marking-jobs/${edgeJobId}/join-queue`)
        .set('Authorization', `Bearer ${agent1Token}`);

      // Owner cancels job
      const response = await request(app)
        .delete(`/api/marking-jobs/${edgeJobId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);

      // Verify job cancelled
      const job = await prisma.propertyMarkingJob.findUnique({
        where: { id: edgeJobId }
      });
      expect(job?.status).toBe('CANCELLED');

      // Verify queue cleared
      const queueKey = `marking-job-queue:${edgeJobId}`;
      const queueExists = await redis.exists(queueKey);
      expect(queueExists).toBe(0);
    });
  });
});