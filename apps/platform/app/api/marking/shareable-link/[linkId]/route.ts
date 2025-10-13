// apps/platform/app/api/marking/shareable-link/[linkId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@newcondo/db';
import { z } from 'zod';

// Validation schema for shareable link
const shareableLinkSchema = z.object({
  linkId: z.string().cuid(),
});

// Validation schema for marking completion via shareable link
const completeMarkingSchema = z.object({
  boundaryCoordinates: z.array(
    z.object({
      lat: z.number(),
      lng: z.number(),
    })
  ),
  completionImages: z.array(z.string().url()).min(3).max(20),
  completionNotes: z.string().optional(),
  markerName: z.string().min(2).max(100).optional(),
  markerPhone: z.string().optional(),
});

interface RouteContext {
  params: {
    linkId: string;
  };
}

/**
 * GET /api/marking/shareable-link/[linkId]
 * Validate and fetch marking job details for shareable link
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { linkId } = context.params;

    // Validate link ID format
    const validation = shareableLinkSchema.safeParse({ linkId });
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid link format',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    // Find the marking job by shareable link
    const job = await prisma.propertyMarkingJob.findFirst({
      where: {
        property: {
          shareableLink: linkId,
        },
        status: {
          in: ['QUEUED', 'ASSIGNED'],
        },
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            state: true,
            gpsCoordinates: true,
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
        requestingUser: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired marking link',
          message:
            'This marking link is no longer valid. It may have been completed or cancelled.',
        },
        { status: 404 }
      );
    }

    // Check if the marking link has expired (e.g., 7 days from creation)
    const linkExpiryDate = new Date(job.createdAt);
    linkExpiryDate.setDate(linkExpiryDate.getDate() + 7);

    if (new Date() > linkExpiryDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Link expired',
          message:
            'This marking link has expired. Please contact the property owner for a new link.',
        },
        { status: 410 }
      );
    }

    // Return job details (sanitized for public access)
    return NextResponse.json(
      {
        success: true,
        data: {
          jobId: job.id,
          property: {
            title: job.property.title,
            address: job.property.address,
            city: job.property.city,
            state: job.property.state,
            coordinates: job.property.gpsCoordinates,
            image: job.property.images[0]?.url || null,
          },
          contactPerson: {
            name: job.contactPersonName,
            phone: job.contactPersonPhone,
          },
          accessInstructions: job.accessInstructions,
          preferredTime: job.preferredTime,
          status: job.status,
          linkExpiry: linkExpiryDate.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error validating shareable link:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to validate marking link. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/marking/shareable-link/[linkId]
 * Complete marking job via shareable link
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { linkId } = context.params;

    // Validate link ID format
    const linkValidation = shareableLinkSchema.safeParse({ linkId });
    if (!linkValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid link format',
        },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = completeMarkingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid marking data',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { boundaryCoordinates, completionImages, completionNotes, markerName, markerPhone } =
      validation.data;

    // Find and verify the marking job
    const job = await prisma.propertyMarkingJob.findFirst({
      where: {
        property: {
          shareableLink: linkId,
        },
        status: {
          in: ['QUEUED', 'ASSIGNED'],
        },
      },
      include: {
        property: true,
        requestingUser: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or already completed marking job',
        },
        { status: 404 }
      );
    }

    // Check link expiry
    const linkExpiryDate = new Date(job.createdAt);
    linkExpiryDate.setDate(linkExpiryDate.getDate() + 7);

    if (new Date() > linkExpiryDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Marking link has expired',
        },
        { status: 410 }
      );
    }

    // Update marking job and property in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update marking job
      const updatedJob = await tx.propertyMarkingJob.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          completionNotes: completionNotes || `Marked by: ${markerName || 'Friend/Family'}${markerPhone ? ` (${markerPhone})` : ''}`,
          completionImages,
          boundaryData: {
            type: 'Polygon',
            coordinates: boundaryCoordinates,
            markedVia: 'SHAREABLE_LINK',
            markerInfo: {
              name: markerName,
              phone: markerPhone,
            },
          },
        },
      });

      // Update property with boundary information
      await tx.property.update({
        where: { id: job.propertyId },
        data: {
          boundaryCoordinates: {
            type: 'Polygon',
            coordinates: boundaryCoordinates,
          },
          boundaryMarkedAt: new Date(),
          boundaryImages: completionImages,
          boundaryMarkedBy: markerName || 'Friend/Family',
        },
      });

      // Create event log
      await tx.eventLog.create({
        data: {
          userId: job.requestedBy,
          type: 'MARKING_COMPLETED_VIA_LINK',
          metadata: {
            jobId: job.id,
            propertyId: job.propertyId,
            markerName: markerName,
            markerPhone: markerPhone,
            completedAt: new Date().toISOString(),
          },
        },
      });

      return updatedJob;
    });

    // TODO: Send notification to property owner about completed marking
    // This should be handled by the notification service

    return NextResponse.json(
      {
        success: true,
        message: 'Property marking completed successfully',
        data: {
          jobId: result.id,
          status: result.status,
          completedAt: result.completedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error completing marking via shareable link:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to complete marking. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/marking/shareable-link/[linkId]
 * Invalidate/cancel a marking job via shareable link
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { linkId } = context.params;

    // Validate link ID format
    const validation = shareableLinkSchema.safeParse({ linkId });
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid link format',
        },
        { status: 400 }
      );
    }

    // Find the marking job
    const job = await prisma.propertyMarkingJob.findFirst({
      where: {
        property: {
          shareableLink: linkId,
        },
        status: {
          in: ['QUEUED', 'ASSIGNED'],
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: 'Marking job not found or already completed',
        },
        { status: 404 }
      );
    }

    // Cancel the marking job
    const cancelledJob = await prisma.propertyMarkingJob.update({
      where: { id: job.id },
      data: {
        status: 'CANCELLED',
        completionNotes: 'Cancelled via shareable link',
      },
    });

    // Log the cancellation
    await prisma.eventLog.create({
      data: {
        userId: job.requestedBy,
        type: 'MARKING_CANCELLED_VIA_LINK',
        metadata: {
          jobId: job.id,
          propertyId: job.propertyId,
          cancelledAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Marking job cancelled successfully',
        data: {
          jobId: cancelledJob.id,
          status: cancelledJob.status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error cancelling marking via shareable link:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to cancel marking job. Please try again later.',
      },
      { status: 500 }
    );
  }
}