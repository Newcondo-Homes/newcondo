// apps/platform/lib/api/propertyMarketing.ts
import { apiClient } from './client';

// Generate shareable property link
export const generateShareableLink = async (propertyId: string) => {
  const response = await apiClient.post(`/properties/${propertyId}/share-link`);
  return response.data;
};

// Get shareable link stats
export const getShareableLinkStats = async (propertyId: string) => {
  const response = await apiClient.get(`/properties/${propertyId}/share-stats`);
  return response.data;
};

// Update property marketing settings
export const updateMarketingSettings = async (
  propertyId: string,
  settings: {
    featuredListing?: boolean;
    highlightProperty?: boolean;
    customDescription?: string;
    seoKeywords?: string[];
  }
) => {
  const response = await apiClient.patch(
    `/properties/${propertyId}/marketing-settings`,
    settings
  );
  return response.data;
};

// Boost property visibility
export const boostPropertyVisibility = async (
  propertyId: string,
  duration: number // in days
) => {
  const response = await apiClient.post(`/properties/${propertyId}/boost`, { duration });
  return response.data;
};

// Get property marketing tools
export const getMarketingTools = async (propertyId: string) => {
  const response = await apiClient.get(`/properties/${propertyId}/marketing-tools`);
  return response.data;
};

// Track social media share
export const trackSocialShare = async (
  propertyId: string,
  platform: 'facebook' | 'twitter' | 'whatsapp' | 'linkedin' | 'instagram' | 'email'
) => {
  const response = await apiClient.post(`/properties/${propertyId}/social-share`, {
    platform,
    timestamp: new Date().toISOString(),
  });
  return response.data;
};

// Get property QR code
export const getPropertyQRCode = async (propertyId: string) => {
  const response = await apiClient.get(`/properties/${propertyId}/qr-code`);
  return response.data;
};

// Generate property flyer
export const generatePropertyFlyer = async (
  propertyId: string,
  template?: 'modern' | 'classic' | 'minimal'
) => {
  const response = await apiClient.post(`/properties/${propertyId}/generate-flyer`, {
    template: template || 'modern',
  });
  return response.data;
};

// Get property SEO suggestions
export const getPropertySEOSuggestions = async (propertyId: string) => {
  const response = await apiClient.get(`/properties/${propertyId}/seo-suggestions`);
  return response.data;
};