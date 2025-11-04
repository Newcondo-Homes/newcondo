// backend/referral-service/src/types/subAgent.ts

import { PromotionRequestStatus, PropertyPromotionType } from '@prisma/client';

export interface PromotionRequestData {
  agentId: string;
  propertyId: string;
  message?: string;
}

export interface PromotionRequestResponse {
  success: boolean;
  message: string;
  data?: {
    requestId: string;
    status?: PromotionRequestStatus;
    referralCode?: string;
    referralLink?: string;
    property?: any;
    createdAt?: string;
  };
}

export interface PromotionRequestItem {
  id: string;
  agent: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    reliabilityScore: string | null;
    completedJobs: number;
  };
  property: {
    id: string;
    title: string;
    address: string;
    image: string | null;
  };
  message: string | null;
  status: PromotionRequestStatus;
  rejectionReason: string | null;
  respondedAt: string | null;
  createdAt: string;
}

export interface PromotionRequestsResponse {
  requests: PromotionRequestItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface SubAgentItem {
  id: string;
  agent: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    reliabilityScore: string | null;
    completedJobs: number;
  };
  metrics: {
    clicks: number;
    uniqueClicks: number;
    conversions: number;
    conversionRate: string;
    totalEarnings: string;
  };
  referralCode: string;
  referralLink: string;
  isActive: boolean;
  createdAt: string;
}

export interface SubAgentPropertyItem {
  referralId: string;
  property: {
    id: string;
    title: string;
    description: string;
    address: string;
    price: string | null;
    propertyType: string;
    bedrooms: number | null;
    bathrooms: number | null;
    status: string;
    isAvailable: boolean;
    images: Array<{
      id: string;
      url: string;
      altText: string | null;
      isPrimary: boolean;
    }>;
    listingAgent: {
      id: string;
      name: string | null;
      phone: string | null;
    };
  };
  referralCode: string;
  referralLink: string;
  metrics: {
    clicks: number;
    uniqueClicks: number;
    conversions: number;
    conversionRate: string;
    totalEarnings: string;
  };
  createdAt: string;
}

export interface SubAgentPropertiesResponse {
  properties: SubAgentPropertyItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface PromotionSettingsData {
  propertyId: string;
  promotionType: PropertyPromotionType;
}

export interface PromotionSettingsResponse {
  success: boolean;
  message: string;
  data?: {
    propertyId: string;
    promotionType: PropertyPromotionType;
  };
}

export interface RemoveSubAgentResponse {
  success: boolean;
  message: string;
}