import request from 'supertest';
import { PrismaClient, MarkingJobStatus, PaymentStatus } from '@prisma/client';
import app from '../../src/app';
import { generateTestToken } from '../helpers/authHelper';
import { createTestUser, createTestProperty, createTestMarkingJob } from '../helpers/testDataFactory';

const prisma = new PrismaClient();

describe('Property Marking Verification Flow Integration Tests', () => {
  let propertyOwnerToken: string;
  let propertyOwnerId: string;
  let agentToken: string;
  let agentId: string;
  let propertyId: string;
  let markingJobId: string;
  let renterToken: string;
  let renterId: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.propertyMarkingJob.deleteMany();
    await prisma.property.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    const propertyOwner = await createTestUser({
      role: 'OWNER',
      userType: 'LANDLORD',
      email: 'owner-verification@test.com',
      phone: '+2348012345678',
    });
    propertyOwnerId = propertyOwner.id;
    propertyOwnerToken = generateTestToken(propertyOwner);

    const agent = await createTestUser({
      role: 'AGENT',
      userType: 'AGENT',
      email: 'agent-verification@test.com',
      phone: '+2348087654321',
      isAvailableForMarking: true,
      agentServiceAreas: ['Lagos', 'Ikeja'],
    });
    agentId = agent.id;
    agentToken = generateTestToken(agent);

    const renter = await createTestUser({
      role: 'RENTER',
      userType: 'RENTER',
      email: 'renter-verification@test.com',
      phone: '+2348098765432',
      isPremium: true,
      isAvailableForMarking: true,
      agentServiceAreas: ['Lagos', 'Ikeja'],
    });
    renterId = renter.id;
    renterToken = generateTestToken(renter);

    // Create virtual accounts
    await prisma.virtualAccount.createMany({
      data: [
        {
          userId: propertyOwnerId,
          accountNumber: '9876543210',
          accountName: 'Owner Test Account',
          bankCode: '044',
          balance: 0,
        },
        {
          userId: agentId,
          accountNumber: '1234567890',
          accountName: 'Agent Test Account',
          bankCode: '044',
          balance: 0,
        },
        {
          userId: renterId,
          accountNumber: '5555555555',
          accountName: 'Renter Test Account',
          bankCode: '044',
          balance: 0,
        },
      ],
    });

    // Create test property
    const property = await createTestProperty({
      ownerId: propertyOwnerId,
      title: 'Verification Test Property',
      address: '123 Verification Street',
      city: 'Ikeja',
      state: 'Lagos',
      gpsCoordinates: JSON.stringify({ lat: 6.5244, lng: 3.3792 }),
    });
    propertyId = property.id;
  });

  afterAll(async () => {
    // Clean up
    await prisma.propertyMarkingJob.deleteMany();
    await prisma.virtualAccount.deleteMany();
    await prisma.property.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('Complete Verification Flow', () => {
    it('should handle complete marking job verification with agent', async () => {
      // Step 1: Create marking job
      const createResponse = await request(app)
        .post('/api/marking-jobs')
        .set('Authorization', `Bearer ${propertyOwnerToken}`)
        .send({
          propertyId,
          assignmentType: 'AGENT',
          contactPersonName: 'John Doe',
          contactPersonPhone: '+2348011111111',
          accessInstructions: 'Ring the doorbell',
          preferredTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          urgencyLevel: 'NORMAL',
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      markingJobId = createResponse.body.data.markingJob.id;

      // Step 2: Process payment
      const paymentResponse = await request(app)
        .post(`/api/marking-jobs/${markingJobId}/payment/callback`)
        .send({
          status: 'successful',
          tx_ref: `MARKING-${markingJobId}`,
          transaction_id: '123456789',
          amount: 20000,
        });

      expect(paymentResponse.status).toBe(200);

      // Verify payment status
      const markingJobAfterPayment = await prisma.propertyMarkingJob.findUnique({
        where: { id: markingJobId },
      });
      expect(markingJobAfterPayment?.paymentStatus).toBe('SUCCESS');
      expect(markingJobAfterPayment?.status).toBe('QUEUED');

      // Step 3: Agent accepts job
      const acceptResponse = await request(app)
        .post(`/api/marking-jobs/${markingJobId}/accept`)
        .set('Authorization', `Bearer ${agentToken}`);

      expect(acceptResponse.status).toBe(200);
      expect(acceptResponse.body.data.status).toBe('ASSIGNED');

      // Step 4: Agent completes marking
      const completeResponse = await request(app)
        .post(`/api/marking-jobs/${markingJobId}/complete`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          completionNotes: 'Property marked successfully',
          completionImages: [
            'https://example.com/image1.jpg',
            'https://example.com/image2.jpg',
          ],
          boundaryData: {
            type: 'Polygon',
            coordinates: [
              [
                [3.3792, 6.5244],
                [3.3793, 6.5244],
                [3.3793, 6.5245],
                [3.3792, 6.5245],
                [3.3792, 6.5244],
              ],
            ],
          },
        });

      expect(completeResponse.status).toBe(200);
      expect(completeResponse.body.data.status).toBe('COMPLETED');

      // Verify partial payment to agent
      const agentAccount = await prisma.virtualAccount.findFirst({
        where: { userId: agentId },
      });
      expect(agentAccount?.balance.toNumber()).toBe(1000); // Partial payment

      // Step 5: Property owner verifies marking
      const verifyResponse = await request(app)
        .post(`/api/marking-jobs/${markingJobId}/verify`)
        .set('Authorization', `Bearer ${propertyOwnerToken}`)
        .send({
          isApproved: true,
          verificationNotes: 'Marking looks good',
        });

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.success).toBe(true);

      // Verify full payment released to agent
      const agentAccountAfterVerification = await prisma.virtualAccount.findFirst({
        where: { userId: agentId },
      });
      expect(agentAccountAfterVerification?.balance.toNumber()).toBeGreaterThan(1000);

      // Verify property boundary updated
      const updatedProperty = await prisma.property.findUnique({
        where: { id: propertyId },
      });
      expect(updatedProperty?.boundaryVerified).toBe(true);
      expect(updatedProperty?.boundaryMarkedBy).toBe(agentId);
      expect(updatedProperty?.boundaryCoordinates).toBeTruthy();
    });

    it('should handle verification rejection and retry flow', async () => {
      // Create another marking job
      const createResponse = await request(app)
        .post('/api/marking-jobs')
        .set('Authorization', `Bearer ${propertyOwnerToken}`)
        .send({
          propertyId,
          assignmentType: 'AGENT',
          contactPersonName: 'Jane Doe',
          contactPersonPhone: '+2348022222222',
          accessInstructions: 'Call before arrival',
          urgencyLevel: 'NORMAL',
        });

      const jobId = createResponse.body.data.markingJob.id;

      // Process payment
      await request(app)
        .post(`/api/marking-jobs/${jobId}/payment/callback`)
        .send({
          status: 'successful',
          tx_ref: `MARKING-${jobId}`,
          transaction_id: '987654321',
          amount: 20000,
        });

      // Agent accepts and completes
      await request(app)
        .post(`/api/marking-jobs/${jobId}/accept`)
        .set('Authorization', `Bearer ${agentToken}`);

      await request(app)
        .post(`/api/marking-jobs/${jobId}/complete`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          completionNotes: 'Marked',
          completionImages: ['https://example.com/image.jpg'],
          boundaryData: {
            type: 'Polygon',
            coordinates: [
              [
                [3.3792, 6.5244],
                [3.3793, 6.5244],
                [3.3793, 6.5245],
                [3.3792, 6.5245],
                [3.3792, 6.5244],
              ],
            ],
          },
        });

      // Property owner rejects marking
      const rejectResponse = await request(app)
        .post(`/api/marking-jobs/${jobId}/verify`)
        .set('Authorization', `Bearer ${propertyOwnerToken}`)
        .send({
          isApproved: false,
          verificationNotes: 'Incorrect boundary marked',
        });

      expect(rejectResponse.status).toBe(200);

      // Verify partial payment still given to agent
      const agentAccount = await prisma.virtualAccount.findFirst({
        where: { userId: agentId },
      });
      expect(agentAccount?.balance.toNumber()).toBeGreaterThanOrEqual(1000);

      // Verify marking job can be retried
      const updatedJob = await prisma.propertyMarkingJob.findUnique({
        where: { id: jobId },
      });
      expect(updatedJob?.status).toBe('COMPLETED'); // Still completed but not verified
    });

    it('should handle verification timeout and automatic compensation', async () => {
      // Create marking job
      const createResponse = await request(app)
        .post('/api/marking-jobs')
        .set('Authorization', `Bearer ${propertyOwnerToken}`)
        .send({
          propertyId,
          assignmentType: 'AGENT',
          contactPersonName: 'Bob Smith',
          contactPersonPhone: '+2348033333333',
          urgencyLevel: 'NORMAL',
        });

      const jobId = createResponse.body.data.markingJob.id;

      // Process payment
      await request(app)
        .post(`/api/marking-jobs/${jobId}/payment/callback`)
        .send({
          status: 'successful',
          tx_ref: `MARKING-${jobId}`,
          transaction_id: '555555555',
          amount: 20000,
        });

      // Agent accepts and completes
      await request(app)
        .post(`/api/marking-jobs/${jobId}/accept`)
        .set('Authorization', `Bearer ${agentToken}`);

      await request(app)
        .post(`/api/marking-jobs/${jobId}/complete`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          completionNotes: 'Completed',
          completionImages: ['https://example.com/image.jpg'],
          boundaryData: {
            type: 'Polygon',
            coordinates: [
              [
                [3.3792, 6.5244],
                [3.3793, 6.5244],
                [3.3793, 6.5245],
                [3.3792, 6.5245],
                [3.3792, 6.5244],
              ],
            ],
          },
        });

      // Simulate verification timeout by updating the verification deadline
      await prisma.propertyMarkingJob.update({
        where: { id: jobId },
        data: {
          maxCompletionTime: new Date(Date.now() - 1000), // Past deadline
        },
      });

      // Trigger timeout check
      const timeoutResponse = await request(app)
        .post('/api/marking-jobs/process-timeouts')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(timeoutResponse.status).toBe(200);

      // Verify agent received partial compensation
      const agentAccount = await prisma.virtualAccount.findFirst({
        where: { userId: agentId },
      });
      expect(agentAccount?.balance.toNumber()).toBeGreaterThanOrEqual(1000);
    });

    it('should handle verification with premium renter', async () => {
      // Create marking job
      const createResponse = await request(app)
        .post('/api/marking-jobs')
        .set('Authorization', `Bearer ${propertyOwnerToken}`)
        .send({
          propertyId,
          assignmentType: 'AGENT',
          contactPersonName: 'Test Contact',
          contactPersonPhone: '+2348044444444',
          urgencyLevel: 'NORMAL',
        });

      const jobId = createResponse.body.data.markingJob.id;

      // Process payment
      await request(app)
        .post(`/api/marking-jobs/${jobId}/payment/callback`)
        .send({
          status: 'successful',
          tx_ref: `MARKING-${jobId}`,
          transaction_id: '666666666',
          amount: 20000,
        });

      // Premium renter accepts job
      const acceptResponse = await request(app)
        .post(`/api/marking-jobs/${jobId}/accept`)
        .set('Authorization', `Bearer ${renterToken}`);

      expect(acceptResponse.status).toBe(200);

      // Renter completes marking
      await request(app)
        .post(`/api/marking-jobs/${jobId}/complete`)
        .set('Authorization', `Bearer ${renterToken}`)
        .send({
          completionNotes: 'Property marked by premium renter',
          completionImages: ['https://example.com/renter-image.jpg'],
          boundaryData: {
            type: 'Polygon',
            coordinates: [
              [
                [3.3792, 6.5244],
                [3.3793, 6.5244],
                [3.3793, 6.5245],
                [3.3792, 6.5245],
                [3.3792, 6.5244],
              ],
            ],
          },
        });

      // Property owner verifies
      await request(app)
        .post(`/api/marking-jobs/${jobId}/verify`)
        .set('Authorization', `Bearer ${propertyOwnerToken}`)
        .send({
          isApproved: true,
          verificationNotes: 'Good job!',
        });

      // Verify renter received payment
      const renterAccount = await prisma.virtualAccount.findFirst({
        where: { userId: renterId },
      });
      expect(renterAccount?.balance.toNumber()).toBeGreaterThan(0);
    });
  });

  describe('Verification Edge Cases', () => {
    it('should prevent duplicate verification', async () => {
      // Create and complete a marking job
      const createResponse = await request(app)
        .post('/api/marking-jobs')
        .set('Authorization', `Bearer ${propertyOwnerToken}`)
        .send({
          propertyId,
          assignmentType: 'AGENT',
          contactPersonName: 'Test',
          contactPersonPhone: '+2348055555555',
          urgencyLevel: 'NORMAL',
        });

      const jobId = createResponse.body.data.markingJob.id;

      await request(app)
        .post(`/api/marking-jobs/${jobId}/payment/callback`)
        .send({
          status: 'successful',
          tx_ref: `MARKING-${jobId}`,
          transaction_id: '777777777',
          amount: 20000,
        });

      await request(app)
        .post(`/api/marking-jobs/${jobId}/accept`)
        .set('Authorization', `Bearer ${agentToken}`);

      await request(app)
        .post(`/api/marking-jobs/${jobId}/complete`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          completionNotes: 'Done',
          completionImages: ['https://example.com/image.jpg'],
          boundaryData: {
            type: 'Polygon',
            coordinates: [
              [
                [3.3792, 6.5244],
                [3.3793, 6.5244],
                [3.3793, 6.5245],
                [3.3792, 6.5245],
                [3.3792, 6.5244],
              ],
            ],
          },
        });

      // First verification
      await request(app)
        .post(`/api/marking-jobs/${jobId}/verify`)
        .set('Authorization', `Bearer ${propertyOwnerToken}`)
        .send({
          isApproved: true,
          verificationNotes: 'Approved',
        });

      // Attempt duplicate verification
      const duplicateResponse = await request(app)
        .post(`/api/marking-jobs/${jobId}/verify`)
        .set('Authorization', `Bearer ${propertyOwnerToken}`)
        .send({
          isApproved: false,
          verificationNotes: 'Changed my mind',
        });

      expect(duplicateResponse.status).toBe(400);
      expect(duplicateResponse.body.error).toContain('already verified');
    });

    it('should prevent unauthorized verification', async () => {
      // Create marking job for one owner
      const createResponse = await request(app)
        .post('/api/marking-jobs')
        .set('Authorization', `Bearer ${propertyOwnerToken}`)
        .send({
          propertyId,
          assignmentType: 'AGENT',
          contactPersonName: 'Test',
          contactPersonPhone: '+2348066666666',
          urgencyLevel: 'NORMAL',
        });

      const jobId = createResponse.body.data.markingJob.id;

      await request(app)
        .post(`/api/marking-jobs/${jobId}/payment/callback`)
        .send({
          status: 'successful',
          tx_ref: `MARKING-${jobId}`,
          transaction_id: '888888888',
          amount: 20000,
        });

      await request(app)
        .post(`/api/marking-jobs/${jobId}/accept`)
        .set('Authorization', `Bearer ${agentToken}`);

      await request(app)
        .post(`/api/marking-jobs/${jobId}/complete`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          completionNotes: 'Done',
          completionImages: ['https://example.com/image.jpg'],
          boundaryData: {
            type: 'Polygon',
            coordinates: [
              [
                [3.3792, 6.5244],
                [3.3793, 6.5244],
                [3.3793, 6.5245],
                [3.3792, 6.5245],
                [3.3792, 6.5244],
              ],
            ],
          },
        });

      // Attempt verification by agent (not owner)
      const unauthorizedResponse = await request(app)
        .post(`/api/marking-jobs/${jobId}/verify`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          isApproved: true,
          verificationNotes: 'I approve my own work',
        });

      expect(unauthorizedResponse.status).toBe(403);
      expect(unauthorizedResponse.body.error).toContain('not authorized');
    });
  });
});