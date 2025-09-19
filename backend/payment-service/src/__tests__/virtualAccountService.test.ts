import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { PrismaClient, User, Property, VirtualAccount, TransactionStatus, TransactionType } from '@prisma/client';
import { VirtualAccountService } from '../services/virtualAccountService';
import { FlutterwaveVirtualAccountService } from '../services/flutterwaveVirtualAccountService';
import { VirtualAccountError } from '../utils/virtualAccountErrorHandler';
import { VIRTUAL_ACCOUNT_CONSTANTS } from '../../shared/src/constants/virtualAccount';

// Mock external dependencies
jest.mock('../services/flutterwaveVirtualAccountService');
jest.mock('../../shared/src/utils/virtualAccountLogger');

describe('VirtualAccountService', () => {
  let prisma: PrismaClient;
  let virtualAccountService: VirtualAccountService;
  let mockFlutterwaveService: jest.Mocked<FlutterwaveVirtualAccountService>;
  let testUser: User;
  let testProperty: Property;
  let testVirtualAccount: VirtualAccount;

  beforeAll(async () => {
    // Initialize test database connection
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/newcondo_test'
        }
      }
    });

    // Initialize mock Flutterwave service
    mockFlutterwaveService = new FlutterwaveVirtualAccountService() as jest.Mocked<FlutterwaveVirtualAccountService>;
    
    // Initialize service with mocked dependencies
    virtualAccountService = new VirtualAccountService(prisma, mockFlutterwaveService);
  });

  beforeEach(async () => {
    // Clean database before each test
    await prisma.transaction.deleteMany();
    await prisma.virtualAccount.deleteMany();
    await prisma.property.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    testUser = await prisma.user.create({
      data: {
        id: 'test-user-1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+2348123456789',
        role: 'OWNER',
        userType: 'LANDLORD',
        verificationStatus: 'VERIFIED'
      }
    });

    // Create test property
    testProperty = await prisma.property.create({
      data: {
        id: 'test-property-1',
        title: 'Test Property',
        description: 'A test property',
        price: 500000,
        address: '123 Test Street',
        city: 'Lagos',
        state: 'Lagos',
        country: 'Nigeria',
        propertyType: 'APARTMENT',
        ownerId: testUser.id,
        status: 'PUBLISHED',
        adminApprovalStatus: 'APPROVED'
      }
    });

    // Create a virtual account for reuse in other tests
    testVirtualAccount = await prisma.virtualAccount.create({
        data: {
          accountNumber: '1112223334',
          accountName: 'JOHN DOE/NEWCONDO',
          bankCode: '999',
          flutterwaveAccountId: 'fw-account-123-reusable',
          userId: testUser.id,
          propertyId: testProperty.id,
          balance: 10000
        }
      });

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('createVirtualAccount', () => {
    it('should create a virtual account for property owner', async () => {
      // Arrange
      // Clean up the pre-created test account to test creation
      await prisma.virtualAccount.deleteMany({ where: { userId: testUser.id } });
      const mockFlutterwaveResponse = {
        accountNumber: '0123456789',
        accountName: 'JOHN DOE/NEWCONDO',
        bankCode: '999',
        flutterwaveAccountId: 'fw-account-123'
      };

      mockFlutterwaveService.createVirtualAccount.mockResolvedValue(mockFlutterwaveResponse);

      // Act
      const result = await virtualAccountService.createVirtualAccount({
        userId: testUser.id,
        propertyId: testProperty.id,
        accountType: VIRTUAL_ACCOUNT_CONSTANTS.ACCOUNT_TYPES.PROPERTY_OWNER
      });

      // Assert
      expect(result).toHaveProperty('id');
      expect(result.accountNumber).toBe('0123456789');
      expect(result.accountName).toBe('JOHN DOE/NEWCONDO');
      expect(result.userId).toBe(testUser.id);
      expect(result.propertyId).toBe(testProperty.id);
      expect(result.balance).toEqual(0);
      expect(result.isActive).toBe(true);
      
      expect(mockFlutterwaveService.createVirtualAccount).toHaveBeenCalledWith({
        email: testUser.email,
        firstName: 'John',
        lastName: 'Doe',
        phone: testUser.phone,
        accountType: 'PROPERTY_OWNER',
        propertyId: testProperty.id
      });
    });

    it('should create a virtual account for agent', async () => {
      // Arrange
      const agentUser = await prisma.user.create({
        data: {
          id: 'test-agent-1',
          name: 'Jane Agent',
          email: 'jane.agent@example.com',
          phone: '+2348123456790',
          role: 'AGENT',
          userType: 'AGENT',
          verificationStatus: 'VERIFIED'
        }
      });
      await prisma.virtualAccount.deleteMany({ where: { userId: agentUser.id } });

      const mockFlutterwaveResponse = {
        accountNumber: '0123456790',
        accountName: 'JANE AGENT/NEWCONDO/AGENT',
        bankCode: '999',
        flutterwaveAccountId: 'fw-agent-123'
      };

      mockFlutterwaveService.createVirtualAccount.mockResolvedValue(mockFlutterwaveResponse);

      // Act
      const result = await virtualAccountService.createVirtualAccount({
        userId: agentUser.id,
        accountType: VIRTUAL_ACCOUNT_CONSTANTS.ACCOUNT_TYPES.AGENT
      });

      // Assert
      expect(result.accountName).toBe('JANE AGENT/NEWCONDO/AGENT');
      expect(result.userId).toBe(agentUser.id);
      expect(result.propertyId).toBeNull();
    });

    it('should throw error if user already has virtual account', async () => {
      // Arrange
      await prisma.virtualAccount.create({
        data: {
          id: 'existing-account',
          accountNumber: '0123456789',
          accountName: 'JOHN DOE/NEWCONDO',
          bankCode: '999',
          userId: testUser.id,
          propertyId: testProperty.id
        }
      });

      // Act & Assert
      await expect(
        virtualAccountService.createVirtualAccount({
          userId: testUser.id,
          propertyId: testProperty.id,
          accountType: VIRTUAL_ACCOUNT_CONSTANTS.ACCOUNT_TYPES.PROPERTY_OWNER
        })
      ).rejects.toThrow(VirtualAccountError);
    });
  });

  //-------------------------------------------------------------------------------------------------

  describe('handleIncomingWebhook', () => {
    it('should process a successful charge webhook and update balance', async () => {
      // Arrange
      const initialBalance = testVirtualAccount.balance;
      const creditAmount = 5000;
      const mockWebhookPayload = {
        event: 'charge.completed',
        data: {
          id: 987654,
          tx_ref: 'NC-TXN-12345',
          amount: creditAmount,
          currency: 'NGN',
          status: 'successful',
          account_number: testVirtualAccount.accountNumber,
          narration: 'Rent payment'
        }
      };

      // Act
      await virtualAccountService.handleIncomingWebhook(mockWebhookPayload);

      // Assert
      const updatedAccount = await prisma.virtualAccount.findUnique({
        where: { id: testVirtualAccount.id }
      });
      const newTransaction = await prisma.transaction.findFirst({
        where: { virtualAccountId: testVirtualAccount.id, type: TransactionType.CREDIT }
      });

      expect(updatedAccount?.balance).toBe(initialBalance + creditAmount);
      expect(newTransaction).not.toBeNull();
      expect(newTransaction?.amount).toBe(creditAmount);
      expect(newTransaction?.status).toBe(TransactionStatus.SUCCESS);
    });

    it('should not update balance for a failed webhook', async () => {
      // Arrange
      const initialBalance = testVirtualAccount.balance;
      const mockWebhookPayload = {
        event: 'charge.completed',
        data: {
          id: 987654,
          tx_ref: 'NC-TXN-12345',
          amount: 5000,
          currency: 'NGN',
          status: 'failed',
          account_number: testVirtualAccount.accountNumber,
          narration: 'Rent payment'
        }
      };

      // Act
      await virtualAccountService.handleIncomingWebhook(mockWebhookPayload);

      // Assert
      const updatedAccount = await prisma.virtualAccount.findUnique({
        where: { id: testVirtualAccount.id }
      });
      const newTransaction = await prisma.transaction.findFirst({
        where: { virtualAccountId: testVirtualAccount.id }
      });

      expect(updatedAccount?.balance).toBe(initialBalance);
      expect(newTransaction).not.toBeNull();
      expect(newTransaction?.status).toBe(TransactionStatus.FAILED);
    });

    it('should throw an error for an invalid account number', async () => {
      // Arrange
      const mockWebhookPayload = {
        event: 'charge.completed',
        data: {
          id: 987654,
          tx_ref: 'NC-TXN-12345',
          amount: 5000,
          currency: 'NGN',
          status: 'successful',
          account_number: '9999999999', // Invalid account
          narration: 'Rent payment'
        }
      };

      // Act & Assert
      await expect(virtualAccountService.handleIncomingWebhook(mockWebhookPayload)).rejects.toThrow(VirtualAccountError);
    });
  });

  //-------------------------------------------------------------------------------------------------

  describe('transferFunds', () => {
    it('should successfully transfer funds and update balances', async () => {
      // Arrange
      const transferAmount = 5000;
      const initialBalance = testVirtualAccount.balance;
      const recipientBank = '044';
      const recipientAccountNumber = '0123456789';
      
      mockFlutterwaveService.transferFunds.mockResolvedValue({ status: 'success', data: { status: 'successful' } });

      // Act
      await virtualAccountService.transferFunds({
        sourceAccountId: testVirtualAccount.id,
        recipientBank,
        recipientAccountNumber,
        amount: transferAmount
      });

      // Assert
      const updatedAccount = await prisma.virtualAccount.findUnique({
        where: { id: testVirtualAccount.id }
      });
      const newTransaction = await prisma.transaction.findFirst({
        where: { virtualAccountId: testVirtualAccount.id, type: TransactionType.DEBIT }
      });
      
      expect(updatedAccount?.balance).toBe(initialBalance - transferAmount);
      expect(newTransaction).not.toBeNull();
      expect(newTransaction?.status).toBe(TransactionStatus.SUCCESS);
      expect(mockFlutterwaveService.transferFunds).toHaveBeenCalled();
    });

    it('should throw an error if the source account has insufficient funds', async () => {
      // Arrange
      const transferAmount = 15000; // Greater than initial balance
      const recipientBank = '044';
      const recipientAccountNumber = '0123456789';
      
      // Act & Assert
      await expect(
        virtualAccountService.transferFunds({
          sourceAccountId: testVirtualAccount.id,
          recipientBank,
          recipientAccountNumber,
          amount: transferAmount
        })
      ).rejects.toThrow(VirtualAccountError);
      
      // Ensure Flutterwave service was not called
      expect(mockFlutterwaveService.transferFunds).not.toHaveBeenCalled();
    });

    it('should not update balance if the transfer fails on Flutterwave', async () => {
      // Arrange
      const transferAmount = 5000;
      const initialBalance = testVirtualAccount.balance;

      mockFlutterwaveService.transferFunds.mockResolvedValue({ status: 'error', message: 'Transfer failed', data: { status: 'failed' } });

      // Act
      await virtualAccountService.transferFunds({
        sourceAccountId: testVirtualAccount.id,
        recipientBank: '044',
        recipientAccountNumber: '0123456789',
        amount: transferAmount
      });

      // Assert
      const updatedAccount = await prisma.virtualAccount.findUnique({
        where: { id: testVirtualAccount.id }
      });
      const newTransaction = await prisma.transaction.findFirst({
        where: { virtualAccountId: testVirtualAccount.id, type: TransactionType.DEBIT }
      });

      expect(updatedAccount?.balance).toBe(initialBalance); // Balance should not change
      expect(newTransaction).not.toBeNull();
      expect(newTransaction?.status).toBe(TransactionStatus.FAILED);
      expect(mockFlutterwaveService.transferFunds).toHaveBeenCalled();
    });
  });

  //-------------------------------------------------------------------------------------------------

  describe('reconcileAccount', () => {
    it('should return a matched status if balances are in sync', async () => {
      // Arrange
      const localBalance = testVirtualAccount.balance;
      mockFlutterwaveService.getAccountBalance.mockResolvedValue({ balance: localBalance, currency: 'NGN' });

      // Act
      const reconciliationReport = await virtualAccountService.reconcileAccount(testVirtualAccount.id);

      // Assert
      expect(reconciliationReport.status).toBe('MATCHED');
      expect(reconciliationReport.platformBalance).toBe(localBalance);
      expect(reconciliationReport.flutterwaveBalance).toBe(localBalance);
      expect(reconciliationReport.discrepancy).toBe(0);
    });

    it('should return a discrepancy status if balances are out of sync', async () => {
      // Arrange
      const localBalance = testVirtualAccount.balance;
      const flutterwaveBalance = localBalance + 500;
      mockFlutterwaveService.getAccountBalance.mockResolvedValue({ balance: flutterwaveBalance, currency: 'NGN' });

      // Act
      const reconciliationReport = await virtualAccountService.reconcileAccount(testVirtualAccount.id);

      // Assert
      expect(reconciliationReport.status).toBe('DISCREPANCY');
      expect(reconciliationReport.platformBalance).toBe(localBalance);
      expect(reconciliationReport.flutterwaveBalance).toBe(flutterwaveBalance);
      expect(reconciliationReport.discrepancy).toBe(500);
    });
  });
});