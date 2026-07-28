export declare const COMPANY: {
    readonly name: "Newcondo";
    readonly wordmark: "newcondo";
    readonly domain: "newcondo.homes";
    readonly supportEmail: "support@newcondo.homes";
    readonly country: "Nigeria";
    readonly currency: "NGN";
    readonly currencySymbol: "₦";
};
export interface ActiveArea {
    state: string;
    city: string;
    areas: string[];
    launched: string;
}
export declare const ACTIVE_AREAS: ActiveArea[];
export declare const isAreaActive: (state: string, city?: string) => boolean;
export declare const MARKING: {
    readonly fees: {
        readonly SELF: 0;
        readonly KNOWN_PERSON: 0;
        readonly BROADCAST: 20000;
        readonly NEWCONDO: 25000;
    };
    readonly markerPayout: 5000;
    readonly payoutHoldOnComplete: 1000;
    readonly slotHours: 3;
    readonly ownerConfirmHours: 72;
    readonly broadcastRadiusKm: 10;
    readonly inviteLinkExpiryDays: 14;
};
export declare const PAYMENTS: {
    readonly platformCommissionRate: 0.2;
    readonly eliteCommissionRate: 0.15;
    readonly agentShareOfCommission: 0.5;
    readonly subAgentSplitOfAgentShare: 0.5;
    readonly renterServiceFeeRate: 0.02;
    readonly escrowWindowHours: 24;
    readonly checkoutLockMinutes: 15;
    readonly withdrawalFee: 0;
};
export declare const PLANS: {
    readonly owner: {
        readonly essential: {
            readonly name: "Essential";
            readonly price: 7500;
        };
        readonly elite: {
            readonly name: "Elite";
            readonly price: 18500;
        };
    };
    readonly agent: {
        readonly premium: {
            readonly name: "Premium";
            readonly price: 3500;
        };
    };
    readonly renter: {
        readonly free: {
            readonly name: "Free";
            readonly price: 0;
        };
        readonly premium: {
            readonly name: "Premium";
            readonly price: 1500;
        };
    };
};
export declare const REFERRALS: {
    readonly rewardByInviteeRole: {
        readonly OWNER: 10000;
        readonly AGENT: 5000;
        readonly RENTER: 2000;
    };
    readonly inviteeWelcomeShare: 0.5;
    readonly leaderboardTopN: 4;
    readonly leaderboardPageSize: 10;
};
export declare const TENANTS: {
    readonly inviteExpiryDays: 14;
};
export declare const SERVICES: {
    readonly plans: {
        readonly basic: {
            readonly name: "Basic";
            readonly pricePerQuarter: 18000;
            readonly fumigationPerYear: 1;
            readonly wastePickup: "Bi-weekly";
            readonly inspectionsPerYear: 1;
        };
        readonly shield: {
            readonly name: "Shield";
            readonly pricePerQuarter: 45000;
            readonly fumigationPerYear: 3;
            readonly wastePickup: "Weekly";
            readonly inspectionsPerYear: 2;
        };
        readonly estate: {
            readonly name: "Estate";
            readonly pricePerQuarter: 90000;
            readonly fumigationPerYear: 4;
            readonly wastePickup: "2×/week";
            readonly inspectionsPerYear: 4;
        };
    };
    readonly types: readonly ["FUMIGATION", "WASTE_MANAGEMENT", "INSPECTION", "REPAIR_ELECTRICAL", "REPAIR_PLUMBING", "REPAIR_GENERAL"];
    readonly vendorResponseHours: 24;
    readonly propertyAssessmentHours: 48;
    readonly tenantVisitNoticeHours: 48;
};
export declare const VERIFICATION: {
    readonly reviewHours: 24;
    readonly acceptedIds: readonly ["NIN", "BVN", "Driver's licence", "Voter's card", "International passport"];
};
export declare const NG_BANKS: {
    name: string;
    code: string;
}[];
export declare const AMENITIES: string[];
//# sourceMappingURL=business.d.ts.map