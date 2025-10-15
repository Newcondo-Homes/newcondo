// backend/marking-service/tests/integration/markingFlow.test.ts

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';

const prisma = new PrismaClient();

describe('Marking Flow Integration Tests', () => {
  let authToken: string;
  let propertyOwnerId: string;
  let agentId: string;
  let propertyId: string;
  let markingJobId: string;

  beforeAll(async () => {
    // Setup test data
    const owner = await prisma.user.create({
      data: {
        email: 'owner@test.com',
        name: 'Test Owner',
        role: 'OWNER',
        passwordHash: 'hashed_password',
        verificationStatus: 'VERIFIED',
      },
    });
    propertyOwnerId = owner.id;

    const agent = await prisma.user.create({
      data: {
        email: 'agent@test.com',
        name: 'Test Agent',
        role: 'AGENT',
        passwordHash: 'hashed_password',
        isAvailableForMarking: true,
        agentServiceAreas: ['Lagos', 'Ikeja'],
        verificationStatus: 'VERIFIED',
      },
    });
    agentId = agent.id;

    const property = await prisma.property.create({
      data: {
        title: 'Test Property for Marking',
        description: 'Test property',
        ownerId: propertyOwnerId,
        address: '123 Test Street',
        city: 'Ikeja',
        state: 'Lagos',
        propertyType: 'APARTMENT',
        status: 'DRAFT',
      },
    });
    propertyId = property.id;

    // Mock auth token
    authToken = 'test-token-' + propertyOwnerId;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.propertyMarkingJob.deleteMany({});
    await prisma.property.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: { in: ['owner@test.com', 'agent@test.com'] } },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clear marking jobs before each test
    await prisma.propertyMarkingJob.deleteMany({});
  });

  describe('Complete Marking Flow - Self Marking', () => {
    it('should allow property owner to create and complete self-marking job', async () => {
      // Step 1: Create marking job (self-marking)
      const createResponse = await request(app)
        .post('/api/marking-jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId,
          markingOption: 'SELF',
          contactPersonName: 'Self',
          contactPersonPhone: '+2348012345678',
          accessInstructions: 'I will mark it myself',
          preferredTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.status).toBe('ASSIGNED');
      expect(createResponse.body.data.assignedAgentId).toBe(propertyOwnerId);

      markingJobId = createResponse.body.data.id;

      // Step 2: Submit boundary data
      const boundaryData = {
        coordinates: [
          { lat: 6.5244, lng: 3.3792 },
          { lat: 6.5245, lng: 3.3792 },
          { lat: 6.5245, lng: 3.3793 },
          { lat: 6.5244, lng: 3.3793 },
        ],
        area: 120.5,
      };

      const markResponse = await request(app)
        .post(`/api/marking-jobs/${markingJobId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          boundaryData,
          completionImages: [
            'https://example.com/image1.jpg',
            'https://example.com/image2.jpg',
          ],
          completionNotes: 'Property marked successfully',
        });

      expect(markResponse.status).toBe(200);
      expect(markResponse.body.success).toBe(true);
      expect(markResponse.body.data.status).toBe('COMPLETED');

      // Step 3: Verify property boundary updated
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
      });

      expect(property?.boundaryCoordinates).toEqual(boundaryData);
      expect(property?.boundaryVerified).toBe(true);
      expect(property?.boundaryMarkedBy).toBe(propertyOwnerId);
    });
  });

  describe('Complete Marking Flow - Send to Known Person', () => {
    it('should create shareable link and allow completion by link holder', async () => {
      // Step 1: Create marking job with shareable link option
      const createResponse = await request(app)
        .post('/api/marking-jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId,
          markingOption: 'SEND_LINK',
          contactPersonName: 'John Helper',
          contactPersonPhone: '+2348087654321',
          accessInstructions: 'Meet at the gate',
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.data.shareableLink).toBeDefined();

      const shareableLink = createResponse.body.data.shareableLink;
      markingJobId = createResponse.body.data.id;

      // Step 2: Access job via shareable link (no auth required)
      const linkAccessResponse = await request(app)
        .get(`/api/marking-jobs/link/${shareableLink}`)
        .send();

      expect(linkAccessResponse.status).toBe(200);
      expect(linkAccessResponse.body.data.id).toBe(markingJobId);

      // Step 3: Complete marking via link
      const boundaryData = {
        coordinates: [
          { lat: 6.5244, lng: 3.3792 },
          { lat: 6.5245, lng: 3.3792 },
        ],
        area: 100.0,
      };

      const completeResponse = await request(app)
        .post(`/api/marking-jobs/link/${shareableLink}/complete`)
        .send({
          boundaryData,
          completionImages: ['https://example.com/marked.jpg'],
          completionNotes: 'Marked by helper',
        });

      expect(completeResponse.status).toBe(200);
      expect(completeResponse.body.data.status).toBe('COMPLETED');

      // Step 4: Verify owner receives notification (check notification service call)
      const job = await prisma.propertyMarkingJob.findUnique({
        where: { id: markingJobId },
      });

      expect(job?.status).toBe('COMPLETED');
      expect(job?.completionNotes).toBe('Marked by helper');
    });
  });

  describe('Complete Marking Flow - Assign to Newcondo', () => {
    it('should create admin-assigned marking job', async () => {
      // Step 1: Create marking job assigned to Newcondo
      const createResponse = await request(app)
        .post('/api/marking-jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId,
          markingOption: 'NEWCONDO',
          contactPersonName: 'Property Caretaker',
          contactPersonPhone: '+2348011111111',
          accessInstructions: 'Contact caretaker',
          urgencyLevel: 'HIGH',
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.data.markingFee).toBe('25000.00');
      expect(createResponse.body.data.status).toBe('QUEUED');

      markingJobId = createResponse.body.data.id;

      // Step 2: Verify admin notification created
      const job = await prisma.propertyMarkingJob.findUnique({
        where: { id: markingJobId },
      });

      expect(job?.status).toBe('QUEUED');
      expect(job?.markingFee.toString()).toBe('25000.00');
    });
  });

  describe('Complete Marking Flow - Assign to Nearby Agents', () => {
    it('should broadcast to nearby agents and assign to first responder', async () => {
      // Step 1: Create marking job with agent assignment
      const createResponse = await request(app)
        .post('/api/marking-jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId,
          markingOption: 'ASSIGN_AGENT',
          contactPersonName: 'Owner Contact',
          contactPersonPhone: '+2348022222222',
          accessInstructions: 'Ring doorbell',
          preferredTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.data.status).toBe('QUEUED');
      expect(createResponse.body.data.markingFee).toBe('20000.00');

      markingJobId = createResponse.body.data.id;

      // Step 2: Agent accepts the job
      const agentToken = 'test-token-' + agentId;
      const acceptResponse = await request(app)
        .post(`/api/marking-jobs/${markingJobId}/accept`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send();

      expect(acceptResponse.status).toBe(200);
      expect(acceptResponse.body.data.status).toBe('ASSIGNED');
      expect(acceptResponse.body.data.assignedAgentId).toBe(agentId);
      expect(acceptResponse.body.data.queuePosition).toBe(1);

      // Step 3: Verify time slot created
      const job = await prisma.propertyMarkingJob.findUnique({
        where: { id: markingJobId },
      });

      expect(job?.timeSlotExpiry).toBeDefined();
      const timeSlotDuration = 
        (job!.timeSlotExpiry!.getTime() - job!.assignedAt!.getTime()) / (1000 * 60 * 60);
      expect(timeSlotDuration).toBeCloseTo(3, 0); // ~3 hours
    });

    it('should handle queue progression when agent fails to complete', async () => {
      // Create second agent
      const agent2 = await prisma.user.create({
        data: {
          email: 'agent2@test.com',
          name: 'Second Agent',
          role: 'AGENT',
          passwordHash: 'hashed_password',
          isAvailableForMarking: true,
          agentServiceAreas: ['Lagos', 'Ikeja'],
          verificationStatus: 'VERIFIED',
        },
      });

      // Step 1: Create job
      const createResponse = await request(app)
        .post('/api/marking-jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId,
          markingOption: 'ASSIGN_AGENT',
          contactPersonName: 'Test Contact',
          contactPersonPhone: '+2348033333333',
        });

      markingJobId = createResponse.body.data.id;

      // Step 2: First agent accepts
      const agent1Token = 'test-token-' + agentId;
      await request(app)
        .post(`/api/marking-jobs/${markingJobId}/accept`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .send();

      // Step 3: Second agent joins queue
      const agent2Token = 'test-token-' + agent2.id;
      const queueResponse = await request(app)
        .post(`/api/marking-jobs/${markingJobId}/accept`)
        .set('Authorization', `Bearer ${agent2Token}`)
        .send();

      expect(queueResponse.body.data.queuePosition).toBe(2);

      // Step 4: Simulate first agent timeout
      await prisma.propertyMarkingJob.update({
        where: { id: markingJobId },
        data: {
          timeSlotExpiry: new Date(Date.now() - 1000), // Expired
        },
      });

      // Step 5: Trigger queue progression (cron job simulation)
      const progressResponse = await request(app)
        .post('/api/marking-jobs/process-expired')
        .set('Authorization', 'Bearer admin-token')
        .send();

      expect(progressResponse.status).toBe(200);

      // Step 6: Verify second agent now assigned
      const job = await prisma.propertyMarkingJob.findUnique({
        where: { id: markingJobId },
      });

      expect(job?.assignedAgentId).toBe(agent2.id);
      expect(job?.queuePosition).toBe(1);

      // Cleanup
      await prisma.user.delete({ where: { id: agent2.id } });
    });
  });

  describe('Marking Job Cancellation', () => {
    it('should allow property owner to cancel queued job', async () => {
      // Create job
      const createResponse = await request(app)
        .post('/api/marking-jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId,
          markingOption: 'ASSIGN_AGENT',
          contactPersonName: 'Test',
          contactPersonPhone: '+2348044444444',
        });

      markingJobId = createResponse.body.data.id;

      // Cancel job
      const cancelResponse = await request(app)
        .post(`/api/marking-jobs/${markingJobId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Changed my mind' });

      expect(cancelResponse.status).toBe(200);
      expect(cancelResponse.body.data.status).toBe('CANCELLED');

      // Verify job cancelled
      const job = await prisma.propertyMarkingJob.findUnique({
        where: { id: markingJobId },
      });

      expect(job?.status).toBe('CANCELLED');
    });
  });

  describe('Error Handling', () => {
    it('should reject marking job for non-existent property', async () => {
      const response = await request(app)
        .post('/api/marking-jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: 'non-existent-id',
          markingOption: 'SELF',
          contactPersonName: 'Test',
          contactPersonPhone: '+2348055555555',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should reject marking job for property not owned by requester', async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@test.com',
          name: 'Other User',
          role: 'OWNER',
          passwordHash: 'hashed',
        },
      });

      const otherToken = 'test-token-' + otherUser.id;

      const response = await request(app)
        .post('/api/marking-jobs')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          propertyId,
          markingOption: 'SELF',
          contactPersonName: 'Test',
          contactPersonPhone: '+2348066666666',
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('not authorized');

      // Cleanup
      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    it('should reject duplicate marking for already marked property', async () => {
      // Mark property first
      await prisma.property.update({
        where: { id: propertyId },
        data: {
          boundaryVerified: true,
          boundaryMarkedBy: agentId,
        },
      });

      const response = await request(app)
        .post('/api/marking-jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId,
          markingOption: 'SELF',
          contactPersonName: 'Test',
          contactPersonPhone: '+2348077777777',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already marked');

      // Reset property
      await prisma.property.update({
        where: { id: propertyId },
        data: {
          boundaryVerified: false,
          boundaryMarkedBy: null,
        },
      });
    });
  });
});