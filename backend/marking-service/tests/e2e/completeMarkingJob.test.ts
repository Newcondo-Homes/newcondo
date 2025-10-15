import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';
import { generateTestToken } from '../helpers/authHelper';
import { createTestUser, createTestProperty } from '../helpers/testDataFactory';

const prisma = new PrismaClient();

describe('Complete Property Marking Job E2E Tests', () => {
  let propertyOwnerToken: string;
  let propertyOwnerId: string;
  let agent1Token: string;
  let agent1Id: string;
  let agent2Token: string;
  let agent2Id: string;
  let propertyId: string;

  beforeAll(async () => {
    // Clean up
    await prisma.propertyMarkingJob.deleteMany();
    await prisma.virtualAccount.deleteMany();
    await prisma.property.deleteMany();
    await prisma.user.deleteMany();

    // Create property owner
    const owner = await createTestUser({
      role: 'OWNER',
      userType: 'LANDLORD',
      email: 'owner-e2e@test.com',
      phone: '+2348090000001',
      state: 'Lagos',
      city: 'Ikeja',
    });
    propertyOwnerId = owner.id;
    propertyOwnerToken = generateTestToken(owner);

    // Create agents
    const agent1 = await createTestUser({
      role: 'AGENT',
      userType: 'AGENT',
      email: 'agent1-e2e@test.com',
      phone: '+2348090000002',
      isAvailableForMarking: true,
      agentServiceAreas: ['Lagos', 'Ikeja'],
      state: 'Lagos',
      city: 'Ikeja',
    });
    agent1Id = agent1.id;
    agent1Token = generateTestToken(agent1);

    const agent2 = await createTestUser({
      role: 'AGENT',
      userType: 'AGENT',
      email: 'agent2-e2e@test.com',
      phone: '+2348090000003',
      isAvailableForMarking: true,
      agentServiceAreas: ['Lagos', 'Ikeja'],
      state: 'Lagos',
      city: 'Ikeja',
    });
    agent2Id = agent2.id;
    agent2Token = generateTestToken(agent2);

    // Create virtual accounts
    await prisma.virtualAccount.createMany({
      data: [
        {
          userId: propertyOwnerId,
          accountNumber: '1111111111',
          accountName: 'Owner E2E Account',
          bankCode: '044',
          balance: 50000,
        },
        {
          userId: agent1Id,
          accountNumber: '2222222222',
          accountName: 'Agent 1 E2E Account',
          bankCode: '044',
          balance: 0,
        },
        {
          userId: agent2Id,
          accountNumber: '3333333333',
          accountName: 'Agent 2 E2E Account',
          bankCode: '044',
          balance: 0,
        },
      ],
    });

    // Create property
    const property = await createTestProperty({
      ownerId: propertyOwnerId,
      title: 'E2E Test Property',
      address: '456 E2E Test Street',
      city: 'Ikeja',
      state: 'Lagos',
      gpsCoordinates: JSON.stringify({ lat: 6.6018, lng: 3.3515 }),
    });
    propertyId = property.id;
  });

  afterAll(async () => {
    await prisma.propertyMarkingJob.deleteMany();
    await prisma.virtualAccount.deleteMany();
    await prisma.property.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('Complete Marking Job Flow - Happy Path', () => {
    it('should complete entire marking job workflow successfully', async () => {
      // Step 1: Property owner initiates marking job
      console.log('Step 1: Creating marking job...');
      const createJobResponse = await request(app)
        .post('/api/marking-jobs')
        .set('Authorization', `Bearer ${propertyOwnerToken}`)
        .send({
          propertyId,
          assignmentType: 'AGENT',
          contactPersonName: 'John Coordinator',
          contactPersonPhone: '+2348011112222',
          accessInstructions: 'Gate code is 1234. Ask for the landlord.',
          preferredTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          urgencyLevel: 'NORMAL',
        });

      expect(createJobResponse.status).toBe(201);
      expect(createJobResponse.body.success).toBe(true);
      
      const markingJobId = createJobResponse.body.data.markingJob.id;
      const paymentLink = createJobResponse.body.data.paymentLink;

      console.log('Marking job created:', markingJobId);

      // Verify job is in PENDING state
      let markingJob = await prisma.propertyMarkingJob.findUnique({
        where: { id: markingJobId },
      });
      expect(markingJob?.status).toBe('QUEUED');
      expect(markingJob?.paymentStatus).toBe('PENDING');

      // Step 2: Process payment via Flutterwave webhook
      console.log('Step 2: Processing payment...');
      const paymentResponse = await request(app)
        .post(`/api/marking-jobs/${markingJobId}/payment/callback`)
        .send({
          status: 'successful',
          tx_ref: `MARKING-${markingJobId}`,
          transaction_id: `TXN-E2E-${Date.now()}`,
          amount: 20000,
          currency: 'NGN',
          customer: {
            email: 'owner-e2e@test.com',
            phone_number: '+2348090000001',
          },
        });

      expect(paymentResponse.status).toBe(200);
      expect(paymentResponse.body.message).toContain('successfully');

      // Verify payment updated
      markingJob = await prisma.propertyMarkingJob.findUnique({
        where: { id: markingJobId },
      });
      expect(markingJob?.paymentStatus).toBe('SUCCESS');

      // Step 3: First agent accepts the job
      console.log('Step 3: Agent 1 accepting job...');
      const agent1AcceptResponse = await request(app)
        .post(`/api/marking-jobs/${markingJobId}/accept`)
        .set('Authorization', `Bearer ${agent1Token}`);

      expect(agent1AcceptResponse.status).toBe(200);
      expect(agent1AcceptResponse.body.data.status).toBe('ASSIGNED');
      expect(agent1AcceptResponse.body.data.assignedAgentId).toBe(agent1Id);

      // Step 4: Second agent tries to accept (should fail - already assigned)
      console.log('Step 4: Agent 2 attempting to accept (should fail)...');
      const agent2AcceptResponse = await request(app)
        .post(`/api/marking-jobs/${markingJobId}/accept`)
        .set('Authorization', `Bearer ${agent2Token}`);

      expect(agent2AcceptResponse.status).toBe(400);
      expect(agent2AcceptResponse.body.error).toContain('already assigned');

      // Step 5: Agent 1 completes the marking
      console.log('Step 5: Agent 1 completing marking job...');
      const completeResponse = await request(app)
        .post(`/api/marking-jobs/${markingJobId}/complete`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .send({
          completionNotes: 'Successfully marked the property. All boundaries clearly identified.',
          completionImages: [
            'https://cloudinary.com/images/front-view.jpg',
            'https://cloudinary.com/images/side-view.jpg',
            'https://cloudinary.com/images/back-view.jpg',
            'https://cloudinary.com/images/interior-living.jpg',
          ],
          boundaryData: {
            type: 'Polygon',
            coordinates: [
              [
                [3.3515, 6.6018],
                [3.3516, 6.6018],
                [3.3516, 6.6019],
                [3.3515, 6.6019],
                [3.3515, 6.6018],
              ],
            ],
          },
        });

      expect(completeResponse.status).toBe(200);
      expect(completeResponse.body.success).toBe(true);
      expect(completeResponse.body.data.status).toBe('COMPLETED');

      // Verify partial payment sent to agent
      const agent1Account = await prisma.virtualAccount.findFirst({
        where: { userId: agent1Id },
      });
      expect(agent1Account?.balance.toNumber()).toBe(1000); // Initial partial payment

      // Step 6: Property owner verifies and approves the marking
      console.log('Step 6: Property owner verifying marking...');
      const verifyResponse = await request(app)
        .post(`/api/marking-jobs/${markingJobId}/verify`)
        .set('Authorization', `Bearer ${propertyOwnerToken}`)
        .send({
          isApproved: true,
          verificationNotes: 'Excellent work! Boundaries are accurate.',
        });

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.success).toBe(true);

      // Step 7: Verify final state
      console.log('Step 7: Verifying final state...');
      
      // Check marking job status
      markingJob = await prisma.propertyMarkingJob.findUnique({
        where: { id: markingJobId },
        include: {
          property: true,
          assignedAgent: true,
        },
      });

      expect(markingJob?.status).toBe('COMPLETED');
      expect(markingJob?.completedAt).toBeTruthy();

      // Check property boundary updated
      const updatedProperty = await prisma.property.findUnique({
        where: { id: propertyId },
      });

      expect(updatedProperty?.boundaryVerified).toBe(true);
      expect(updatedProperty?.boundaryMarkedBy).toBe(agent1Id);
      expect(updatedProperty?.boundaryMarkedAt).toBeTruthy();
      expect(updatedProperty?.boundaryCoordinates).toBeTruthy();
      expect(updatedProperty?.boundaryImages).toHaveLength(4);

      // Check full payment released to agent
      const agent1FinalAccount = await prisma.virtualAccount.findFirst({
        where: { userId: agent1Id },
      });
      const expectedTotal = 20000 * 0.25; // 25% of 20,000 = 5,000
      expect(agent1FinalAccount?.balance.toNumber()).toBeCloseTo(expectedTotal, 0);

      // Check agent stats updated
      const updatedAgent = await prisma.user.findUnique({
        where: { id: agent1Id },
      });
      expect(updatedAgent?.completedMarkingJobs).toBe(1);
      expect(updatedAgent?.totalMarkingJobs).toBe(1);

      console.log('✓ Complete marking job flow successful!');
    });
  });

  describe('Complete Marking Job Flow - Queue System', () => {
    it('should handle queue system with multiple agents and time slots', async () => {
      // Create marking job
      console.log('Creating marking job with queue system...');
      const createResponse = await request(app)
        .post('/api/marking-jobs')
        .set('Authorization', `Bearer ${propertyOwnerToken}`)
        .send({
          propertyId,
          assignmentType: 'AGENT',
          contactPersonName: 'Queue Test Contact',
          contactPersonPhone: '+2348099999999',
          accessInstructions: 'Testing queue system',
          urgencyLevel: 'HIGH',
        });

      const jobId = createResponse.body.data.markingJob.id;

      // Process payment
      await request(app)
        .post(`/api/marking-jobs/${jobId}/payment/callback`)
        .send({
          status: 'successful',
          tx_ref: `MARKING-${jobId}`,
          transaction_id: `TXN-QUEUE-${Date.now()}`,
          amount: 20000,
        });

      // Agent 1 accepts (first in queue)
      console.log('Agent 1 accepting job...');
      const agent1Response = await request(app)
        .post(`/api/marking-jobs/${jobId}/accept`)
        .set('Authorization', `Bearer ${agent1Token}`);

      expect(agent1Response.status).toBe(200);
      expect(agent1Response.body.data.queuePosition).toBe(1);

      // Verify time slot assigned (3 hours)
      const job = await prisma.propertyMarkingJob.findUnique({
        where: { id: jobId },
      });
      expect(job?.timeSlotExpiry).toBeTruthy();
      const timeSlotDuration = job?.timeSlotExpiry!.getTime() - new Date().getTime();
      expect(timeSlotDuration).toBeGreaterThan(2.9 * 60 * 60 * 1000); // ~3 hours
      expect(timeSlotDuration).toBeLessThan(3.1 * 60 * 60 * 1000);

      // Agent 1 completes within time slot
      console.log('Agent 1 completing job within time slot...');
      const completeResponse = await request(app)
        .post(`/api/marking-jobs/${jobId}/complete`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .send({
          completionNotes: 'Completed on time',
          completionImages: ['https://example.com/queue-test.jpg'],
          boundaryData: {
            type: 'Polygon',
            coordinates: [
              [
                [3.3515, 6.6018],
                [3.3516, 6.6018],
                [3.3516, 6.6019],
                [3.3515, 6.6019],
                [3.3515, 6.6018],
              ],
            ],
          },
        });

      expect(completeResponse.status).toBe(200);

      // Verify partial payment
      const agent1Account = await prisma.virtualAccount.findFirst({
        where: { userId: agent1Id },
      });
      const initialBalance = agent1Account?.balance.toNumber() || 0;
      expect(initialBalance).toBeGreaterThanOrEqual(1000);

      // Owner verifies
      await request(app)
        .post(`/api/marking-jobs/${jobId}/verify`)
        .set('Authorization', `Bearer ${propertyOwnerToken}`)
        .send({
          isApproved: true,
          verificationNotes: 'Great job!',
        });

      // Verify full payment released
      const agent1FinalAccount = await prisma.virtualAccount.findFirst({
        where: { userId: agent1Id },
      });
      expect(agent1FinalAccount?.balance.toNumber()).toBeGreaterThan(initialBalance);

      console.log('✓ Queue system test successful!');
    });

    it('should handle time slot expiration and reassignment', async () => {
      // Create marking job
      const createResponse = await request(app)
        .post('/api/marking-jobs')
        .set('Authorization', `Bearer ${propertyOwnerToken}`)
        .send({
          propertyId,
          assignmentType: 'AGENT',
          contactPersonName: 'Timeout Test',
          contactPersonPhone: '+2348088888888',
          urgencyLevel: 'NORMAL',
        });

      const jobId = createResponse.body.data.markingJob.id;

      // Process payment
      await request(app)
        .post(`/api/marking-jobs/${jobId}/payment/callback`)
        .send({
          status: 'successful',
          tx_ref: `MARKING-${jobId}`,
          transaction_id: `TXN-TIMEOUT-${Date.now()}`,
          amount: 20000,
        });

      // Agent 1 accepts
      await request(app)
        .post(`/api/marking-jobs/${jobId}/accept`)
        .set('Authorization', `Bearer ${agent1Token}`);

      // Manually expire the time slot
      await prisma.propertyMarkingJob.update({
        where: { id: jobId },
        data: {
          timeSlotExpiry: new Date(Date.now() - 1000), // Expired 1 second ago
        },
      });

      // Process timeouts (this would normally be a cron job)
      const timeoutResponse = await request(app)
        .post('/api/marking-jobs/process-timeouts')
        .set('Authorization', `Bearer ${agent1Token}`);

      expect(timeoutResponse.status).toBe(200);

      // Verify job is back in queue
      const job = await prisma.propertyMarkingJob.findUnique({
        where: { id: jobId },
      });
      expect(job?.status).toBe('QUEUED');
      expect(job?.assignedAgentId).toBeNull();

      // Agent 2 can now accept
      const agent2Response = await request(app)
        .post(`/api/marking-jobs/${jobId}/accept`)
        .set('Authorization', `Bearer ${agent2Token}`);

      expect(agent2Response.status).toBe(200);
      expect(agent2Response.body.data.assignedAgentId).toBe(agent2Id);

      console.log('✓ Time slot expiration test successful!');
    });
  });

  describe('Complete Marking Job Flow - Rejection and Retry', () => {
    it('should handle owner rejection and compensation flow', async () => {
      // Create marking job
      const createResponse = await request(app)
        .post('/api/marking-jobs')
        .set('Authorization', `Bearer ${propertyOwnerToken}`)
        .send({
          propertyId,
          assignmentType: 'AGENT',
          contactPersonName: 'Rejection Test',
          contactPersonPhone: '+2348077777777',
          urgencyLevel: 'NORMAL',
        });

      const jobId = createResponse.body.data.markingJob.id;

      // Process payment
      await request(app)
        .post(`/api/marking-jobs/${jobId}/payment/callback`)
        .send({
          status: 'successful',
          tx_ref: `MARKING-${jobId}`,
          transaction_id: `TXN-REJECT-${Date.now()}`,
          amount: 20000,
        });

      // Agent accepts and completes
      await request(app)
        .post(`/api/marking-jobs/${jobId}/accept`)
        .set('Authorization', `Bearer ${agent1Token}`);

      await request(app)
        .post(`/api/marking-jobs/${jobId}/complete`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .send({
          completionNotes: 'Marked the property',
          completionImages: ['https://example.com/reject-test.jpg'],
          boundaryData: {
            type: 'Polygon',
            coordinates: [
              [
                [3.3515, 6.6018],
                [3.3516, 6.6018],
                [3.3516, 6.6019],
                [3.3515, 6.6019],
                [3.3515, 6.6018],
              ],
            ],
          },
        });

      const agent1BalanceBefore = (
        await prisma.virtualAccount.findFirst({
          where: { userId: agent1Id },
        })
      )?.balance.toNumber() || 0;

      // Owner rejects
      const rejectResponse = await request(app)
        .post(`/api/marking-jobs/${jobId}/verify`)
        .set('Authorization', `Bearer ${propertyOwnerToken}`)
        .send({
          isApproved: false,
          verificationNotes: 'Wrong property marked',
        });

      expect(rejectResponse.status).toBe(200);

      // Verify agent still got partial compensation
      const agent1BalanceAfter = (
        await prisma.virtualAccount.findFirst({
          where: { userId: agent1Id },
        })
      )?.balance.toNumber() || 0;

      expect(agent1BalanceAfter).toBe(agent1BalanceBefore); // Partial payment already given

      // Verify property NOT updated
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
      });
      expect(property?.boundaryVerified).toBe(false);

      console.log('✓ Rejection and compensation test successful!');
    });
  });

  describe('Complete Marking Job Flow - Multiple Verification Timeouts', () => {
    it('should handle multiple verification timeouts with incremental compensation', async () => {
      // Create marking job
      const createResponse = await request(app)
        .post('/api/marking-jobs')
        .set('Authorization', `Bearer ${propertyOwnerToken}`)
        .send({
          propertyId,
          assignmentType: 'AGENT',
          contactPersonName: 'Multiple Timeout Test',
          contactPersonPhone: '+2348066666666',
          urgencyLevel: 'NORMAL',
        });

      const jobId = createResponse.body.data.markingJob.id;

      // Process payment
      await request(app)
        .post(`/api/marking-jobs/${jobId}/payment/callback`)
        .send({
          status: 'successful',
          tx_ref: `MARKING-${jobId}`,
          transaction_id: `TXN-MULTI-${Date.now()}`,
          amount: 20000,
        });

      let totalAgentCompensation = 0;

      // Simulate multiple timeout cycles
      for (let i = 0; i < 3; i++) {
        console.log(`Timeout cycle ${i + 1}...`);

        // Agent accepts and completes
        await request(app)
          .post(`/api/marking-jobs/${jobId}/accept`)
          .set('Authorization', `Bearer ${agent1Token}`);

        await request(app)
          .post(`/api/marking-jobs/${jobId}/complete`)
          .set('Authorization', `Bearer ${agent1Token}`)
          .send({
            completionNotes: `Attempt ${i + 1}`,
            completionImages: [`https://example.com/attempt-${i + 1}.jpg`],
            boundaryData: {
              type: 'Polygon',
              coordinates: [
                [
                  [3.3515, 6.6018],
                  [3.3516, 6.6018],
                  [3.3516, 6.6019],
                  [3.3515, 6.6019],
                  [3.3515, 6.6018],
                ],
              ],
            },
          });

        // Simulate verification timeout
        await prisma.propertyMarkingJob.update({
          where: { id: jobId },
          data: {
            maxCompletionTime: new Date(Date.now() - 1000),
          },
        });

        // Process timeout
        await request(app)
          .post('/api/marking-jobs/process-timeouts')
          .set('Authorization', `Bearer ${agent1Token}`);

        totalAgentCompensation += 1000; // Each timeout gives partial compensation
      }

      // Verify agent received incremental compensation
      const agent1Account = await prisma.virtualAccount.findFirst({
        where: { userId: agent1Id },
      });

      expect(agent1Account?.balance.toNumber()).toBeGreaterThanOrEqual(
        totalAgentCompensation
      );

      console.log('✓ Multiple timeout compensation test successful!');
    });
  });

  describe('Complete Marking Job Flow - Self Marking', () => {
    it('should handle property owner self-marking', async () => {
      // Create marking job with self-marking option
      const createResponse = await request(app)
        .post('/api/marking-jobs')
        .set('Authorization', `Bearer ${propertyOwnerToken}`)
        .send({
          propertyId,
          assignmentType: 'SELF',
          contactPersonName: propertyOwnerToken, // Owner's own name
          contactPersonPhone: '+2348090000001',
          urgencyLevel: 'NORMAL',
        });

      expect(createResponse.status).toBe(201);
      const jobId = createResponse.body.data.markingJob.id;

      // Verify no payment required for self-marking
      const job = await prisma.propertyMarkingJob.findUnique({
        where: { id: jobId },
      });
      expect(job?.markingFee.toNumber()).toBe(0);
      expect(job?.paymentStatus).toBe('SUCCESS'); // Auto-success for self

      // Owner completes marking themselves
      const completeResponse = await request(app)
        .post(`/api/marking-jobs/${jobId}/complete`)
        .set('Authorization', `Bearer ${propertyOwnerToken}`)
        .send({
          completionNotes: 'Self-marked my property',
          completionImages: [
            'https://example.com/self-front.jpg',
            'https://example.com/self-back.jpg',
          ],
          boundaryData: {
            type: 'Polygon',
            coordinates: [
              [
                [3.3515, 6.6018],
                [3.3516, 6.6018],
                [3.3516, 6.6019],
                [3.3515, 6.6019],
                [3.3515, 6.6018],
              ],
            ],
          },
        });

      expect(completeResponse.status).toBe(200);

      // Verify property updated immediately (no verification needed for self-marking)
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
      });
      expect(property?.boundaryVerified).toBe(true);
      expect(property?.boundaryMarkedBy).toBe(propertyOwnerId);

      console.log('✓ Self-marking test successful!');
    });
  });

  describe('Complete Marking Job Flow - Error Scenarios', () => {
    it('should handle payment failure gracefully', async () => {
      // Create marking job
      const createResponse = await request(app)
        .post('/api/marking-jobs')
        .set('Authorization', `Bearer ${propertyOwnerToken}`)
        .send({
          propertyId,
          assignmentType: 'AGENT',
          contactPersonName: 'Payment Fail Test',
          contactPersonPhone: '+2348055555555',
          urgencyLevel: 'NORMAL',
        });

      const jobId = createResponse.body.data.markingJob.id;

      // Simulate failed payment
      const paymentResponse = await request(app)
        .post(`/api/marking-jobs/${jobId}/payment/callback`)
        .send({
          status: 'failed',
          tx_ref: `MARKING-${jobId}`,
          transaction_id: `TXN-FAIL-${Date.now()}`,
          amount: 20000,
        });

      expect(paymentResponse.status).toBe(200);

      // Verify job status
      const job = await prisma.propertyMarkingJob.findUnique({
        where: { id: jobId },
      });
      expect(job?.paymentStatus).toBe('FAILED');
      expect(job?.status).toBe('QUEUED'); // Still queued but can't be assigned

      // Agent should not be able to accept
      const acceptResponse = await request(app)
        .post(`/api/marking-jobs/${jobId}/accept`)
        .set('Authorization', `Bearer ${agent1Token}`);

      expect(acceptResponse.status).toBe(400);
      expect(acceptResponse.body.error).toContain('payment');

      console.log('✓ Payment failure handling test successful!');
    });

    it('should handle concurrent completion attempts', async () => {
      // Create and setup marking job
      const createResponse = await request(app)
        .post('/api/marking-jobs')
        .set('Authorization', `Bearer ${propertyOwnerToken}`)
        .send({
          propertyId,
          assignmentType: 'AGENT',
          contactPersonName: 'Concurrent Test',
          contactPersonPhone: '+2348044444444',
          urgencyLevel: 'NORMAL',
        });

      const jobId = createResponse.body.data.markingJob.id;

      await request(app)
        .post(`/api/marking-jobs/${jobId}/payment/callback`)
        .send({
          status: 'successful',
          tx_ref: `MARKING-${jobId}`,
          transaction_id: `TXN-CONCURRENT-${Date.now()}`,
          amount: 20000,
        });

      await request(app)
        .post(`/api/marking-jobs/${jobId}/accept`)
        .set('Authorization', `Bearer ${agent1Token}`);

      // Simulate concurrent completion attempts
      const completionData = {
        completionNotes: 'Concurrent attempt',
        completionImages: ['https://example.com/concurrent.jpg'],
        boundaryData: {
          type: 'Polygon',
          coordinates: [
            [
              [3.3515, 6.6018],
              [3.3516, 6.6018],
              [3.3516, 6.6019],
              [3.3515, 6.6019],
              [3.3515, 6.6018],
            ],
          ],
        },
      };

      const [response1, response2] = await Promise.all([
        request(app)
          .post(`/api/marking-jobs/${jobId}/complete`)
          .set('Authorization', `Bearer ${agent1Token}`)
          .send(completionData),
        request(app)
          .post(`/api/marking-jobs/${jobId}/complete`)
          .set('Authorization', `Bearer ${agent1Token}`)
          .send(completionData),
      ]);

      // One should succeed, one should fail
      const successCount = [response1, response2].filter(r => r.status === 200).length;
      const failCount = [response1, response2].filter(r => r.status !== 200).length;

      expect(successCount).toBe(1);
      expect(failCount).toBe(1);

      console.log('✓ Concurrent completion handling test successful!');
    });
  });

  describe('Complete Marking Job Flow - Notifications', () => {
    it('should verify notifications are sent at each stage', async () => {
      // Create marking job
      const createResponse = await request(app)
        .post('/api/marking-jobs')
        .set('Authorization', `Bearer ${propertyOwnerToken}`)
        .send({
          propertyId,
          assignmentType: 'AGENT',
          contactPersonName: 'Notification Test',
          contactPersonPhone: '+2348033333333',
          urgencyLevel: 'HIGH',
        });

      const jobId = createResponse.body.data.markingJob.id;

      // Check notification log (would be in EventLog or notification service)
      let events = await prisma.eventLog.findMany({
        where: {
          type: 'MARKING_JOB_CREATED',
          metadata: {
            path: ['markingJobId'],
            equals: jobId,
          },
        },
      });
      expect(events.length).toBeGreaterThan(0);

      // Process payment
      await request(app)
        .post(`/api/marking-jobs/${jobId}/payment/callback`)
        .send({
          status: 'successful',
          tx_ref: `MARKING-${jobId}`,
          transaction_id: `TXN-NOTIFY-${Date.now()}`,
          amount: 20000,
        });

      events = await prisma.eventLog.findMany({
        where: {
          type: 'MARKING_JOB_PAYMENT_SUCCESS',
          metadata: {
            path: ['markingJobId'],
            equals: jobId,
          },
        },
      });
      expect(events.length).toBeGreaterThan(0);

      // Agent accepts
      await request(app)
        .post(`/api/marking-jobs/${jobId}/accept`)
        .set('Authorization', `Bearer ${agent1Token}`);

      events = await prisma.eventLog.findMany({
        where: {
          type: 'MARKING_JOB_ACCEPTED',
          metadata: {
            path: ['markingJobId'],
            equals: jobId,
          },
        },
      });
      expect(events.length).toBeGreaterThan(0);

      console.log('✓ Notification tracking test successful!');
    });
  });
});