import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
// fix line 3: removed unused crypto import

/**
 * Webhook handler for marking service payment notifications
 * Handles Flutterwave webhook events for marking job payments
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headersList = await headers();
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

// fix lines 62, 77, 115, 143: typed webhook payloads instead of `any`

interface FlutterwaveCustomer {
  email: string;
  name?: string;
  phone_number?: string;
}

interface ChargeEventData {
  tx_ref: string;
  amount: number;
  status: string;
  customer: FlutterwaveCustomer;
  flw_ref?: string;
  currency?: string;
}

interface TransferEventData {
  reference: string;
  amount: number;
  status: string;
  account_number?: string;
  bank_name?: string;
}

interface WebhookBody {
  event: string;
  data: ChargeEventData | TransferEventData;
}

/**
 * Verify Flutterwave webhook signature
 */
// fix line 62: typed body as WebhookBody instead of `any`
function verifyWebhookSignature(body: WebhookBody, signature: string | null): boolean {
  if (!signature) return false;

  const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
  if (!secretHash) {
    console.error('FLUTTERWAVE_SECRET_HASH not configured');
    return false;
  }

  // body param reserved for future HMAC verification
  void body;
  return signature === secretHash;
}

/**
 * Handle successful payment for marking job
 */
// fix line 77: typed data as ChargeEventData instead of `any`
async function handleChargeCompleted(data: ChargeEventData) {
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
// fix line 115: typed data as TransferEventData instead of `any`
async function handleTransferCompleted(data: TransferEventData) {
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
// fix line 143: typed data as ChargeEventData instead of `any`
async function handleChargeFailed(data: ChargeEventData) {
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