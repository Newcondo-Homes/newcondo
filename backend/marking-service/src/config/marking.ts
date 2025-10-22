// backend/marking-service/src/config/marking.ts

export const markingConfig = {
  // Pricing
  pricing: {
    standardMarkingFee: 20000, // NGN
    adminMarkingFee: 25000, // NGN
    agentCommissionPercentage: 25, // 25% of marking fee
    partialPaymentAmount: 1000, // NGN on timeout
    currency: 'NGN',
  },

  // Time Management
  timeSlots: {
    durationHours: 3,
    warningMinutes: [60, 30, 15, 5], // Minutes before expiry
    maxExtensionHours: 0, // No extensions
    autoRotateOnExpiry: true,
  },

  // Confirmation Window
  confirmation: {
    windowHours: 48, // 2 days for owner to confirm
    gracePeriodHours: 24, // Additional 1 day grace period
    reminderSchedule: [24, 12, 2, 0.5], // Hours before deadline
    maxTimeoutIterations: 5, // Max times to pay partial amount
  },

  // Queue Management
  queue: {
    maxDaysInQueue: 3,
    maxQueueSize: 50,
    priorityLevels: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
    autoReassignOnDecline: true,
  },

  // Completion Requirements
  completion: {
    minImages: 4,
    maxImages: 20,
    requiredAngles: ['front', 'back', 'left', 'right', 'interior'],
    acceptedFormats: ['image/jpeg', 'image/png', 'image/jpg'],
    maxImageSizeMB: 5,
    minBoundaryPoints: 4,
    maxBoundaryPoints: 100,
  },

  // Agent Requirements
  agent: {
    minReliabilityScore: 3.0, // Out of 5.0
    maxActiveJobs: 3,
    requiredServiceAreas: true,
    locationUpdateIntervalMinutes: 30,
    maxDistanceKm: 50, // Max distance from property
  },

  // Notification Settings
  notifications: {
    channels: {
      email: true,
      sms: true,
      push: true,
    },
    templates: {
      newJobAlert: 'marking-job-alert',
      assignmentConfirmation: 'marking-assignment',
      timeSlotWarning: 'marking-time-warning',
      completionSubmitted: 'marking-completion',
      ownerConfirmation: 'marking-confirmation-required',
      paymentReleased: 'marking-payment-released',
    },
  },

  // Quality Assurance
  qualityControl: {
    enableAutoValidation: true,
    minQualityScore: 70, // Out of 100
    requireGPSAccuracy: true,
    maxGPSAccuracyMeters: 50,
    requireTimestamp: true,
    enableDuplicateDetection: true,
  },

  // Service Areas (Nigerian States)
  supportedStates: [
    'Lagos',
    'Abuja',
    'Ogun',
    'Oyo',
    'Rivers',
    'Kano',
    'Kaduna',
    'Enugu',
    'Delta',
    'Edo',
    'Anambra',
    'Plateau',
    'Imo',
    'Kwara',
    'Osun',
  ],

  // Payment Settings
  payment: {
    enableVirtualAccounts: true,
    partialPaymentOnTimeout: true,
    holdPeriodHours: 48, // Hold payment for confirmation
    autoReleaseOnConfirmation: true,
    refundPolicy: {
      enableRefunds: true,
      refundWindowHours: 24,
      refundPercentage: 100,
    },
  },

  // Security
  security: {
    requireOwnershipVerification: true,
    enableLocationVerification: true,
    requirePhotographicEvidence: true,
    enableBoundaryValidation: true,
    preventDuplicateSubmissions: true,
  },

  // Performance Metrics
  metrics: {
    trackAgentPerformance: true,
    trackCompletionTime: true,
    trackQualityScores: true,
    enableAnalytics: true,
  },

  // Redis Cache Keys
  cacheKeys: {
    activeJobs: 'marking:jobs:active',
    queue: 'marking:queue',
    agentLocations: 'marking:agents:locations',
    timeSlots: 'marking:timeslots',
    confirmations: 'marking:confirmations',
  },

  // Rate Limiting
  rateLimits: {
    jobCreation: {
      maxPerUser: 5,
      windowMinutes: 60,
    },
    queueJoin: {
      maxPerAgent: 10,
      windowMinutes: 60,
    },
    locationUpdate: {
      maxPerAgent: 120,
      windowMinutes: 60,
    },
  },
};

export type MarkingConfig = typeof markingConfig;

// Helper functions
export const calculateAgentCommission = (markingFee: number): number => {
  return markingFee * (markingConfig.pricing.agentCommissionPercentage / 100);
};

export const calculatePlatformAmount = (markingFee: number): number => {
  return markingFee - calculateAgentCommission(markingFee);
};

export const getTimeSlotExpiry = (startTime: Date): Date => {
  const expiry = new Date(startTime);
  expiry.setHours(expiry.getHours() + markingConfig.timeSlots.durationHours);
  return expiry;
};

export const getConfirmationDeadline = (completionTime: Date): Date => {
  const deadline = new Date(completionTime);
  deadline.setHours(deadline.getHours() + markingConfig.confirmation.windowHours);
  return deadline;
};

export const isStateSupported = (state: string): boolean => {
  return markingConfig.supportedStates.includes(state);
};