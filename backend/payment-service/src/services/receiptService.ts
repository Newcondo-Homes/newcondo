// backend/payment-service/src/services/receiptService.ts
import { PrismaClient } from '@newcondo/db';
import PDFDocument from 'pdfkit';
import { format, parseISO } from 'date-fns';
import fs from 'fs';
import path from 'path';

interface ReceiptData {
  paymentId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentType: string;
  status: string;
  transactionId?: string;
  flutterwaveRef?: string;
  paidAt?: Date;
  description?: string;
  
  // User details
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  
  // Property details (for rent payments)
  propertyTitle?: string;
  propertyAddress?: string;
  rentalPeriod?: string;
  
  // Marking job details (for marking payments)
  markingJobId?: string;
  contactPersonName?: string;
  contactPersonPhone?: string;
  
  // Additional fees breakdown
  platformFee?: number;
  agentCommission?: number;
  ownerAmount?: number;
}

interface ReceiptConfig {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  logoPath?: string;
  taxId?: string;
}

export class ReceiptService {
  private prisma: PrismaClient;
  private config: ReceiptConfig;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.config = {
      companyName: 'NewCondo Limited',
      companyAddress: 'Lagos, Nigeria',
      companyPhone: '+234-XXX-XXXX-XXX',
      companyEmail: 'support@newcondo.com',
      companyWebsite: 'www.newcondo.com',
      taxId: 'TAX-12345678'
    };
  }

  /**
   * Generate receipt for a payment
   */
  async generateReceipt(paymentId: string): Promise<{
    success: boolean;
    receiptUrl?: string;
    receiptBuffer?: Buffer;
    error?: string;
  }> {
    try {
      const receiptData = await this.getReceiptData(paymentId);
      if (!receiptData) {
        return {
          success: false,
          error: 'Payment not found'
        };
      }

      const receiptBuffer = await this.createPDFReceipt(receiptData);
      
      // Save receipt to storage (you might want to use cloud storage)
      const receiptFileName = `receipt_${paymentId}_${Date.now()}.pdf`;
      const receiptPath = path.join(process.cwd(), 'receipts', receiptFileName);
      
      // Ensure receipts directory exists
      const receiptsDir = path.dirname(receiptPath);
      if (!fs.existsSync(receiptsDir)) {
        fs.mkdirSync(receiptsDir, { recursive: true });
      }
      
      fs.writeFileSync(receiptPath, receiptBuffer);
      
      // In production, you'd upload to cloud storage and return the URL
      const receiptUrl = `/receipts/${receiptFileName}`;

      return {
        success: true,
        receiptUrl,
        receiptBuffer
      };

    } catch (error) {
      console.error('Error generating receipt:', error);
      return {
        success: false,
        error: 'Failed to generate receipt'
      };
    }
  }

  /**
   * Get receipt data for a payment
   */
  private async getReceiptData(paymentId: string): Promise<ReceiptData | null> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              phone: true
            }
          },
          rental: {
            include: {
              property: {
                select: {
                  title: true,
                  address: true
                }
              },
              unit: {
                select: {
                  unitNumber: true
                }
              }
            }
          }
        }
      });

      if (!payment) {
        return null;
      }

      let markingJobData = null;
      if (payment.markingJobId) {
        markingJobData = await this.prisma.propertyMarkingJob.findUnique({
          where: { id: payment.markingJobId },
          select: {
            contactPersonName: true,
            contactPersonPhone: true,
            property: {
              select: {
                title: true,
                address: true
              }
            }
          }
        });
      }

      const receiptData: ReceiptData = {
        paymentId: payment.id,
        userId: payment.userId,
        amount: payment.amount.toNumber(),
        currency: payment.currency,
        paymentType: payment.paymentType,
        status: payment.status,
        transactionId: payment.transactionId || undefined,
        flutterwaveRef: payment.flutterwaveRef || undefined,
        paidAt: payment.paidAt || undefined,
        description: payment.description || undefined,
        
        userName: payment.user.name || 'N/A',
        userEmail: payment.user.email,
        userPhone: payment.user.phone || 'N/A',
        
        platformFee: payment.platformFee?.toNumber(),
        agentCommission: payment.agentCommission?.toNumber(),
        ownerAmount: payment.ownerAmount?.toNumber()
      };

      // Add rental-specific data
      if (payment.rental) {
        receiptData.propertyTitle = payment.rental.property.title;
        receiptData.propertyAddress = payment.rental.property.address;
        
        if (payment.rental.unit) {
          receiptData.propertyTitle += ` - Unit ${payment.rental.unit.unitNumber}`;
        }
        
        // Calculate rental period
        const startDate = format(payment.rental.startDate, 'MMM dd, yyyy');
        const endDate = payment.rental.endDate ? format(payment.rental.endDate, 'MMM dd, yyyy') : 'Ongoing';
        receiptData.rentalPeriod = `${startDate} - ${endDate}`;
      }

      // Add marking job data
      if (markingJobData) {
        receiptData.markingJobId = payment.markingJobId!;
        receiptData.contactPersonName = markingJobData.contactPersonName;
        receiptData.contactPersonPhone = markingJobData.contactPersonPhone;
        receiptData.propertyTitle = markingJobData.property.title;
        receiptData.propertyAddress = markingJobData.property.address;
      }

      return receiptData;

    } catch (error) {
      console.error('Error getting receipt data:', error);
      return null;
    }
  }

  /**
   * Create PDF receipt
   */
  private async createPDFReceipt(data: ReceiptData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      try {
        this.addHeader(doc);
        this.addReceiptTitle(doc, data);
        this.addCustomerInfo(doc, data);
        this.addPaymentDetails(doc, data);
        this.addItemDetails(doc, data);
        this.addAmountBreakdown(doc, data);
        this.addFooter(doc);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private addHeader(doc: PDFKit.PDFDocument) {
    // Company logo (if available)
    if (this.config.logoPath && fs.existsSync(this.config.logoPath)) {
      doc.image(this.config.logoPath, 50, 45, { width: 50 });
    }

    // Company details
    doc.fontSize(20)
       .text(this.config.companyName, 110, 57)
       .fontSize(10)
       .text(this.config.companyAddress, 110, 80)
       .text(this.config.companyPhone, 110, 95)
       .text(this.config.companyEmail, 110, 110);

    // Receipt title
    doc.fontSize(20)
       .text('PAYMENT RECEIPT', 400, 57, { align: 'right' });

    // Move to next section
    doc.moveDown();
  }

  private addReceiptTitle(doc: PDFKit.PDFDocument, data: ReceiptData) {
    const currentY = doc.y + 20;
    
    doc.fontSize(12)
       .text(`Receipt #: ${data.paymentId.substring(0, 8).toUpperCase()}`, 50, currentY)
       .text(`Date: ${data.paidAt ? format(data.paidAt, 'MMM dd, yyyy HH:mm') : format(new Date(), 'MMM dd, yyyy HH:mm')}`, 400, currentY, { align: 'right' });

    if (data.transactionId) {
      doc.text(`Transaction ID: ${data.transactionId}`, 50, currentY + 15);
    }

    if (data.flutterwaveRef) {
      doc.text(`Flutterwave Ref: ${data.flutterwaveRef}`, 50, currentY + 30);
    }

    doc.moveDown(3);
  }

  private addCustomerInfo(doc: PDFKit.PDFDocument, data: ReceiptData) {
    const currentY = doc.y;
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Bill To:', 50, currentY);

    doc.fontSize(10)
       .font('Helvetica')
       .text(data.userName || 'N/A', 50, currentY + 20)
       .text(data.userEmail, 50, currentY + 35)
       .text(data.userPhone || 'N/A', 50, currentY + 50);

    // Payment status
    const statusColor = this.getStatusColor(data.status);
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(statusColor)
       .text(`Status: ${data.status.toUpperCase()}`, 400, currentY + 20, { align: 'right' })
       .fillColor('black');

    doc.moveDown(4);
  }

  private addPaymentDetails(doc: PDFKit.PDFDocument, data: ReceiptData) {
    const currentY = doc.y;

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Payment Details:', 50, currentY);

    doc.fontSize(10)
       .font('Helvetica')
       .text(`Payment Type: ${this.formatPaymentType(data.paymentType)}`, 50, currentY + 20)
       .text(`Currency: ${data.currency}`, 50, currentY + 35);

    if (data.description) {
      doc.text(`Description: ${data.description}`, 50, currentY + 50);
    }

    doc.moveDown(3);
  }

  private addItemDetails(doc: PDFKit.PDFDocument, data: ReceiptData) {
    const currentY = doc.y;

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Item Details:', 50, currentY);

    let itemY = currentY + 20;

    if (data.propertyTitle) {
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('Property:', 50, itemY)
         .font('Helvetica')
         .text(data.propertyTitle, 120, itemY);
      itemY += 15;
    }

    if (data.propertyAddress) {
      doc.text('Address:', 50, itemY)
         .text(data.propertyAddress, 120, itemY);
      itemY += 15;
    }

    if (data.rentalPeriod) {
      doc.text('Rental Period:', 50, itemY)
         .text(data.rentalPeriod, 120, itemY);
      itemY += 15;
    }

    if (data.contactPersonName) {
      doc.text('Contact Person:', 50, itemY)
         .text(data.contactPersonName, 120, itemY);
      itemY += 15;
    }

    if (data.contactPersonPhone) {
      doc.text('Contact Phone:', 50, itemY)
         .text(data.contactPersonPhone, 120, itemY);
      itemY += 15;
    }

    doc.y = itemY + 10;
    doc.moveDown();
  }

  private addAmountBreakdown(doc: PDFKit.PDFDocument, data: ReceiptData) {
    const currentY = doc.y;
    const tableTop = currentY + 20;

    // Table header
    doc.fontSize(10)
       .font('Helvetica-Bold');

    doc.text('Description', 50, tableTop)
       .text('Amount', 450, tableTop, { align: 'right' });

    // Table line
    doc.moveTo(50, tableTop + 15)
       .lineTo(550, tableTop + 15)
       .stroke();

    let itemY = tableTop + 25;
    doc.font('Helvetica');

    // Main amount
    const paymentTypeFormatted = this.formatPaymentType(data.paymentType);
    doc.text(paymentTypeFormatted, 50, itemY)
       .text(`${data.currency} ${this.formatAmount(data.amount)}`, 450, itemY, { align: 'right' });
    itemY += 15;

    // Breakdown (if applicable)
    if (data.platformFee || data.agentCommission || data.ownerAmount) {
      doc.moveDown();
      itemY += 10;
      
      if (data.ownerAmount) {
        doc.text('  - Amount to Owner', 50, itemY)
           .text(`${data.currency} ${this.formatAmount(data.ownerAmount)}`, 450, itemY, { align: 'right' });
        itemY += 15;
      }

      if (data.agentCommission) {
        doc.text('  - Agent Commission', 50, itemY)
           .text(`${data.currency} ${this.formatAmount(data.agentCommission)}`, 450, itemY, { align: 'right' });
        itemY += 15;
      }

      if (data.platformFee) {
        doc.text('  - Platform Fee', 50, itemY)
           .text(`${data.currency} ${this.formatAmount(data.platformFee)}`, 450, itemY, { align: 'right' });
        itemY += 15;
      }
    }

    // Total line
    itemY += 10;
    doc.moveTo(350, itemY)
       .lineTo(550, itemY)
       .stroke();

    itemY += 10;
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('TOTAL:', 350, itemY)
       .text(`${data.currency} ${this.formatAmount(data.amount)}`, 450, itemY, { align: 'right' });

    doc.y = itemY + 30;
  }

  private addFooter(doc: PDFKit.PDFDocument) {
    const bottomMargin = 50;
    const footerY = doc.page.height - bottomMargin - 60;

    doc.fontSize(8)
       .font('Helvetica')
       .text('Thank you for using NewCondo!', 50, footerY, { align: 'center', width: 500 })
       .text('This is a computer generated receipt and does not require signature.', 50, footerY + 15, { align: 'center', width: 500 })
       .text(`For support, contact us at ${this.config.companyEmail} or visit ${this.config.companyWebsite}`, 50, footerY + 30, { align: 'center', width: 500 });

    if (this.config.taxId) {
      doc.text(`Tax ID: ${this.config.taxId}`, 50, footerY + 45, { align: 'center', width: 500 });
    }
  }

  private formatPaymentType(paymentType: string): string {
    const typeMap: Record<string, string> = {
      'RENT': 'Rent Payment',
      'DEPOSIT': 'Security Deposit',
      'AGENT_COMMISSION': 'Agent Commission',
      'PREMIUM_UPGRADE': 'Premium Upgrade',
      'PROPERTY_MARKING': 'Property Marking Service'
    };

    return typeMap[paymentType] || paymentType.replace('_', ' ');
  }

  private formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  private getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      'SUCCESS': '#22c55e',
      'PENDING': '#f59e0b',
      'FAILED': '#ef4444',
      'CANCELLED': '#6b7280',
      'HELD': '#3b82f6',
      'RELEASED': '#14b8a6',
      'REFUNDED': '#d1d5db',
    };

    return colorMap[status.toUpperCase()] || '#000000';
  }
}

export const receiptService = new ReceiptService(new PrismaClient());