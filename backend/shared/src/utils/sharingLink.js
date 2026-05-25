"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSharingLinkAnalytics = exports.revokeSharingLink = exports.trackSharingLinkClick = exports.validateSharingLink = exports.generateSharingLink = void 0;
const nanoid_1 = require("nanoid");
const db_1 = require("@newcondo/db");
/**
 * Generate shareable link for property/unit
 */
const generateSharingLink = async (options) => {
    const { propertyId, unitId, expiresIn, trackClicks = true } = options;
    // Generate unique link identifier
    const linkId = (0, nanoid_1.nanoid)(10);
    // Construct shareable link
    const baseUrl = process.env.FRONTEND_URL || 'https://newcondo.com';
    const shareableLink = unitId
        ? `${linkId}?unit=${unitId}`
        : linkId;
    const fullUrl = `${baseUrl}/properties/shared/${shareableLink}`;
    // Calculate expiration
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn) : undefined;
    // Update property with shareable link
    await db_1.prisma.property.update({
        where: { id: propertyId },
        data: {
            shareableLink: linkId,
        },
    });
    return {
        shareableLink: linkId,
        fullUrl,
        expiresAt,
    };
};
exports.generateSharingLink = generateSharingLink;
/**
 * Validate sharing link
 */
const validateSharingLink = async (linkId) => {
    try {
        const property = await db_1.prisma.property.findFirst({
            where: {
                shareableLink: linkId,
            },
            select: {
                id: true,
                status: true,
                adminApprovalStatus: true,
            },
        });
        if (!property) {
            return { valid: false };
        }
        // Check if property is published and approved
        const valid = property.status === 'PUBLISHED' &&
            property.adminApprovalStatus === 'APPROVED';
        return {
            valid,
            propertyId: property.id,
        };
    }
    catch (error) {
        console.error('Error validating sharing link:', error);
        return { valid: false };
    }
};
exports.validateSharingLink = validateSharingLink;
/**
 * Track sharing link click
 */
const trackSharingLinkClick = async (linkId, metadata) => {
    try {
        const property = await db_1.prisma.property.findFirst({
            where: {
                shareableLink: linkId,
            },
        });
        if (!property) {
            return;
        }
        // Increment view count
        await db_1.prisma.property.update({
            where: { id: property.id },
            data: {
                viewCount: {
                    increment: 1,
                },
            },
        });
        // Log event
        await db_1.prisma.eventLog.create({
            data: {
                type: 'PROPERTY_SHARED_LINK_CLICKED',
                metadata: {
                    propertyId: property.id,
                    linkId,
                    ...metadata,
                },
                ipAddress: metadata?.ipAddress,
                userAgent: metadata?.userAgent,
            },
        });
    }
    catch (error) {
        console.error('Error tracking sharing link click:', error);
    }
};
exports.trackSharingLinkClick = trackSharingLinkClick;
/**
 * Revoke sharing link
 */
const revokeSharingLink = async (propertyId) => {
    try {
        await db_1.prisma.property.update({
            where: { id: propertyId },
            data: {
                shareableLink: null,
            },
        });
        return true;
    }
    catch (error) {
        console.error('Error revoking sharing link:', error);
        return false;
    }
};
exports.revokeSharingLink = revokeSharingLink;
/**
 * Get sharing link analytics
 */
const getSharingLinkAnalytics = async (linkId) => {
    try {
        const property = await db_1.prisma.property.findFirst({
            where: {
                shareableLink: linkId,
            },
            select: {
                id: true,
                viewCount: true,
                createdAt: true,
            },
        });
        if (!property) {
            return null;
        }
        // Get click events
        const clicks = await db_1.prisma.eventLog.count({
            where: {
                type: 'PROPERTY_SHARED_LINK_CLICKED',
                metadata: {
                    path: ['linkId'],
                    equals: linkId,
                },
            },
        });
        return {
            propertyId: property.id,
            totalViews: property.viewCount,
            sharedLinkClicks: clicks,
            createdAt: property.createdAt,
        };
    }
    catch (error) {
        console.error('Error getting sharing link analytics:', error);
        return null;
    }
};
exports.getSharingLinkAnalytics = getSharingLinkAnalytics;
//# sourceMappingURL=sharingLink.js.map