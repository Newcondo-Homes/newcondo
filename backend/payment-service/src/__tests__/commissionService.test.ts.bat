import { describe, it, expect, beforeEach } from 'vitest';
import { CommissionService } from '../services/commissionService';

describe('CommissionService', () => {
  let commissionService: CommissionService;

  beforeEach(() => {
    commissionService = new CommissionService();
  });

  describe('calculateCommissions', () => {
    it('should calculate commission for owner-only listing', () => {
      const result = commissionService.calculateCommissions({
        totalAmount: 100000,
        isOwnerListing: true,
        hasAgent: false,
        hasSubAgent: false,
      });

      expect(result.ownerAmount).toBe(80000); // 80%
      expect(result.newCondoAmount).toBe(20000); // 20%
      expect(result.listingAgentAmount).toBe(0);
      expect(result.subAgentAmount).toBe(0);
      expect(result.totalCommission).toBe(20000);
    });

    it('should calculate commission for listing agent without sub-agent', () => {
      const result = commissionService.calculateCommissions({
        totalAmount: 100000,
        isOwnerListing: false,
        hasAgent: true,
        hasSubAgent: false,
      });

      expect(result.ownerAmount).toBe(80000); // 80%
      expect(result.listingAgentAmount).toBe(10000); // 10% (50% of 20%)
      expect(result.newCondoAmount).toBe(10000); // 10% (50% of 20%)
      expect(result.subAgentAmount).toBe(0);
      expect(result.totalCommission).toBe(20000);
    });

    it('should calculate commission with listing agent and sub-agent', () => {
      const result = commissionService.calculateCommissions({
        totalAmount: 100000,
        isOwnerListing: false,
        hasAgent: true,
        hasSubAgent: true,
      });

      expect(result.ownerAmount).toBe(80000); // 80%
      expect(result.listingAgentAmount).toBe(5000); // 5% (25% of 20%)
      expect(result.subAgentAmount).toBe(5000); // 5% (25% of 20%)
      expect(result.newCondoAmount).toBe(10000); // 10% (50% of 20%)
      expect(result.totalCommission).toBe(20000);
    });

    it('should handle sub-agent without listing agent (edge case)', () => {
      const result = commissionService.calculateCommissions({
        totalAmount: 100000,
        isOwnerListing: true,
        hasAgent: false,
        hasSubAgent: true,
      });

      expect(result.ownerAmount).toBe(80000);
      expect(result.subAgentAmount).toBe(10000); // Gets full agent share
      expect(result.newCondoAmount).toBe(10000);
      expect(result.totalCommission).toBe(20000);
    });

    it('should validate total adds up to 100%', () => {
      const scenarios = [
        { isOwnerListing: true, hasAgent: false, hasSubAgent: false },
        { isOwnerListing: false, hasAgent: true, hasSubAgent: false },
        { isOwnerListing: false, hasAgent: true, hasSubAgent: true },
      ];

      scenarios.forEach((scenario) => {
        const result = commissionService.calculateCommissions({
          totalAmount: 100000,
          ...scenario,
        });

        const total =
          result.ownerAmount +
          result.listingAgentAmount +
          result.subAgentAmount +
          result.newCondoAmount;

        expect(total).toBe(100000);
      });
    });

    it('should handle decimal amounts correctly', () => {
      const result = commissionService.calculateCommissions({
        totalAmount: 123456.78,
        isOwnerListing: false,
        hasAgent: true,
        hasSubAgent: true,
      });

      const total =
        result.ownerAmount +
        result.listingAgentAmount +
        result.subAgentAmount +
        result.newCondoAmount;

      // Allow for small rounding differences
      expect(Math.abs(total - 123456.78)).toBeLessThan(0.01);
    });
  });

  describe('getNewCondoPlatformFee', () => {
    it('should return 20% platform fee rate', () => {
      const rate = commissionService.getNewCondoPlatformFee();
      expect(rate).toBe(0.2);
    });
  });

  describe('getAgentCommissionRate', () => {
    it('should return 50% agent commission rate (of platform fee)', () => {
      const rate = commissionService.getAgentCommissionRate();
      expect(rate).toBe(0.5);
    });
  });
});