import { Prisma } from "@newcondo/db";

// types/profile.ts (in your auth-service types folder)
export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  emailVerified: Date | null;
  phoneVerified: Date | null;
  image: string | null;
  role: string;
  verificationStatus: string;
  dateOfBirth: Date | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  isPremium: boolean;
  premiumExpiresAt: Date | null;
  referralCode: string | null;
  isAvailableForMarking: boolean;
  agentServiceAreas: string[] | null;
  agentReliabilityScore: Prisma.Decimal | null;
  totalMarkingJobs: number;
  completedMarkingJobs: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateUserProfileData {
  name?: string;
  image?: string;
  dateOfBirth?: Date;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  isAvailableForMarking?: boolean;
  agentServiceAreas?: string[];
  // Add other updatable fields as needed
  [key: string]: any;
}

export interface UserActivity {
  id: string;
  type: string;
  metadata: Record<string, unknown> | null; // Instead of JsonValue
  timestamp: Date;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface ActivityPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GetUserActivityResponse {
  activities: UserActivity[];
  pagination: ActivityPagination;
}
