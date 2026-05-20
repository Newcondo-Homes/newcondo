import { Prisma } from '@newcondo/db';

export interface DisputeFilters {
    status?: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'REJECTED' | 'ALL';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'ALL';
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'priority' | 'status';
    sortOrder?: 'asc' | 'desc';
}

export interface ResolveDisputeParams {
    disputeId: string;
    adminId: string;
    resolution: 'REFUND_FULL' | 'REFUND_PARTIAL' | 'NO_REFUND' | 'RELEASE_PAYMENT';
    refundAmount?: number;
    reason: string;
    additionalNotes?: string;
}

export interface UpdateDisputeStatusParams {
    disputeId: string;
    status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'REJECTED';
    adminId: string;
    notes?: string;
}

export interface AddDisputeNoteParams {
    disputeId: string;
    adminId: string;
    note: string;
    isInternal: boolean;
}

export interface EscalateDisputeParams {
    disputeId: string;
    priority: 'HIGH' | 'URGENT';
    adminId: string;
    reason: string;
}

// ─── Return interfaces ────────────────────────────────────────────────────────

export interface DisputeStats {
    total: number;
    pending: number;
    investigating: number;
    resolved: number;
    rejected: number;
    totalRefunded: number;
}

export interface DisputeListItem {
    id: string;
    rentalId: string;
    paymentId: string;
    renterId: string;
    renterName: string | null;
    renterEmail: string;
    propertyTitle: string;
    propertyAddress: string;
    amount: number;
    reason: string;
    description: string;
    preferredResolution: string;
    status: string;
    assignedAdminId: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface DisputeListResult {
    disputes: DisputeListItem[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface DisputeReason {
    category: 'PROPERTY_MISMATCH' | 'UNAVAILABLE' | 'FRAUD' | 'OTHER';
    description: string;
    evidence?: string[]; // URLs to uploaded evidence
}

export interface DisputeResolution {
    action: 'FULL_REFUND' | 'PARTIAL_REFUND' | 'NO_REFUND';
    refundAmount?: number;
    reason: string;
    compensationToOwner?: number;
}


export type DisputeWithRelations = Prisma.DisputeGetPayload<{
    include: {
        rental: {
            include: {
                property: {
                    include: {
                        owner: {
                            select: {
                                id: true;
                                name: true;
                                email: true;
                                phone: true;
                            };
                        };
                        agent: {
                            select: {
                                id: true;
                                name: true;
                                email: true;
                                phone: true;
                            };
                        };
                    };
                };
                unit: true;
            };
        };
        payment: true;
        renter: {
            select: {
                id: true;
                name: true;
                email: true;
                phone: true;
            };
        };
        comments: {
            include: {
                author: {
                    select: {
                        id: true;
                        name: true;
                        role: true;
                    };
                };
            };
        };
        evidence: true;
    };
}>;

export type AdminActionWithAdmin = Prisma.AdminActionGetPayload<{
    include: {
        admin: {
            select: {
                id: true;
                name: true;
                email: true;
            };
        };
    };
}>;

// This is what getDisputeDetails returns
export interface DisputeDetails {
    dispute: DisputeWithRelations;
    adminActions: AdminActionWithAdmin[];
}

export interface SubmitDisputeResult {
  id: string;
  paymentId: string;
  rentalId: string;
  renterId: string;
  renterName: string;
  renterEmail: string;
  renterPhone: string;
  propertyId: string;
  unitId?: string;
  propertyTitle: string;
  propertyAddress: string;
  amount: number;
  disputeReason: { category: string; description: string; evidence?: string[] };
  status: string;
  submittedAt: Date;
}
// export interface DisputeDetails {
//   id: string;
//   paymentId: string;
//   rentalId: string;
//   renterId: string;
//   renterName: string;
//   renterEmail: string;
//   renterPhone: string;
//   propertyId: string;
//   unitId?: string;
//   propertyTitle: string;
//   propertyAddress: string;
//   amount: number;
//   disputeReason: DisputeReason;
//   status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';
//   submittedAt: Date;
//   reviewedBy?: string;
//   resolvedAt?: Date;
//   resolution?: DisputeResolution;
// }

export interface DisputeDetailsResult {
    dispute: Prisma.DisputeGetPayload<{
        include: {
            rental: {
                include: {
                    property: {
                        include: {
                            owner: {
                                select: {
                                    id: true;
                                    name: true;
                                    email: true;
                                    phone: true;
                                };
                            };
                            agent: {
                                select: {
                                    id: true;
                                    name: true;
                                    email: true;
                                    phone: true;
                                };
                            };
                        };
                    };
                    unit: true;
                };
            };
            payment: true;
            renter: {
                select: {
                    id: true;
                    name: true;
                    email: true;
                    phone: true;
                };
            };
            comments: {
                include: {
                    author: {
                        select: {
                            id: true;
                            name: true;
                            role: true;
                        };
                    };
                };
            };
            evidence: true;
        };
    }>;
    adminActions: Prisma.AdminActionGetPayload<{
        include: {
            admin: {
                select: {
                    id: true;
                    name: true;
                    email: true;
                };
            };
        };
    }>[];
}

export interface DisputeNote {
    id: string;
    disputeId: string;
    authorId: string;
    comment: string;
    authorRole: string;
    createdAt: Date;
}

export interface TimelineEvent {
    timestamp: Date;
    type: string;
    description: string;
    actor?: string;
    metadata?: Prisma.JsonValue;
}

export interface DisputeTimeline {
    disputeId: string;
    events: TimelineEvent[];
}

export type UpdatedDispute = Prisma.DisputeGetPayload<Record<string, never>>;
