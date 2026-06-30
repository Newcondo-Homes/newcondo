import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@newcondo/db';
import Flutterwave from 'flutterwave-node-v3';

const prisma = new PrismaClient();
const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY!,
  process.env.FLW_SECRET_KEY!
);

/**
 * Acquire payment lock for property/unit
 */
export const acquirePaymentLock = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { propertyId, unitId, userId, lockDuration = 900000 } = req.body; // Default 15 minutes

  const startTime = Date.now();

  try {
    const lockExpiry = new Date(Date.now() + lockDuration);

    // Use transaction with retry logic for race conditions
    const result = await prisma.$transaction(
      async (tx) => {
        if (unitId) {
          // Lock unit
          const unit = await tx.propertyUnit.findUnique({
            where: { id: unitId },
            include: { property: true },
          });

          if (!unit) {
            throw new Error('Unit not found');
          }

          // Check if already locked by someone else
          if (
            unit.isPaymentLocked &&
            unit.paymentLockExpiry &&
            unit.paymentLockExpiry > new Date()
          ) {
            // Check if it's the same user
            const existingLock = await tx.paymentAttemptLog.findFirst({
              where: {
                unitId,
                userId,
                status: 'LOCKED',
                createdAt: {
                  gte: new Date(Date.now() - lockDuration),
                },
              },
            });

            if (!existingLock) {
              throw new Error('Unit is locked by another user');
            }
          }

          // Acquire lock
          const updatedUnit = await tx.propertyUnit.update({
            where: { id: unitId },
            data: {
              isPaymentLocked: true,
              paymentLockExpiry: lockExpiry,
            },
          });

          // Log the attempt
          const attemptLog = await tx.paymentAttemptLog.create({
            data: {
              userId,
              propertyId,
              unitId,
              amount: unit.price,
              status: 'LOCKED',
              lockAcquired: true,
              lockDuration: lockDuration,
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'],
            },
          });

          return {
            locked: true,
            lockExpiry,
            unit: updatedUnit,
            attemptId: attemptLog.id,
          };
        } else {
          // Lock property
          const property = await tx.property.findUnique({
            where: { id: propertyId },
          });

          if (!property) {
            throw new Error('Property not found');
          }

          if (property.structure === 'MULTI_FAMILY') {
            throw new Error('Multi-family properties require unit selection');
          }

          // Check if already locked
          if (
            property.isPaymentLocked &&
            property.paymentLockExpiry &&
            property.paymentLockExpiry > new Date()
          ) {
            const existingLock = await tx.paymentAttemptLog.findFirst({
              where: {
                propertyId,
                unitId: null,
                userId,
                status: 'LOCKED',
                createdAt: {
                  gte: new Date(Date.now() - lockDuration),
                },
              },
            });

            if (!existingLock) {
              throw new Error('Property is locked by another user');
            }
          }

          // Acquire lock
          const updatedProperty = await tx.property.update({
            where: { id: propertyId },
            data: {
              isPaymentLocked: true,
              paymentLockExpiry: lockExpiry,
            },
          });

          // Log the attempt
          const attemptLog = await tx.paymentAttemptLog.create({
            data: {
              userId,
              propertyId,
              unitId: null,
              amount: property.price || new Prisma.Decimal(0),
              status: 'LOCKED',
              lockAcquired: true,
              lockDuration: lockDuration,
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'],
            },
          });

          return {
            locked: true,
            lockExpiry,
            property: updatedProperty,
            attemptId: attemptLog.id,
          };
        }
      },
      {
        maxWait: 5000,
        timeout: 10000,
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    const lockAcquisitionTime = Date.now() - startTime;

    res.status(200).json({
      success: true,
      message: 'Payment lock acquired successfully',
      data: result,
      lockAcquisitionTime,
    });
  } catch (error: any) {
    // Log failed attempt
    await prisma.paymentAttemptLog.create({
      data: {
        userId,
        propertyId,
        unitId: unitId || null,
        amount: new Prisma.Decimal(0),
        status: 'FAILED',
        lockAcquired: false,
        failureReason: error.message,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    if (error.message.includes('locked')) {
      res.status(423).json({
        success: false,
        error: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to acquire payment lock',
      details: error.message,
    });
  }
};

/**
 * Release payment lock
 */
export const releasePaymentLock = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { propertyId, unitId, userId } = req.body;

  try {
    await prisma.$transaction(async (tx) => {
      if (unitId) {
        // Release unit lock
        await tx.propertyUnit.update({
          where: { id: unitId },
          data: {
            isPaymentLocked: false,
            paymentLockExpiry: null,
          },
        });

        // Update attempt log
        await tx.paymentAttemptLog.updateMany({
          where: {
            unitId,
            userId,
            status: 'LOCKED',
          },
          data: {
            status: 'TIMEOUT',
          },
        });
      } else {
        // Release property lock
        await tx.property.update({
          where: { id: propertyId },
          data: {
            isPaymentLocked: false,
            paymentLockExpiry: null,
          },
        });

        // Update attempt log
        await tx.paymentAttemptLog.updateMany({
          where: {
            propertyId,
            unitId: null,
            userId,
            status: 'LOCKED',
          },
          data: {
            status: 'TIMEOUT',
          },
        });
      }
    });

    res.status(200).json({
      success: true,
      message: 'Payment lock released successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to release payment lock',
      details: error.message,
    });
  }
};

/**
 * Check payment lock status
 */
export const checkLockStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { propertyId, unitId } = req.query;

  try {
    if (unitId) {
      const unit = await prisma.propertyUnit.findUnique({
        where: { id: unitId as string },
        select: {
          isPaymentLocked: true,
          paymentLockExpiry: true,
          isAvailable: true,
          status: true,
        },
      });

      if (!unit) {
        res.status(404).json({
          success: false,
          error: 'Unit not found',
        });
        return;
      }

      const isLocked =
        unit.isPaymentLocked &&
        unit.paymentLockExpiry &&
        unit.paymentLockExpiry > new Date();

      res.status(200).json({
        success: true,
        data: {
          isLocked,
          lockExpiry: isLocked ? unit.paymentLockExpiry : null,
          isAvailable: unit.isAvailable,
          status: unit.status,
        },
      });
    } else {
      const property = await prisma.property.findUnique({
        where: { id: propertyId as string },
        select: {
          isPaymentLocked: true,
          paymentLockExpiry: true,
          isAvailable: true,
          status: true,
          structure: true,
        },
      });

      if (!property) {
        res.status(404).json({
          success: false,
          error: 'Property not found',
        });
        return;
      }

      const isLocked =
        property.isPaymentLocked &&
        property.paymentLockExpiry &&
        property.paymentLockExpiry > new Date();

      res.status(200).json({
        success: true,
        data: {
          isLocked,
          lockExpiry: isLocked ? property.paymentLockExpiry : null,
          isAvailable: property.isAvailable,
          status: property.status,
          structure: property.structure,
        },
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to check lock status',
      details: error.message,
    });
  }
};

/**
 * Process payment with lock verification
 */
export const processLockedPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { propertyId, unitId, userId, amount, email, phone } = req.body;

  try {
    // Verify lock is held by this user
    const now = new Date();

    if (unitId) {
      const unit = await prisma.propertyUnit.findUnique({
        where: { id: unitId },
      });

      if (
        !unit?.isPaymentLocked ||
        !unit.paymentLockExpiry ||
        unit.paymentLockExpiry < now
      ) {
        res.status(423).json({
          success: false,
          error: 'Payment lock has expired',
        });
        return;
      }
    } else {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
      });

      if (
        !property?.isPaymentLocked ||
        !property.paymentLockExpiry ||
        property.paymentLockExpiry < now
      ) {
        res.status(423).json({
          success: false,
          error: 'Payment lock has expired',
        });
        return;
      }
    }

    // Initiate Flutterwave payment
    const payload = {
      tx_ref: `RENT-${Date.now()}-${userId}`,
      amount: parseFloat(amount),
      currency: 'NGN',
      redirect_url: `${process.env.FRONTEND_URL}/payments/verify`,
      customer: {
        email,
        phone_number: phone,
      },
      customizations: {
        title: 'NewCondo Rent Payment',
        description: unitId
          ? `Payment for unit ${unitId}`
          : `Payment for property ${propertyId}`,
      },
      meta: {
        propertyId,
        unitId,
        userId,
      },
    };

    const response = await flw.Charge.card(payload);

    if (response.status === 'success') {
      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          userId,
          amount: new Prisma.Decimal(amount),
          currency: 'NGN',
          paymentType: 'RENT',
          status: 'PENDING',
          flutterwaveRef: payload.tx_ref,
          transactionId: response.data.id,
          description: unitId
            ? `Rent payment for unit ${unitId}`
            : `Rent payment for property ${propertyId}`,
        },
      });

      // Update attempt log
      await prisma.paymentAttemptLog.updateMany({
        where: {
          propertyId,
          unitId: unitId || null,
          userId,
          status: 'LOCKED',
        },
        data: {
          status: 'SUCCESS',
        },
      });

      res.status(200).json({
        success: true,
        message: 'Payment initiated successfully',
        data: {
          paymentId: payment.id,
          paymentUrl: response.data.link,
          transactionId: response.data.id,
        },
      });
    } else {
      // Payment initiation failed, release lock
      await releasePaymentLock(req, res);

      res.status(400).json({
        success: false,
        error: 'Payment initiation failed',
        details: response.message,
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to process payment',
      details: error.message,
    });
  }
};

/**
 * Auto-release expired locks (cron job)
 */
export const releaseExpiredLocks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const now = new Date();

    // Release expired property locks
    const expiredProperties = await prisma.property.updateMany({
      where: {
        isPaymentLocked: true,
        paymentLockExpiry: {
          lt: now,
        },
      },
      data: {
        isPaymentLocked: false,
        paymentLockExpiry: null,
      },
    });

    // Release expired unit locks
    const expiredUnits = await prisma.propertyUnit.updateMany({
      where: {
        isPaymentLocked: true,
        paymentLockExpiry: {
          lt: now,
        },
      },
      data: {
        isPaymentLocked: false,
        paymentLockExpiry: null,
      },
    });

    // Update attempt logs
    await prisma.paymentAttemptLog.updateMany({
      where: {
        status: 'LOCKED',
        createdAt: {
          lt: new Date(Date.now() - 30 * 60 * 1000), // Older than 30 minutes
        },
      },
      data: {
        status: 'TIMEOUT',
      },
    });

    res.status(200).json({
      success: true,
      message: 'Expired locks released successfully',
      data: {
        propertiesReleased: expiredProperties.count,
        unitsReleased: expiredUnits.count,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to release expired locks',
      details: error.message,
    });
  }
};