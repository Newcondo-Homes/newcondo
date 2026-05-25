/**
 * Metrics Constants
 * Constants for business metrics, KPIs, and performance indicators
 * Location: backend/shared/src/constants/metrics.ts
 */
export declare const MARKING_COMMISSION_RATES: {
    readonly PLATFORM_BASE_RATE: 0.2;
    readonly LISTING_AGENT_SHARE: 0.5;
    readonly SUB_AGENT_SHARE: 0.5;
    readonly NEWCONDO_MARKING_FEE: 25000;
    readonly AGENT_MARKING_FEE: 20000;
    readonly AGENT_MARKING_COMMISSION: 0.25;
};
export declare const CONFIRMATION_PERIODS: {
    readonly RENTER_CONFIRMATION_HOURS: 24;
    readonly PROPERTY_OWNER_CONFIRMATION_DAYS: 3;
    readonly MAX_CONFIRMATION_ATTEMPTS: 5;
    readonly CONFIRMATION_REMINDER_HOURS: 12;
};
export declare const MARKING_SERVICE_METRICS: {
    readonly MAX_TIME_SLOT_HOURS: 3;
    readonly MAX_COMPLETION_DAYS: 3;
    readonly INITIAL_PAYMENT_AMOUNT: 1000;
    readonly QUEUE_POSITION_TIMEOUT_MINUTES: 180;
    readonly MIN_AGENT_RELIABILITY_SCORE: 3;
};
export declare const PROPERTY_METRICS: {
    readonly MIN_LISTING_DURATION_DAYS: 30;
    readonly MAX_LISTING_DURATION_DAYS: 365;
    readonly FEATURED_LISTING_DURATION_DAYS: 7;
    readonly MAX_PROPERTY_IMAGES: 20;
    readonly MAX_IMAGE_SIZE_MB: 10;
    readonly MIN_PROPERTY_DESCRIPTION_LENGTH: 50;
    readonly MAX_PROPERTY_DESCRIPTION_LENGTH: 2000;
};
export declare const VERIFICATION_METRICS: {
    readonly MAX_VERIFICATION_ATTEMPTS: 3;
    readonly VERIFICATION_REVIEW_HOURS: 48;
    readonly ID_DOCUMENT_VALID_MONTHS: 12;
    readonly SELFIE_MATCH_THRESHOLD: 0.85;
    readonly AUTO_VERIFICATION_THRESHOLD: 0.95;
};
export declare const PAYMENT_METRICS: {
    readonly MIN_RENT_AMOUNT: 10000;
    readonly MAX_RENT_AMOUNT: 10000000;
    readonly PAYMENT_TIMEOUT_MINUTES: 15;
    readonly REFUND_PROCESSING_DAYS: 7;
    readonly VIRTUAL_ACCOUNT_MIN_BALANCE: 0;
    readonly WITHDRAWAL_MIN_AMOUNT: 5000;
    readonly FLUTTERWAVE_TRANSACTION_FEE_RATE: 0.014;
    readonly FLUTTERWAVE_TRANSACTION_FEE_CAP: 2000;
};
export declare const PERFORMANCE_THRESHOLDS: {
    readonly EXCELLENT_AGENT_RATING: 4.5;
    readonly GOOD_AGENT_RATING: 3.5;
    readonly POOR_AGENT_RATING: 2.5;
    readonly MIN_AGENT_COMPLETION_RATE: 0.8;
    readonly HIGH_DEMAND_VIEWS_PER_DAY: 50;
    readonly AVERAGE_DEMAND_VIEWS_PER_DAY: 20;
    readonly LOW_DEMAND_VIEWS_PER_DAY: 5;
    readonly OPTIMAL_TIME_TO_RENT_DAYS: 14;
    readonly TARGET_CONVERSION_RATE: 0.15;
    readonly MIN_ACCEPTABLE_CONVERSION_RATE: 0.05;
    readonly TARGET_RETENTION_RATE: 0.8;
    readonly MAX_ACCEPTABLE_CHURN_RATE: 0.25;
    readonly TARGET_PAYMENT_SUCCESS_RATE: 0.95;
    readonly MIN_PAYMENT_SUCCESS_RATE: 0.85;
    readonly MAX_REFUND_RATE: 0.05;
};
export declare const GROWTH_TARGETS: {
    readonly MONTHLY_USER_GROWTH_RATE: 0.15;
    readonly MONTHLY_REVENUE_GROWTH_RATE: 0.2;
    readonly QUARTERLY_LISTING_GROWTH_RATE: 0.25;
    readonly YEARLY_MARKET_SHARE_TARGET: 0.1;
};
export declare const REVENUE_METRICS: {
    readonly TARGET_MONTHLY_REVENUE: 5000000;
    readonly TARGET_QUARTERLY_REVENUE: 15000000;
    readonly TARGET_ANNUAL_REVENUE: 60000000;
    readonly PREMIUM_SUBSCRIPTION_MONTHLY: 5000;
    readonly PREMIUM_SUBSCRIPTION_ANNUAL: 50000;
};
export declare const ENGAGEMENT_METRICS: {
    readonly ACTIVE_USER_MIN_SESSIONS_PER_MONTH: 4;
    readonly TARGET_AVERAGE_SESSION_DURATION_MINUTES: 15;
    readonly TARGET_PAGES_PER_SESSION: 5;
    readonly MAX_ACCEPTABLE_BOUNCE_RATE: 0.5;
    readonly TARGET_RETURN_USER_RATE: 0.6;
};
export declare const OPERATIONAL_METRICS: {
    readonly MAX_RESPONSE_TIME_MS: 200;
    readonly TARGET_UPTIME_PERCENTAGE: 99.9;
    readonly MAX_ERROR_RATE: 0.01;
    readonly MAX_SUPPORT_TICKET_RESOLUTION_HOURS: 48;
    readonly TARGET_FIRST_RESPONSE_MINUTES: 30;
};
export declare const QUALITY_SCORES: {
    readonly COMPLETE_PROFILE_POINTS: 100;
    readonly VERIFIED_OWNER_BONUS: 20;
    readonly HIGH_QUALITY_IMAGES_BONUS: 15;
    readonly DETAILED_DESCRIPTION_BONUS: 10;
    readonly LEGAL_DOCUMENTS_BONUS: 15;
    readonly RECENT_UPDATE_BONUS: 5;
    readonly MIN_QUALITY_SCORE_FOR_FEATURED: 80;
};
export declare const AGENT_QUALITY_METRICS: {
    readonly MIN_LISTINGS_FOR_RATING: 5;
    readonly MIN_COMPLETIONS_FOR_RELIABILITY: 10;
    readonly RESPONSE_TIME_TARGET_HOURS: 2;
    readonly COMPLETION_TIME_TARGET_HOURS: 48;
    readonly MAX_CANCELLATION_RATE: 0.1;
};
export declare const REFERRAL_METRICS: {
    readonly REFERRER_BONUS_AMOUNT: 5000;
    readonly REFEREE_DISCOUNT_PERCENTAGE: 0.1;
    readonly MIN_REFERRAL_QUALIFICATION_DAYS: 30;
    readonly MAX_REFERRAL_BONUS_PER_USER: 50000;
    readonly REFERRAL_TIER_1_BONUS: 5000;
    readonly REFERRAL_TIER_2_BONUS: 7500;
    readonly REFERRAL_TIER_3_BONUS: 10000;
};
export declare const SECURITY_METRICS: {
    readonly MAX_LOGIN_ATTEMPTS: 5;
    readonly ACCOUNT_LOCKOUT_DURATION_MINUTES: 30;
    readonly PASSWORD_MIN_LENGTH: 8;
    readonly PASSWORD_EXPIRY_DAYS: 90;
    readonly OTP_EXPIRY_MINUTES: 10;
    readonly OTP_MAX_ATTEMPTS: 3;
    readonly SESSION_TIMEOUT_MINUTES: 60;
    readonly REFRESH_TOKEN_EXPIRY_DAYS: 30;
};
export declare const DATA_RETENTION_METRICS: {
    readonly EVENT_LOG_RETENTION_DAYS: 90;
    readonly PAYMENT_LOG_RETENTION_YEARS: 7;
    readonly USER_ACTIVITY_RETENTION_DAYS: 365;
    readonly DELETED_USER_DATA_RETENTION_DAYS: 30;
    readonly BACKUP_RETENTION_DAYS: 30;
};
export declare const NOTIFICATION_METRICS: {
    readonly MAX_DAILY_NOTIFICATIONS_PER_USER: 10;
    readonly MAX_WEEKLY_MARKETING_EMAILS: 2;
    readonly EMAIL_OPEN_RATE_TARGET: 0.25;
    readonly SMS_DELIVERY_RATE_TARGET: 0.98;
    readonly PUSH_NOTIFICATION_CTR_TARGET: 0.1;
};
export declare const LOCATION_METRICS: {
    readonly MAX_SERVICE_RADIUS_KM: 50;
    readonly NEARBY_PROPERTIES_RADIUS_KM: 5;
    readonly AGENT_ASSIGNMENT_RADIUS_KM: 20;
    readonly MARKING_PRIORITY_RADIUS_KM: 10;
};
export declare const UPLOAD_METRICS: {
    readonly MAX_FILE_SIZE_MB: 10;
    readonly MAX_FILES_PER_UPLOAD: 20;
    readonly ALLOWED_IMAGE_FORMATS: readonly ["jpg", "jpeg", "png", "webp"];
    readonly ALLOWED_DOCUMENT_FORMATS: readonly ["pdf", "doc", "docx"];
    readonly IMAGE_COMPRESSION_QUALITY: 0.85;
    readonly THUMBNAIL_SIZE_PX: 300;
};
export declare const METRICS_RATE_LIMITS: {
    readonly API_REQUESTS_PER_MINUTE: 60;
    readonly API_REQUESTS_PER_HOUR: 1000;
    readonly LOGIN_ATTEMPTS_PER_HOUR: 5;
    readonly PASSWORD_RESET_PER_DAY: 3;
    readonly PROPERTY_CREATION_PER_DAY: 10;
    readonly SEARCH_QUERIES_PER_MINUTE: 20;
};
export declare const CACHE_METRICS: {
    readonly PROPERTY_LISTING_TTL_MINUTES: 15;
    readonly USER_PROFILE_TTL_MINUTES: 30;
    readonly ANALYTICS_DATA_TTL_MINUTES: 5;
    readonly SEARCH_RESULTS_TTL_MINUTES: 10;
    readonly STATIC_CONTENT_TTL_HOURS: 24;
};
export declare const SEARCH_METRICS: {
    readonly MAX_SEARCH_RESULTS: 100;
    readonly DEFAULT_SEARCH_RESULTS: 20;
    readonly MIN_SEARCH_QUERY_LENGTH: 3;
    readonly MAX_PRICE_FILTER_RANGE: 10000000;
    readonly MAX_BEDROOMS_FILTER: 10;
    readonly AUTOCOMPLETE_MIN_CHARACTERS: 2;
    readonly AUTOCOMPLETE_MAX_RESULTS: 10;
};
export declare const HEALTH_INDICATORS: {
    readonly CRITICAL_ERROR_THRESHOLD: 10;
    readonly HIGH_RESPONSE_TIME_MS: 500;
    readonly LOW_AVAILABILITY_THRESHOLD: 0.95;
    readonly DATABASE_CONNECTION_POOL_MIN: 10;
    readonly DATABASE_CONNECTION_POOL_MAX: 50;
    readonly QUEUE_SIZE_WARNING_THRESHOLD: 1000;
    readonly MEMORY_USAGE_WARNING_PERCENTAGE: 0.8;
};
export declare const AB_TEST_METRICS: {
    readonly MIN_SAMPLE_SIZE: 100;
    readonly CONFIDENCE_LEVEL: 0.95;
    readonly MIN_TEST_DURATION_DAYS: 7;
    readonly MAX_TEST_DURATION_DAYS: 30;
    readonly SIGNIFICANCE_THRESHOLD: 0.05;
};
declare const _default: {
    MARKING_COMMISSION_RATES: {
        readonly PLATFORM_BASE_RATE: 0.2;
        readonly LISTING_AGENT_SHARE: 0.5;
        readonly SUB_AGENT_SHARE: 0.5;
        readonly NEWCONDO_MARKING_FEE: 25000;
        readonly AGENT_MARKING_FEE: 20000;
        readonly AGENT_MARKING_COMMISSION: 0.25;
    };
    CONFIRMATION_PERIODS: {
        readonly RENTER_CONFIRMATION_HOURS: 24;
        readonly PROPERTY_OWNER_CONFIRMATION_DAYS: 3;
        readonly MAX_CONFIRMATION_ATTEMPTS: 5;
        readonly CONFIRMATION_REMINDER_HOURS: 12;
    };
    MARKING_SERVICE_METRICS: {
        readonly MAX_TIME_SLOT_HOURS: 3;
        readonly MAX_COMPLETION_DAYS: 3;
        readonly INITIAL_PAYMENT_AMOUNT: 1000;
        readonly QUEUE_POSITION_TIMEOUT_MINUTES: 180;
        readonly MIN_AGENT_RELIABILITY_SCORE: 3;
    };
    PROPERTY_METRICS: {
        readonly MIN_LISTING_DURATION_DAYS: 30;
        readonly MAX_LISTING_DURATION_DAYS: 365;
        readonly FEATURED_LISTING_DURATION_DAYS: 7;
        readonly MAX_PROPERTY_IMAGES: 20;
        readonly MAX_IMAGE_SIZE_MB: 10;
        readonly MIN_PROPERTY_DESCRIPTION_LENGTH: 50;
        readonly MAX_PROPERTY_DESCRIPTION_LENGTH: 2000;
    };
    VERIFICATION_METRICS: {
        readonly MAX_VERIFICATION_ATTEMPTS: 3;
        readonly VERIFICATION_REVIEW_HOURS: 48;
        readonly ID_DOCUMENT_VALID_MONTHS: 12;
        readonly SELFIE_MATCH_THRESHOLD: 0.85;
        readonly AUTO_VERIFICATION_THRESHOLD: 0.95;
    };
    PAYMENT_METRICS: {
        readonly MIN_RENT_AMOUNT: 10000;
        readonly MAX_RENT_AMOUNT: 10000000;
        readonly PAYMENT_TIMEOUT_MINUTES: 15;
        readonly REFUND_PROCESSING_DAYS: 7;
        readonly VIRTUAL_ACCOUNT_MIN_BALANCE: 0;
        readonly WITHDRAWAL_MIN_AMOUNT: 5000;
        readonly FLUTTERWAVE_TRANSACTION_FEE_RATE: 0.014;
        readonly FLUTTERWAVE_TRANSACTION_FEE_CAP: 2000;
    };
    PERFORMANCE_THRESHOLDS: {
        readonly EXCELLENT_AGENT_RATING: 4.5;
        readonly GOOD_AGENT_RATING: 3.5;
        readonly POOR_AGENT_RATING: 2.5;
        readonly MIN_AGENT_COMPLETION_RATE: 0.8;
        readonly HIGH_DEMAND_VIEWS_PER_DAY: 50;
        readonly AVERAGE_DEMAND_VIEWS_PER_DAY: 20;
        readonly LOW_DEMAND_VIEWS_PER_DAY: 5;
        readonly OPTIMAL_TIME_TO_RENT_DAYS: 14;
        readonly TARGET_CONVERSION_RATE: 0.15;
        readonly MIN_ACCEPTABLE_CONVERSION_RATE: 0.05;
        readonly TARGET_RETENTION_RATE: 0.8;
        readonly MAX_ACCEPTABLE_CHURN_RATE: 0.25;
        readonly TARGET_PAYMENT_SUCCESS_RATE: 0.95;
        readonly MIN_PAYMENT_SUCCESS_RATE: 0.85;
        readonly MAX_REFUND_RATE: 0.05;
    };
    GROWTH_TARGETS: {
        readonly MONTHLY_USER_GROWTH_RATE: 0.15;
        readonly MONTHLY_REVENUE_GROWTH_RATE: 0.2;
        readonly QUARTERLY_LISTING_GROWTH_RATE: 0.25;
        readonly YEARLY_MARKET_SHARE_TARGET: 0.1;
    };
    REVENUE_METRICS: {
        readonly TARGET_MONTHLY_REVENUE: 5000000;
        readonly TARGET_QUARTERLY_REVENUE: 15000000;
        readonly TARGET_ANNUAL_REVENUE: 60000000;
        readonly PREMIUM_SUBSCRIPTION_MONTHLY: 5000;
        readonly PREMIUM_SUBSCRIPTION_ANNUAL: 50000;
    };
    ENGAGEMENT_METRICS: {
        readonly ACTIVE_USER_MIN_SESSIONS_PER_MONTH: 4;
        readonly TARGET_AVERAGE_SESSION_DURATION_MINUTES: 15;
        readonly TARGET_PAGES_PER_SESSION: 5;
        readonly MAX_ACCEPTABLE_BOUNCE_RATE: 0.5;
        readonly TARGET_RETURN_USER_RATE: 0.6;
    };
    OPERATIONAL_METRICS: {
        readonly MAX_RESPONSE_TIME_MS: 200;
        readonly TARGET_UPTIME_PERCENTAGE: 99.9;
        readonly MAX_ERROR_RATE: 0.01;
        readonly MAX_SUPPORT_TICKET_RESOLUTION_HOURS: 48;
        readonly TARGET_FIRST_RESPONSE_MINUTES: 30;
    };
    QUALITY_SCORES: {
        readonly COMPLETE_PROFILE_POINTS: 100;
        readonly VERIFIED_OWNER_BONUS: 20;
        readonly HIGH_QUALITY_IMAGES_BONUS: 15;
        readonly DETAILED_DESCRIPTION_BONUS: 10;
        readonly LEGAL_DOCUMENTS_BONUS: 15;
        readonly RECENT_UPDATE_BONUS: 5;
        readonly MIN_QUALITY_SCORE_FOR_FEATURED: 80;
    };
    AGENT_QUALITY_METRICS: {
        readonly MIN_LISTINGS_FOR_RATING: 5;
        readonly MIN_COMPLETIONS_FOR_RELIABILITY: 10;
        readonly RESPONSE_TIME_TARGET_HOURS: 2;
        readonly COMPLETION_TIME_TARGET_HOURS: 48;
        readonly MAX_CANCELLATION_RATE: 0.1;
    };
    REFERRAL_METRICS: {
        readonly REFERRER_BONUS_AMOUNT: 5000;
        readonly REFEREE_DISCOUNT_PERCENTAGE: 0.1;
        readonly MIN_REFERRAL_QUALIFICATION_DAYS: 30;
        readonly MAX_REFERRAL_BONUS_PER_USER: 50000;
        readonly REFERRAL_TIER_1_BONUS: 5000;
        readonly REFERRAL_TIER_2_BONUS: 7500;
        readonly REFERRAL_TIER_3_BONUS: 10000;
    };
    SECURITY_METRICS: {
        readonly MAX_LOGIN_ATTEMPTS: 5;
        readonly ACCOUNT_LOCKOUT_DURATION_MINUTES: 30;
        readonly PASSWORD_MIN_LENGTH: 8;
        readonly PASSWORD_EXPIRY_DAYS: 90;
        readonly OTP_EXPIRY_MINUTES: 10;
        readonly OTP_MAX_ATTEMPTS: 3;
        readonly SESSION_TIMEOUT_MINUTES: 60;
        readonly REFRESH_TOKEN_EXPIRY_DAYS: 30;
    };
    DATA_RETENTION_METRICS: {
        readonly EVENT_LOG_RETENTION_DAYS: 90;
        readonly PAYMENT_LOG_RETENTION_YEARS: 7;
        readonly USER_ACTIVITY_RETENTION_DAYS: 365;
        readonly DELETED_USER_DATA_RETENTION_DAYS: 30;
        readonly BACKUP_RETENTION_DAYS: 30;
    };
    NOTIFICATION_METRICS: {
        readonly MAX_DAILY_NOTIFICATIONS_PER_USER: 10;
        readonly MAX_WEEKLY_MARKETING_EMAILS: 2;
        readonly EMAIL_OPEN_RATE_TARGET: 0.25;
        readonly SMS_DELIVERY_RATE_TARGET: 0.98;
        readonly PUSH_NOTIFICATION_CTR_TARGET: 0.1;
    };
    LOCATION_METRICS: {
        readonly MAX_SERVICE_RADIUS_KM: 50;
        readonly NEARBY_PROPERTIES_RADIUS_KM: 5;
        readonly AGENT_ASSIGNMENT_RADIUS_KM: 20;
        readonly MARKING_PRIORITY_RADIUS_KM: 10;
    };
    UPLOAD_METRICS: {
        readonly MAX_FILE_SIZE_MB: 10;
        readonly MAX_FILES_PER_UPLOAD: 20;
        readonly ALLOWED_IMAGE_FORMATS: readonly ["jpg", "jpeg", "png", "webp"];
        readonly ALLOWED_DOCUMENT_FORMATS: readonly ["pdf", "doc", "docx"];
        readonly IMAGE_COMPRESSION_QUALITY: 0.85;
        readonly THUMBNAIL_SIZE_PX: 300;
    };
    METRICS_RATE_LIMITS: {
        readonly API_REQUESTS_PER_MINUTE: 60;
        readonly API_REQUESTS_PER_HOUR: 1000;
        readonly LOGIN_ATTEMPTS_PER_HOUR: 5;
        readonly PASSWORD_RESET_PER_DAY: 3;
        readonly PROPERTY_CREATION_PER_DAY: 10;
        readonly SEARCH_QUERIES_PER_MINUTE: 20;
    };
    CACHE_METRICS: {
        readonly PROPERTY_LISTING_TTL_MINUTES: 15;
        readonly USER_PROFILE_TTL_MINUTES: 30;
        readonly ANALYTICS_DATA_TTL_MINUTES: 5;
        readonly SEARCH_RESULTS_TTL_MINUTES: 10;
        readonly STATIC_CONTENT_TTL_HOURS: 24;
    };
    SEARCH_METRICS: {
        readonly MAX_SEARCH_RESULTS: 100;
        readonly DEFAULT_SEARCH_RESULTS: 20;
        readonly MIN_SEARCH_QUERY_LENGTH: 3;
        readonly MAX_PRICE_FILTER_RANGE: 10000000;
        readonly MAX_BEDROOMS_FILTER: 10;
        readonly AUTOCOMPLETE_MIN_CHARACTERS: 2;
        readonly AUTOCOMPLETE_MAX_RESULTS: 10;
    };
    HEALTH_INDICATORS: {
        readonly CRITICAL_ERROR_THRESHOLD: 10;
        readonly HIGH_RESPONSE_TIME_MS: 500;
        readonly LOW_AVAILABILITY_THRESHOLD: 0.95;
        readonly DATABASE_CONNECTION_POOL_MIN: 10;
        readonly DATABASE_CONNECTION_POOL_MAX: 50;
        readonly QUEUE_SIZE_WARNING_THRESHOLD: 1000;
        readonly MEMORY_USAGE_WARNING_PERCENTAGE: 0.8;
    };
    AB_TEST_METRICS: {
        readonly MIN_SAMPLE_SIZE: 100;
        readonly CONFIDENCE_LEVEL: 0.95;
        readonly MIN_TEST_DURATION_DAYS: 7;
        readonly MAX_TEST_DURATION_DAYS: 30;
        readonly SIGNIFICANCE_THRESHOLD: 0.05;
    };
};
export default _default;
//# sourceMappingURL=metrics.d.ts.map