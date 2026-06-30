import { Request, Response } from 'express';
import { jest } from '@jest/globals';
import { VirtualAccountController } from '../controllers/virtualAccountController';
import { VirtualAccountService } from '../services/virtualAccountService';
import { FlutterwaveVirtualAccountService } from '../services/flutterwaveVirtualAccountService';
import { virtualAccountLogger } from '../utils/virtualAccountLogger';
import { VirtualAccountErrorHandler } from '../utils/virtualAccountErrorHandler';

// Mock dependencies
jest.mock('../services/virtualAccountService');
jest.mock('../services/flutterwaveVirtualAccountService');
jest.mock('../utils/virtualAccountLogger');
jest.mock('../utils/virtualAccountErrorHandler');

const mockVirtualAccountService = VirtualAccountService as jest.MockedClass<typeof VirtualAccountService>;
const mockFlutterwaveService = FlutterwaveVirtualAccountService as jest.MockedClass<typeof FlutterwaveVirtualAccountService>;
const mockLogger = virtualAccountLogger as jest.MockedObject<typeof virtualAccountLogger>;
const mockErrorHandler = VirtualAccountErrorHandler as jest.MockedClass<typeof VirtualAccountErrorHandler>;

describe('VirtualAccountController', () => {
  let controller: VirtualAccountController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    controller = new VirtualAccountController();
    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user-123', role: 'OWNER' }
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('createVirtualAccount', () => {
    it('should create virtual account for property owner successfully', async () => {
      const mockVirtualAccount = {
        id: 'va-123',
        accountNumber: '1234567890',
        accountName: 'John Doe NewCondo VA',
        bankCode: '035',
        userId: 'user-123',
        propertyId: 'prop-123',
        balance: '0.00',
        currency: 'NGN',
        isActive: true,
        flutterwaveAccountId: 'fw-123'
      };

      mockRequest.body = {
        propertyId: 'prop-123',
        accountName: 'John Doe',
        userType: 'OWNER'
      };

      mockVirtualAccountService.prototype.createVirtualAccount = jest.fn().mockResolvedValue(mockVirtualAccount);

      await controller.createVirtualAccount(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockVirtualAccountService.prototype.createVirtualAccount).toHaveBeenCalledWith({
        userId: 'user-123',
        propertyId: 'prop-123',
        accountName: 'John Doe',
        userType: 'OWNER'
      });

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Virtual account created successfully',
        data: mockVirtualAccount
      });
    });

    it('should create virtual account for agent successfully', async () => {
      const mockVirtualAccount = {
        id: 'va-456',
        accountNumber: '0987654321',
        accountName: 'Jane Smith Agent VA',
        bankCode: '035',
        userId: 'agent-123',
        propertyId: null,
        balance: '0.00',
        currency: 'NGN',
        isActive: true,
        flutterwaveAccountId: 'fw-456'
      };

      mockRequest.body = {
        accountName: 'Jane Smith',
        userType: 'AGENT'
      };
      mockRequest.user = { id: 'agent-123', role: 'AGENT' };

      mockVirtualAccountService.prototype.createVirtualAccount = jest.fn().mockResolvedValue(mockVirtualAccount);

      await controller.createVirtualAccount(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockVirtualAccountService.prototype.createVirtualAccount).toHaveBeenCalledWith({
        userId: 'agent-123',
        propertyId: undefined,
        accountName: 'Jane Smith',
        userType: 'AGENT'
      });

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Virtual account created successfully',
        data: mockVirtualAccount
      });
    });

    it('should handle validation errors', async () => {
      mockRequest.body = {
        // Missing required fields
      };

      await controller.createVirtualAccount(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: expect.any(Array)
      });
    });

    it('should handle service errors', async () => {
      const serviceError = new Error('Failed to create virtual account');
      mockRequest.body = {
        propertyId: 'prop-123',
        accountName: 'John Doe',
        userType: 'OWNER'
      };

      mockVirtualAccountService.prototype.createVirtualAccount = jest.fn().mockRejectedValue(serviceError);
      mockErrorHandler.handle = jest.fn().mockReturnValue({
        status: 500,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });

      await controller.createVirtualAccount(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockErrorHandler.handle).toHaveBeenCalledWith(serviceError);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getVirtualAccount', () => {
    it('should retrieve virtual account successfully', async () => {
      const mockVirtualAccount = {
        id: 'va-123',
        accountNumber: '1234567890',
        accountName: 'John Doe NewCondo VA',
        balance: '150.50',
        currency: 'NGN',
        isActive: true,
        createdAt: new Date(),
        property: {
          id: 'prop-123',
          title: 'Beautiful Apartment'
        }
      };

      mockRequest.params = { id: 'va-123' };
      mockVirtualAccountService.prototype.getVirtualAccountById = jest.fn().mockResolvedValue(mockVirtualAccount);

      await controller.getVirtualAccount(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockVirtualAccountService.prototype.getVirtualAccountById).toHaveBeenCalledWith('va-123', 'user-123');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockVirtualAccount
      });
    });

    it('should handle account not found', async () => {
      mockRequest.params = { id: 'non-existent' };
      mockVirtualAccountService.prototype.getVirtualAccountById = jest.fn().mockResolvedValue(null);

      await controller.getVirtualAccount(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Virtual account not found'
      });
    });
  });

  describe('getUserVirtualAccounts', () => {
    it('should retrieve all user virtual accounts', async () => {
      const mockAccounts = [
        {
          id: 'va-123',
          accountNumber: '1234567890',
          accountName: 'Property 1 VA',
          balance: '150.50',
          isActive: true,
          property: { id: 'prop-123', title: 'Apartment 1' }
        },
        {
          id: 'va-456',
          accountNumber: '0987654321',
          accountName: 'Property 2 VA',
          balance: '200.00',
          isActive: true,
          property: { id: 'prop-456', title: 'Apartment 2' }
        }
      ];

      mockVirtualAccountService.prototype.getUserVirtualAccounts = jest.fn().mockResolvedValue(mockAccounts);

      await controller.getUserVirtualAccounts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockVirtualAccountService.prototype.getUserVirtualAccounts).toHaveBeenCalledWith('user-123');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockAccounts,
        total: 2
      });
    });
  });

  describe('getVirtualAccountBalance', () => {
    it('should retrieve account balance successfully', async () => {
      const mockBalance = {
        accountId: 'va-123',
        balance: '250.75',
        currency: 'NGN',
        lastUpdated: new Date()
      };

      mockRequest.params = { id: 'va-123' };
      mockVirtualAccountService.prototype.getAccountBalance = jest.fn().mockResolvedValue(mockBalance);

      await controller.getVirtualAccountBalance(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockVirtualAccountService.prototype.getAccountBalance).toHaveBeenCalledWith('va-123', 'user-123');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockBalance
      });
    });

    it('should sync balance with Flutterwave if requested', async () => {
      const mockSyncedBalance = {
        accountId: 'va-123',
        balance: '275.00',
        currency: 'NGN',
        lastUpdated: new Date(),
        synced: true
      };

      mockRequest.params = { id: 'va-123' };
      mockRequest.query = { sync: 'true' };
      mockVirtualAccountService.prototype.syncAccountBalance = jest.fn().mockResolvedValue(mockSyncedBalance);

      await controller.getVirtualAccountBalance(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockVirtualAccountService.prototype.syncAccountBalance).toHaveBeenCalledWith('va-123', 'user-123');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockSyncedBalance
      });
    });
  });

  describe('getVirtualAccountStatement', () => {
    it('should retrieve account statement successfully', async () => {
      const mockStatement = {
        accountId: 'va-123',
        accountNumber: '1234567890',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        openingBalance: '0.00',
        closingBalance: '250.75',
        transactions: [
          {
            id: 'txn-1',
            amount: '100.00',
            type: 'CREDIT',
            description: 'Rent payment - January',
            date: '2023-01-01T10:00:00Z',
            reference: 'ref-123'
          },
          {
            id: 'txn-2',
            amount: '50.00',
            type: 'DEBIT',
            description: 'Commission payment',
            date: '2023-01-02T14:30:00Z',
            reference: 'ref-456'
          }
        ],
        totalCredits: '200.00',
        totalDebits: '50.00',
        transactionCount: 2
      };

      mockRequest.params = { id: 'va-123' };
      mockRequest.query = {
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        page: '1',
        limit: '50'
      };

      mockVirtualAccountService.prototype.getAccountStatement = jest.fn().mockResolvedValue(mockStatement);

      await controller.getVirtualAccountStatement(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockVirtualAccountService.prototype.getAccountStatement).toHaveBeenCalledWith('va-123', 'user-123', {
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        page: 1,
        limit: 50
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStatement
      });
    });
  });

  describe('deactivateVirtualAccount', () => {
    it('should deactivate virtual account successfully', async () => {
      mockRequest.params = { id: 'va-123' };
      mockVirtualAccountService.prototype.deactivateVirtualAccount = jest.fn().mockResolvedValue({
        id: 'va-123',
        isActive: false,
        deactivatedAt: new Date()
      });

      await controller.deactivateVirtualAccount(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockVirtualAccountService.prototype.deactivateVirtualAccount).toHaveBeenCalledWith('va-123', 'user-123');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Virtual account deactivated successfully',
        data: expect.objectContaining({
          id: 'va-123',
          isActive: false
        })
      });
    });

    it('should handle unauthorized deactivation attempt', async () => {
      mockRequest.params = { id: 'va-123' };
      const unauthorizedError = new Error('Unauthorized access');
      unauthorizedError.name = 'UnauthorizedError';

      mockVirtualAccountService.prototype.deactivateVirtualAccount = jest.fn().mockRejectedValue(unauthorizedError);
      mockErrorHandler.handle = jest.fn().mockReturnValue({
        status: 403,
        message: 'Unauthorized access to virtual account',
        code: 'UNAUTHORIZED'
      });

      await controller.deactivateVirtualAccount(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockErrorHandler.handle).toHaveBeenCalledWith(unauthorizedError);
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });
  });

  describe('reconcileVirtualAccount', () => {
    it('should reconcile virtual account successfully', async () => {
      const mockReconciliation = {
        accountId: 'va-123',
        localBalance: '250.75',
        flutterwaveBalance: '255.00',
        difference: '4.25',
        discrepancies: [
          {
            transactionId: 'txn-missing',
            amount: '4.25',
            type: 'MISSING_CREDIT',
            description: 'Transaction not recorded locally'
          }
        ],
        reconciledAt: new Date(),
        status: 'RECONCILED'
      };

      mockRequest.params = { id: 'va-123' };
      mockVirtualAccountService.prototype.reconcileAccount = jest.fn().mockResolvedValue(mockReconciliation);

      await controller.reconcileVirtualAccount(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockVirtualAccountService.prototype.reconcileAccount).toHaveBeenCalledWith('va-123', 'user-123');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Account reconciliation completed',
        data: mockReconciliation
      });
    });
  });

  describe('Error handling and logging', () => {
    it('should log all requests', async () => {
      mockRequest.method = 'GET';
      mockRequest.path = '/virtual-accounts/va-123';

      await controller.getVirtualAccount(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Virtual account request',
        expect.objectContaining({
          method: 'GET',
          path: '/virtual-accounts/va-123',
          userId: 'user-123'
        })
      );
    });

    it('should handle unexpected errors gracefully', async () => {
      const unexpectedError = new Error('Unexpected server error');
      mockRequest.params = { id: 'va-123' };

      mockVirtualAccountService.prototype.getVirtualAccountById = jest.fn().mockRejectedValue(unexpectedError);
      mockErrorHandler.handle = jest.fn().mockReturnValue({
        status: 500,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });

      await controller.getVirtualAccount(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Virtual account operation failed',
        expect.objectContaining({
          error: unexpectedError.message,
          userId: 'user-123',
          operation: 'getVirtualAccount'
        })
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });
});