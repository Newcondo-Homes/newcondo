import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';

/**
 * Webhook handler for marking service payment notifications
 * Handles Flutterwave webhook events for marking job payments
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headersList = headers();
    const signature = headersList.get('verif-hash');

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Log webhook event
    console.log('Marking webhook received:', {
      event: body.event,
      txRef: body.data?.tx_ref,
      status: body.data?.status,
    });

    // Handle different webhook events
    switch (body.event) {
      case 'charge.completed':
        await handleChargeCompleted(body.data);
        break;

      case 'transfer.completed':
        await handleTransferCompleted(body.data);
        break;

      case 'charge.failed':
        await handleChargeFailed(body.data);
        break;

      default:
        console.log('Unhandled webhook event:', body.event);
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Marking webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Verify Flutterwave webhook signature
 */
function verifyWebhookSignature(body: any, signature: string | null): boolean {
  if (!signature) return false;

  const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
  if (!secretHash) {
    console.error('FLUTTERWAVE_SECRET_HASH not configured');
    return false;
  }

  return signature === secretHash;
}

/**
 * Handle successful payment for marking job
 */
async function handleChargeCompleted(data: any) {
  try {
    const { tx_ref, amount, customer, status } = data;

    if (status !== 'successful') {
      console.log('Payment not successful:', status);
      return;
    }

    // Extract marking job ID from transaction reference
    const markingJobId = extractMarkingJobId(tx_ref);
    if (!markingJobId) {
      console.error('Invalid transaction reference:', tx_ref);
      return;
    }

    // TODO: Update marking job payment status in database
    // This will be implemented when we have the database service
    console.log('Processing marking job payment:', {
      markingJobId,
      amount,
      customer: customer.email,
    });

    // TODO: Create virtual account transaction record

    // TODO: Notify property owner of successful payment

    // TODO: If this is agent assignment, broadcast to nearby agents
  } catch (error) {
    console.error('Error handling charge completed:', error);
    throw error;
  }
}

/**
 * Handle agent compensation transfer
 */
async function handleTransferCompleted(data: any) {
  try {
    const { reference, amount, status } = data;

    if (status !== 'successful') {
      console.log('Transfer not successful:', status);
      return;
    }

    // TODO: Update agent virtual account balance

    // TODO: Update marking job compensation status

    // TODO: Notify agent of payment received

    console.log('Agent compensation transferred:', {
      reference,
      amount,
    });
  } catch (error) {
    console.error('Error handling transfer completed:', error);
    throw error;
  }
}

/**
 * Handle failed payment
 */
async function handleChargeFailed(data: any) {
  try {
    const { tx_ref, customer } = data;

    const markingJobId = extractMarkingJobId(tx_ref);
    if (!markingJobId) {
      console.error('Invalid transaction reference:', tx_ref);
      return;
    }

    // TODO: Update marking job status to failed

    // TODO: Notify property owner of payment failure

    console.log('Marking job payment failed:', {
      markingJobId,
      customer: customer.email,
    });
  } catch (error) {
    console.error('Error handling charge failed:', error);
    throw error;
  }
}

/**
 * Extract marking job ID from transaction reference
 * Expected format: MARKING_JOB_{jobId}_{timestamp}
 */
function extractMarkingJobId(txRef: string): string | null {
  const match = txRef.match(/^MARKING_JOB_([a-zA-Z0-9]+)_\d+$/);
  return match ? match[1] : null;
}

/**
 * GET handler - return webhook info
 */
export async function GET() {
  return NextResponse.json({
    service: 'Marking Service Webhook',
    status: 'active',
    supportedEvents: [
      'charge.completed',
      'transfer.completed',
      'charge.failed',
    ],
  });
}