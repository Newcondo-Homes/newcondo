/**
 * Reports Constants
 * Constants for report generation, scheduling, and templates
 * Location: backend/shared/src/constants/reports.ts
 */
export declare const REPORT_FREQUENCIES: {
    readonly ONCE: "once";
    readonly DAILY: "daily";
    readonly WEEKLY: "weekly";
    readonly MONTHLY: "monthly";
    readonly QUARTERLY: "quarterly";
    readonly YEARLY: "yearly";
    readonly CUSTOM: "custom";
};
export type ReportFrequency = (typeof REPORT_FREQUENCIES)[keyof typeof REPORT_FREQUENCIES];
export declare const REPORT_STATUS: {
    readonly PENDING: "pending";
    readonly PROCESSING: "processing";
    readonly COMPLETED: "completed";
    readonly FAILED: "failed";
    readonly CANCELLED: "cancelled";
    readonly SCHEDULED: "scheduled";
};
export type ReportStatus = (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS];
export declare const DELIVERY_METHODS: {
    readonly EMAIL: "email";
    readonly DOWNLOAD: "download";
    readonly DASHBOARD: "dashboard";
    readonly API: "api";
    readonly WEBHOOK: "webhook";
};
export type DeliveryMethod = (typeof DELIVERY_METHODS)[keyof typeof DELIVERY_METHODS];
export declare const REPORT_TEMPLATES: {
    readonly PLATFORM_OVERVIEW: {
        readonly id: "platform_overview";
        readonly name: "Platform Overview Report";
        readonly description: "Comprehensive overview of platform metrics and KPIs";
        readonly category: "platform";
        readonly sections: readonly ["user_metrics", "property_metrics", "revenue_metrics", "engagement_metrics"];
    };
    readonly USER_ANALYTICS: {
        readonly id: "user_analytics";
        readonly name: "User Analytics Report";
        readonly description: "Detailed user behavior and demographics analysis";
        readonly category: "users";
        readonly sections: readonly ["user_growth", "user_demographics", "user_activity", "user_retention"];
    };
    readonly USER_VERIFICATION: {
        readonly id: "user_verification";
        readonly name: "User Verification Report";
        readonly description: "Status and metrics of user verification processes";
        readonly category: "users";
        readonly sections: readonly ["verification_queue", "verification_success_rate", "rejected_verifications", "pending_reviews"];
    };
    readonly PROPERTY_PERFORMANCE: {
        readonly id: "property_performance";
        readonly name: "Property Performance Report";
        readonly description: "Analysis of property listings and their performance";
        readonly category: "properties";
        readonly sections: readonly ["active_listings", "property_views", "rental_conversions", "average_prices"];
    };
    readonly PROPERTY_INVENTORY: {
        readonly id: "property_inventory";
        readonly name: "Property Inventory Report";
        readonly description: "Current status of all property listings";
        readonly category: "properties";
        readonly sections: readonly ["total_properties", "properties_by_status", "properties_by_type", "properties_by_location"];
    };
    readonly REVENUE_SUMMARY: {
        readonly id: "revenue_summary";
        readonly name: "Revenue Summary Report";
        readonly description: "Comprehensive revenue analysis and breakdown";
        readonly category: "revenue";
        readonly sections: readonly ["total_revenue", "revenue_by_source", "commission_breakdown", "payment_methods"];
    };
    readonly FINANCIAL_STATEMENT: {
        readonly id: "financial_statement";
        readonly name: "Financial Statement";
        readonly description: "Detailed financial statement with all transactions";
        readonly category: "revenue";
        readonly sections: readonly ["income_statement", "transaction_log", "refunds_and_chargebacks", "outstanding_payments"];
    };
    readonly AGENT_PERFORMANCE: {
        readonly id: "agent_performance";
        readonly name: "Agent Performance Report";
        readonly description: "Performance metrics for all agents";
        readonly category: "agents";
        readonly sections: readonly ["active_agents", "listings_per_agent", "commission_earned", "agent_ratings"];
    };
    readonly TOP_AGENTS: {
        readonly id: "top_agents";
        readonly name: "Top Performing Agents Report";
        readonly description: "Leaderboard of best performing agents";
        readonly category: "agents";
        readonly sections: readonly ["top_by_listings", "top_by_revenue", "top_by_ratings", "top_by_conversions"];
    };
    readonly MARKING_SERVICE_SUMMARY: {
        readonly id: "marking_service_summary";
        readonly name: "Marking Service Summary";
        readonly description: "Overview of property marking service operations";
        readonly category: "marking";
        readonly sections: readonly ["total_jobs", "completion_rate", "average_completion_time", "revenue_from_marking"];
    };
    readonly MARKING_QUEUE_STATUS: {
        readonly id: "marking_queue_status";
        readonly name: "Marking Queue Status Report";
        readonly description: "Current status of marking job queue";
        readonly category: "marking";
        readonly sections: readonly ["pending_jobs", "assigned_jobs", "queue_wait_times", "agent_availability"];
    };
    readonly PAYMENT_TRANSACTIONS: {
        readonly id: "payment_transactions";
        readonly name: "Payment Transactions Report";
        readonly description: "Detailed log of all payment transactions";
        readonly category: "payments";
        readonly sections: readonly ["all_transactions", "successful_payments", "failed_payments", "refunded_payments"];
    };
    readonly PAYMENT_RECONCILIATION: {
        readonly id: "payment_reconciliation";
        readonly name: "Payment Reconciliation Report";
        readonly description: "Reconciliation of payments and settlements";
        readonly category: "payments";
        readonly sections: readonly ["pending_settlements", "settled_payments", "discrepancies", "virtual_account_balances"];
    };
    readonly CONVERSION_FUNNEL: {
        readonly id: "conversion_funnel";
        readonly name: "Conversion Funnel Report";
        readonly description: "Analysis of user conversion through the funnel";
        readonly category: "conversions";
        readonly sections: readonly ["signup_to_verification", "listing_to_rental", "view_to_inquiry", "inquiry_to_booking"];
    };
    readonly ENGAGEMENT_METRICS: {
        readonly id: "engagement_metrics";
        readonly name: "User Engagement Report";
        readonly description: "User engagement and activity metrics";
        readonly category: "engagement";
        readonly sections: readonly ["page_views", "session_duration", "bounce_rate", "feature_usage"];
    };
};
export declare const REPORT_SECTIONS: {
    readonly user_metrics: {
        readonly title: "User Metrics";
        readonly metrics: readonly ["total_users", "new_users", "active_users", "verified_users", "user_growth_rate"];
    };
    readonly user_growth: {
        readonly title: "User Growth";
        readonly metrics: readonly ["new_signups", "activation_rate", "growth_rate"];
    };
    readonly user_demographics: {
        readonly title: "User Demographics";
        readonly metrics: readonly ["users_by_role", "users_by_location", "users_by_type"];
    };
    readonly user_activity: {
        readonly title: "User Activity";
        readonly metrics: readonly ["active_users", "session_count", "average_session_duration"];
    };
    readonly user_retention: {
        readonly title: "User Retention";
        readonly metrics: readonly ["retention_rate", "churn_rate", "returning_users"];
    };
    readonly property_metrics: {
        readonly title: "Property Metrics";
        readonly metrics: readonly ["total_properties", "active_listings", "rented_properties", "average_property_price"];
    };
    readonly active_listings: {
        readonly title: "Active Listings";
        readonly metrics: readonly ["total_active", "new_listings", "expired_listings"];
    };
    readonly property_views: {
        readonly title: "Property Views";
        readonly metrics: readonly ["total_views", "unique_viewers", "average_views_per_property"];
    };
    readonly rental_conversions: {
        readonly title: "Rental Conversions";
        readonly metrics: readonly ["conversion_rate", "average_time_to_rent", "total_rentals"];
    };
    readonly revenue_metrics: {
        readonly title: "Revenue Metrics";
        readonly metrics: readonly ["total_revenue", "commission_earned", "platform_fees", "revenue_growth_rate"];
    };
    readonly total_revenue: {
        readonly title: "Total Revenue";
        readonly metrics: readonly ["gross_revenue", "net_revenue", "revenue_by_period"];
    };
    readonly revenue_by_source: {
        readonly title: "Revenue by Source";
        readonly metrics: readonly ["rent_payments", "marking_fees", "premium_subscriptions", "other_revenue"];
    };
    readonly commission_breakdown: {
        readonly title: "Commission Breakdown";
        readonly metrics: readonly ["platform_commission", "agent_commission", "sub_agent_commission"];
    };
    readonly engagement_metrics: {
        readonly title: "Engagement Metrics";
        readonly metrics: readonly ["page_views", "session_count", "bounce_rate", "time_on_site"];
    };
};
export declare const REPORT_FORMAT_OPTIONS: {
    readonly CSV: {
        readonly extension: "csv";
        readonly mimeType: "text/csv";
        readonly maxSize: 50;
    };
    readonly PDF: {
        readonly extension: "pdf";
        readonly mimeType: "application/pdf";
        readonly maxSize: 20;
    };
    readonly EXCEL: {
        readonly extension: "xlsx";
        readonly mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        readonly maxSize: 50;
    };
    readonly JSON: {
        readonly extension: "json";
        readonly mimeType: "application/json";
        readonly maxSize: 100;
    };
};
export declare const REPORT_PRIORITIES: {
    readonly LOW: "low";
    readonly NORMAL: "normal";
    readonly HIGH: "high";
    readonly URGENT: "urgent";
};
export type ReportPriority = (typeof REPORT_PRIORITIES)[keyof typeof REPORT_PRIORITIES];
export declare const REPORT_RETENTION: {
    readonly DAILY: 30;
    readonly WEEKLY: 90;
    readonly MONTHLY: 365;
    readonly QUARTERLY: 730;
    readonly YEARLY: 2555;
    readonly CUSTOM: 90;
};
export declare const GENERATION_LIMITS: {
    readonly MAX_CONCURRENT_REPORTS: 5;
    readonly MAX_REPORT_SIZE_MB: 100;
    readonly MAX_DATA_POINTS: 100000;
    readonly TIMEOUT_MINUTES: 30;
    readonly MAX_SCHEDULED_REPORTS_PER_USER: 10;
};
export declare const EMAIL_TEMPLATES: {
    readonly REPORT_READY: {
        readonly subject: "Your {{reportName}} is Ready";
        readonly template: "report_ready";
    };
    readonly REPORT_FAILED: {
        readonly subject: "Report Generation Failed: {{reportName}}";
        readonly template: "report_failed";
    };
    readonly SCHEDULED_REPORT: {
        readonly subject: "{{frequency}} Report: {{reportName}}";
        readonly template: "scheduled_report";
    };
};
export declare const VISUALIZATION_DEFAULTS: {
    readonly chartHeight: 400;
    readonly chartWidth: 800;
    readonly maxDataPoints: 100;
    readonly colorScheme: "default";
    readonly showLegend: true;
    readonly showGrid: true;
    readonly animationDuration: 300;
};
export declare const ACCESS_LEVELS: {
    readonly ADMIN: "admin";
    readonly MANAGER: "manager";
    readonly VIEWER: "viewer";
    readonly CUSTOM: "custom";
};
export type AccessLevel = (typeof ACCESS_LEVELS)[keyof typeof ACCESS_LEVELS];
export declare const REPORT_CATEGORIES: {
    readonly PLATFORM: "platform";
    readonly USERS: "users";
    readonly PROPERTIES: "properties";
    readonly REVENUE: "revenue";
    readonly AGENTS: "agents";
    readonly MARKING: "marking";
    readonly PAYMENTS: "payments";
    readonly CONVERSIONS: "conversions";
    readonly ENGAGEMENT: "engagement";
    readonly CUSTOM: "custom";
};
export type ReportCategory = (typeof REPORT_CATEGORIES)[keyof typeof REPORT_CATEGORIES];
export declare const DEFAULT_REPORT_CONFIG: {
    frequency: "monthly";
    format: string;
    deliveryMethod: "email";
    includeCharts: boolean;
    includeRawData: boolean;
    autoDelete: boolean;
    retentionDays: number;
    timezone: string;
    locale: string;
};
export declare const REPORT_FOOTER: {
    disclaimer: string;
    confidentiality: string;
    contact: string;
    copyright: string;
};
declare const _default: {
    REPORT_FREQUENCIES: {
        readonly ONCE: "once";
        readonly DAILY: "daily";
        readonly WEEKLY: "weekly";
        readonly MONTHLY: "monthly";
        readonly QUARTERLY: "quarterly";
        readonly YEARLY: "yearly";
        readonly CUSTOM: "custom";
    };
    REPORT_STATUS: {
        readonly PENDING: "pending";
        readonly PROCESSING: "processing";
        readonly COMPLETED: "completed";
        readonly FAILED: "failed";
        readonly CANCELLED: "cancelled";
        readonly SCHEDULED: "scheduled";
    };
    DELIVERY_METHODS: {
        readonly EMAIL: "email";
        readonly DOWNLOAD: "download";
        readonly DASHBOARD: "dashboard";
        readonly API: "api";
        readonly WEBHOOK: "webhook";
    };
    REPORT_TEMPLATES: {
        readonly PLATFORM_OVERVIEW: {
            readonly id: "platform_overview";
            readonly name: "Platform Overview Report";
            readonly description: "Comprehensive overview of platform metrics and KPIs";
            readonly category: "platform";
            readonly sections: readonly ["user_metrics", "property_metrics", "revenue_metrics", "engagement_metrics"];
        };
        readonly USER_ANALYTICS: {
            readonly id: "user_analytics";
            readonly name: "User Analytics Report";
            readonly description: "Detailed user behavior and demographics analysis";
            readonly category: "users";
            readonly sections: readonly ["user_growth", "user_demographics", "user_activity", "user_retention"];
        };
        readonly USER_VERIFICATION: {
            readonly id: "user_verification";
            readonly name: "User Verification Report";
            readonly description: "Status and metrics of user verification processes";
            readonly category: "users";
            readonly sections: readonly ["verification_queue", "verification_success_rate", "rejected_verifications", "pending_reviews"];
        };
        readonly PROPERTY_PERFORMANCE: {
            readonly id: "property_performance";
            readonly name: "Property Performance Report";
            readonly description: "Analysis of property listings and their performance";
            readonly category: "properties";
            readonly sections: readonly ["active_listings", "property_views", "rental_conversions", "average_prices"];
        };
        readonly PROPERTY_INVENTORY: {
            readonly id: "property_inventory";
            readonly name: "Property Inventory Report";
            readonly description: "Current status of all property listings";
            readonly category: "properties";
            readonly sections: readonly ["total_properties", "properties_by_status", "properties_by_type", "properties_by_location"];
        };
        readonly REVENUE_SUMMARY: {
            readonly id: "revenue_summary";
            readonly name: "Revenue Summary Report";
            readonly description: "Comprehensive revenue analysis and breakdown";
            readonly category: "revenue";
            readonly sections: readonly ["total_revenue", "revenue_by_source", "commission_breakdown", "payment_methods"];
        };
        readonly FINANCIAL_STATEMENT: {
            readonly id: "financial_statement";
            readonly name: "Financial Statement";
            readonly description: "Detailed financial statement with all transactions";
            readonly category: "revenue";
            readonly sections: readonly ["income_statement", "transaction_log", "refunds_and_chargebacks", "outstanding_payments"];
        };
        readonly AGENT_PERFORMANCE: {
            readonly id: "agent_performance";
            readonly name: "Agent Performance Report";
            readonly description: "Performance metrics for all agents";
            readonly category: "agents";
            readonly sections: readonly ["active_agents", "listings_per_agent", "commission_earned", "agent_ratings"];
        };
        readonly TOP_AGENTS: {
            readonly id: "top_agents";
            readonly name: "Top Performing Agents Report";
            readonly description: "Leaderboard of best performing agents";
            readonly category: "agents";
            readonly sections: readonly ["top_by_listings", "top_by_revenue", "top_by_ratings", "top_by_conversions"];
        };
        readonly MARKING_SERVICE_SUMMARY: {
            readonly id: "marking_service_summary";
            readonly name: "Marking Service Summary";
            readonly description: "Overview of property marking service operations";
            readonly category: "marking";
            readonly sections: readonly ["total_jobs", "completion_rate", "average_completion_time", "revenue_from_marking"];
        };
        readonly MARKING_QUEUE_STATUS: {
            readonly id: "marking_queue_status";
            readonly name: "Marking Queue Status Report";
            readonly description: "Current status of marking job queue";
            readonly category: "marking";
            readonly sections: readonly ["pending_jobs", "assigned_jobs", "queue_wait_times", "agent_availability"];
        };
        readonly PAYMENT_TRANSACTIONS: {
            readonly id: "payment_transactions";
            readonly name: "Payment Transactions Report";
            readonly description: "Detailed log of all payment transactions";
            readonly category: "payments";
            readonly sections: readonly ["all_transactions", "successful_payments", "failed_payments", "refunded_payments"];
        };
        readonly PAYMENT_RECONCILIATION: {
            readonly id: "payment_reconciliation";
            readonly name: "Payment Reconciliation Report";
            readonly description: "Reconciliation of payments and settlements";
            readonly category: "payments";
            readonly sections: readonly ["pending_settlements", "settled_payments", "discrepancies", "virtual_account_balances"];
        };
        readonly CONVERSION_FUNNEL: {
            readonly id: "conversion_funnel";
            readonly name: "Conversion Funnel Report";
            readonly description: "Analysis of user conversion through the funnel";
            readonly category: "conversions";
            readonly sections: readonly ["signup_to_verification", "listing_to_rental", "view_to_inquiry", "inquiry_to_booking"];
        };
        readonly ENGAGEMENT_METRICS: {
            readonly id: "engagement_metrics";
            readonly name: "User Engagement Report";
            readonly description: "User engagement and activity metrics";
            readonly category: "engagement";
            readonly sections: readonly ["page_views", "session_duration", "bounce_rate", "feature_usage"];
        };
    };
    REPORT_SECTIONS: {
        readonly user_metrics: {
            readonly title: "User Metrics";
            readonly metrics: readonly ["total_users", "new_users", "active_users", "verified_users", "user_growth_rate"];
        };
        readonly user_growth: {
            readonly title: "User Growth";
            readonly metrics: readonly ["new_signups", "activation_rate", "growth_rate"];
        };
        readonly user_demographics: {
            readonly title: "User Demographics";
            readonly metrics: readonly ["users_by_role", "users_by_location", "users_by_type"];
        };
        readonly user_activity: {
            readonly title: "User Activity";
            readonly metrics: readonly ["active_users", "session_count", "average_session_duration"];
        };
        readonly user_retention: {
            readonly title: "User Retention";
            readonly metrics: readonly ["retention_rate", "churn_rate", "returning_users"];
        };
        readonly property_metrics: {
            readonly title: "Property Metrics";
            readonly metrics: readonly ["total_properties", "active_listings", "rented_properties", "average_property_price"];
        };
        readonly active_listings: {
            readonly title: "Active Listings";
            readonly metrics: readonly ["total_active", "new_listings", "expired_listings"];
        };
        readonly property_views: {
            readonly title: "Property Views";
            readonly metrics: readonly ["total_views", "unique_viewers", "average_views_per_property"];
        };
        readonly rental_conversions: {
            readonly title: "Rental Conversions";
            readonly metrics: readonly ["conversion_rate", "average_time_to_rent", "total_rentals"];
        };
        readonly revenue_metrics: {
            readonly title: "Revenue Metrics";
            readonly metrics: readonly ["total_revenue", "commission_earned", "platform_fees", "revenue_growth_rate"];
        };
        readonly total_revenue: {
            readonly title: "Total Revenue";
            readonly metrics: readonly ["gross_revenue", "net_revenue", "revenue_by_period"];
        };
        readonly revenue_by_source: {
            readonly title: "Revenue by Source";
            readonly metrics: readonly ["rent_payments", "marking_fees", "premium_subscriptions", "other_revenue"];
        };
        readonly commission_breakdown: {
            readonly title: "Commission Breakdown";
            readonly metrics: readonly ["platform_commission", "agent_commission", "sub_agent_commission"];
        };
        readonly engagement_metrics: {
            readonly title: "Engagement Metrics";
            readonly metrics: readonly ["page_views", "session_count", "bounce_rate", "time_on_site"];
        };
    };
    REPORT_FORMAT_OPTIONS: {
        readonly CSV: {
            readonly extension: "csv";
            readonly mimeType: "text/csv";
            readonly maxSize: 50;
        };
        readonly PDF: {
            readonly extension: "pdf";
            readonly mimeType: "application/pdf";
            readonly maxSize: 20;
        };
        readonly EXCEL: {
            readonly extension: "xlsx";
            readonly mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            readonly maxSize: 50;
        };
        readonly JSON: {
            readonly extension: "json";
            readonly mimeType: "application/json";
            readonly maxSize: 100;
        };
    };
    REPORT_PRIORITIES: {
        readonly LOW: "low";
        readonly NORMAL: "normal";
        readonly HIGH: "high";
        readonly URGENT: "urgent";
    };
    REPORT_RETENTION: {
        readonly DAILY: 30;
        readonly WEEKLY: 90;
        readonly MONTHLY: 365;
        readonly QUARTERLY: 730;
        readonly YEARLY: 2555;
        readonly CUSTOM: 90;
    };
    GENERATION_LIMITS: {
        readonly MAX_CONCURRENT_REPORTS: 5;
        readonly MAX_REPORT_SIZE_MB: 100;
        readonly MAX_DATA_POINTS: 100000;
        readonly TIMEOUT_MINUTES: 30;
        readonly MAX_SCHEDULED_REPORTS_PER_USER: 10;
    };
    EMAIL_TEMPLATES: {
        readonly REPORT_READY: {
            readonly subject: "Your {{reportName}} is Ready";
            readonly template: "report_ready";
        };
        readonly REPORT_FAILED: {
            readonly subject: "Report Generation Failed: {{reportName}}";
            readonly template: "report_failed";
        };
        readonly SCHEDULED_REPORT: {
            readonly subject: "{{frequency}} Report: {{reportName}}";
            readonly template: "scheduled_report";
        };
    };
    VISUALIZATION_DEFAULTS: {
        readonly chartHeight: 400;
        readonly chartWidth: 800;
        readonly maxDataPoints: 100;
        readonly colorScheme: "default";
        readonly showLegend: true;
        readonly showGrid: true;
        readonly animationDuration: 300;
    };
    ACCESS_LEVELS: {
        readonly ADMIN: "admin";
        readonly MANAGER: "manager";
        readonly VIEWER: "viewer";
        readonly CUSTOM: "custom";
    };
    REPORT_CATEGORIES: {
        readonly PLATFORM: "platform";
        readonly USERS: "users";
        readonly PROPERTIES: "properties";
        readonly REVENUE: "revenue";
        readonly AGENTS: "agents";
        readonly MARKING: "marking";
        readonly PAYMENTS: "payments";
        readonly CONVERSIONS: "conversions";
        readonly ENGAGEMENT: "engagement";
        readonly CUSTOM: "custom";
    };
    DEFAULT_REPORT_CONFIG: {
        frequency: "monthly";
        format: string;
        deliveryMethod: "email";
        includeCharts: boolean;
        includeRawData: boolean;
        autoDelete: boolean;
        retentionDays: number;
        timezone: string;
        locale: string;
    };
    REPORT_FOOTER: {
        disclaimer: string;
        confidentiality: string;
        contact: string;
        copyright: string;
    };
};
export default _default;
//# sourceMappingURL=reports.d.ts.map