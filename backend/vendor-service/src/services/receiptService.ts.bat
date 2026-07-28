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



// import { PrismaClient, Payment, PaymentType } from '@prisma/client';
// import { format } from 'date-fns';
// import PDFDocument from 'pdfkit';
// import { Readable } from 'stream';

// const prisma = new PrismaClient();

// export interface ReceiptData {
//   payment: Payment & {
//     user: {
//       id: string;
//       name: string | null;
//       email: string;
//       phone: string | null;
//     };
//     rental?: {
//       id: string;
//       property: {
//         id: string;
//         title: string;
//         address: string;
//         city: string;
//         state: string;
//       };
//       unit?: {
//         id: string;
//         unitNumber: string;
//       } | null;
//       monthlyRent: number;
//       startDate: Date;
//       endDate: Date | null;
//     } | null;
//   };
//   receiptNumber: string;
//   companyDetails: CompanyDetails;
// }

// export interface CompanyDetails {
//   name: string;
//   address: string;
//   phone: string;
//   email: string;
//   website: string;
//   logo?: string;
// }

// export interface ReceiptOptions {
//   format?: 'pdf' | 'html' | 'json';
//   includeQR?: boolean;
//   watermark?: string;
// }

// export class ReceiptService {
//   private static readonly DEFAULT_COMPANY_DETAILS: CompanyDetails = {
//     name: 'NewCondo Platform',
//     address: '123 Property Street, Lagos, Nigeria',
//     phone: '+234 800 000 0000',
//     email: 'support@newcondo.com',
//     website: 'www.newcondo.com'
//   };

//   /**
//    * Generate a unique receipt number
//    */
//   static generateReceiptNumber(paymentId: string, paymentType: PaymentType): string {
//     const prefix = paymentType === PaymentType.RENT ? 'NCR' :
//                    paymentType === PaymentType.DEPOSIT ? 'NCD' :
//                    paymentType === PaymentType.PROPERTY_MARKING ? 'NCM' : 'NCP';
    
//     const timestamp = format(new Date(), 'yyyyMMdd');
//     const shortId = paymentId.slice(-8).toUpperCase();
    
//     return `${prefix}-${timestamp}-${shortId}`;
//   }

//   /**
//    * Get receipt data for a payment
//    */
//   static async getReceiptData(paymentId: string): Promise<ReceiptData | null> {
//     try {
//       const payment = await prisma.payment.findUnique({
//         where: { id: paymentId },
//         include: {
//           user: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//               phone: true
//             }
//           },
//           rental: {
//             include: {
//               property: {
//                 select: {
//                   id: true,
//                   title: true,
//                   address: true,
//                   city: true,
//                   state: true
//                 }
//               },
//               unit: {
//                 select: {
//                   id: true,
//                   unitNumber: true
//                 }
//               }
//             }
//           }
//         }
//       });

//       if (!payment) {
//         return null;
//       }

//       const receiptNumber = this.generateReceiptNumber(payment.id, payment.paymentType);

//       return {
//         payment,
//         receiptNumber,
//         companyDetails: this.DEFAULT_COMPANY_DETAILS
//       };

//     } catch (error) {
//       console.error('Error fetching receipt data:', error);
//       return null;
//     }
//   }

//   /**
//    * Generate PDF receipt
//    */
//   static async generatePDFReceipt(
//     receiptData: ReceiptData,
//     options: ReceiptOptions = {}
//   ): Promise<Buffer> {
//     return new Promise((resolve, reject) => {
//       try {
//         const doc = new PDFDocument({ margin: 50 });
//         const chunks: Buffer[] = [];

//         doc.on('data', (chunk) => chunks.push(chunk));
//         doc.on('end', () => resolve(Buffer.concat(chunks)));
//         doc.on('error', reject);

//         // Header
//         doc.fontSize(20)
//            .fillColor('#2563eb')
//            .text(receiptData.companyDetails.name, { align: 'center' });

//         doc.fontSize(10)
//            .fillColor('black')
//            .text(receiptData.companyDetails.address, { align: 'center' })
//            .text(`${receiptData.companyDetails.phone} | ${receiptData.companyDetails.email}`, { align: 'center' })
//            .text(receiptData.companyDetails.website, { align: 'center' });

//         doc.moveDown(2);

//         // Receipt Title
//         doc.fontSize(18)
//            .fillColor('#1e40af')
//            .text('PAYMENT RECEIPT', { align: 'center' });

//         doc.moveDown(1);

//         // Receipt Details
//         doc.fontSize(12)
//            .fillColor('black');

//         const leftColumn = 50;
//         const rightColumn = 300;
//         let yPosition = doc.y;

//         // Receipt Info
//         doc.text('Receipt Number:', leftColumn, yPosition)
//            .text(receiptData.receiptNumber, rightColumn, yPosition);

//         yPosition += 20;
//         doc.text('Date:', leftColumn, yPosition)
//            .text(format(receiptData.payment.paidAt || receiptData.payment.createdAt, 'PPP'), rightColumn, yPosition);

//         yPosition += 20;
//         doc.text('Transaction ID:', leftColumn, yPosition)
//            .text(receiptData.payment.transactionId || 'N/A', rightColumn, yPosition);

//         yPosition += 30;

//         // Customer Details
//         doc.fontSize(14)
//            .fillColor('#374151')
//            .text('Customer Information', leftColumn, yPosition);

//         yPosition += 25;
//         doc.fontSize(12)
//            .fillColor('black');

//         doc.text('Name:', leftColumn, yPosition)
//            .text(receiptData.payment.user.name || 'N/A', rightColumn, yPosition);

//         yPosition += 20;
//         doc.text('Email:', leftColumn, yPosition)
//            .text(receiptData.payment.user.email, rightColumn, yPosition);

//         if (receiptData.payment.user.phone) {
//           yPosition += 20;
//           doc.text('Phone:', leftColumn, yPosition)
//               .text(receiptData.payment.user.phone, rightColumn, yPosition);
//         }

//         yPosition += 30;

//         // Property Details (if applicable)
//         if (receiptData.payment.rental) {
//           doc.fontSize(14)
//               .fillColor('#374151')
//               .text('Property Information', leftColumn, yPosition);

//           yPosition += 25;
//           doc.fontSize(12)
//               .fillColor('black');

//           doc.text('Property:', leftColumn, yPosition)
//               .text(receiptData.payment.rental.property.title, rightColumn, yPosition);

//           yPosition += 20;
//           doc.text('Address:', leftColumn, yPosition)
//               .text(`${receiptData.payment.rental.property.address}, ${receiptData.payment.rental.property.city}`, rightColumn, yPosition);

//           if (receiptData.payment.rental.unit) {
//             yPosition += 20;
//             doc.text('Unit:', leftColumn, yPosition)
//                 .text(receiptData.payment.rental.unit.unitNumber, rightColumn, yPosition);
//           }

//           yPosition += 20;
//           doc.text('Rental Period:', leftColumn, yPosition);
          
//           const startDate = format(receiptData.payment.rental.startDate, 'PP');
//           const endDate = receiptData.payment.rental.endDate ?
//                           format(receiptData.payment.rental.endDate, 'PP') : 'Ongoing';
          
//           doc.text(`${startDate} - ${endDate}`, rightColumn, yPosition);

//           yPosition += 30;
//         }

//         // Payment Details
//         doc.fontSize(14)
//            .fillColor('#374151')
//            .text('Payment Details', leftColumn, yPosition);

//         yPosition += 25;
//         doc.fontSize(12)
//            .fillColor('black');

//         doc.text('Payment Type:', leftColumn, yPosition)
//            .text(this.getPaymentTypeDisplay(receiptData.payment.paymentType), rightColumn, yPosition);

//         yPosition += 20;
//         doc.text('Amount:', leftColumn, yPosition)
//            .text(`${receiptData.payment.currency} ${receiptData.payment.amount.toLocaleString()}`, rightColumn, yPosition);

//         yPosition += 20;
//         doc.text('Status:', leftColumn, yPosition)
//            .fillColor('#10b981')
//            .text(receiptData.payment.status, rightColumn, yPosition);

//         yPosition += 20;
//         doc.fillColor('black')
//            .text('Payment Method:', leftColumn, yPosition)
//            .text(receiptData.payment.paymentMethod || 'N/A', rightColumn, yPosition);

//         if (receiptData.payment.description) {
//           yPosition += 20;
//           doc.text('Description:', leftColumn, yPosition)
//               .text(receiptData.payment.description, rightColumn, yPosition);
//         }

//         // Footer
//         yPosition += 50;
//         doc.fontSize(10)
//            .fillColor('#6b7280')
//            .text('Thank you for using NewCondo Platform!', { align: 'center' })
//            .text('This is a computer-generated receipt and does not require a signature.', { align: 'center' });

//         // Watermark
//         if (options.watermark && receiptData.payment.status === 'SUCCESS') {
//           doc.fontSize(72)
//               .fillColor('#10b981', 0.1)
//               .text('PAID', 200, 400, { rotate: -45 });
//         }

//         doc.end();

//       } catch (error) {
//         reject(error);
//       }
//     });
//   }

//   /**
//    * Generate HTML receipt
//    */
//   static generateHTMLReceipt(receiptData: ReceiptData, options: ReceiptOptions = {}): string {
//     const paymentDate = format(receiptData.payment.paidAt || receiptData.payment.createdAt, 'PPP');
//     const isRentalPayment = receiptData.payment.rental;

//     return `
//     <!DOCTYPE html>
//     <html lang="en">
//     <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>Payment Receipt - ${receiptData.receiptNumber}</title>
//         <style>
//             body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
//             .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
//             .company-name { color: #2563eb; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
//             .company-details { color: #666; font-size: 14px; }
//             .receipt-title { color: #1e40af; font-size: 20px; font-weight: bold; text-align: center; margin: 30px 0; }
//             .section { margin-bottom: 30px; }
//             .section-title { color: #374151; font-size: 16px; font-weight: bold; margin-bottom: 15px; }
//             .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
//             .detail-label { font-weight: bold; }
//             .status-success { color: #10b981; font-weight: bold; }
//             .amount { color: #2563eb; font-size: 18px; font-weight: bold; }
//             .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
//             @media print { body { margin: 0; } .no-print { display: none; } }
//         </style>
//     </head>
//     <body>
//         <div class="header">
//             <div class="company-name">${receiptData.companyDetails.name}</div>
//             <div class="company-details">
//                 ${receiptData.companyDetails.address}<br>
//                 ${receiptData.companyDetails.phone} | ${receiptData.companyDetails.email}<br>
//                 ${receiptData.companyDetails.website}
//             </div>
//         </div>

//         <div class="receipt-title">PAYMENT RECEIPT</div>

//         <div class="section">
//             <div class="detail-row">
//                 <span class="detail-label">Receipt Number:</span>
//                 <span>${receiptData.receiptNumber}</span>
//             </div>
//             <div class="detail-row">
//                 <span class="detail-label">Date:</span>
//                 <span>${paymentDate}</span>
//             </div>
//             <div class="detail-row">
//                 <span class="detail-label">Transaction ID:</span>
//                 <span>${receiptData.payment.transactionId || 'N/A'}</span>
//             </div>
//         </div>

//         <div class="section">
//             <div class="section-title">Customer Information</div>
//             <div class="detail-row">
//                 <span class="detail-label">Name:</span>
//                 <span>${receiptData.payment.user.name || 'N/A'}</span>
//             </div>
//             <div class="detail-row">
//                 <span class="detail-label">Email:</span>
//                 <span>${receiptData.payment.user.email}</span>
//             </div>
//             ${receiptData.payment.user.phone ? `
//             <div class="detail-row">
//                 <span class="detail-label">Phone:</span>
//                 <span>${receiptData.payment.user.phone}</span>
//             </div>
//             ` : ''}
//         </div>

//         ${isRentalPayment ? `
//         <div class="section">
//             <div class="section-title">Property Information</div>
//             <div class="detail-row">
//                 <span class="detail-label">Property:</span>
//                 <span>${receiptData.payment.rental!.property.title}</span>
//             </div>
//             <div class="detail-row">
//                 <span class="detail-label">Address:</span>
//                 <span>${receiptData.payment.rental!.property.address}, ${receiptData.payment.rental!.property.city}</span>
//             </div>
//             ${receiptData.payment.rental!.unit ? `
//             <div class="detail-row">
//                 <span class="detail-label">Unit:</span>
//                 <span>${receiptData.payment.rental!.unit.unitNumber}</span>
//             </div>
//             ` : ''}
//             <div class="detail-row">
//                 <span class="detail-label">Rental Period:</span>
//                 <span>${format(receiptData.payment.rental!.startDate, 'PP')} - ${receiptData.payment.rental!.endDate ? format(receiptData.payment.rental!.endDate, 'PP') : 'Ongoing'}</span>
//             </div>
//         </div>
//         ` : ''}

//         <div class="section">
//             <div class="section-title">Payment Details</div>
//             <div class="detail-row">
//                 <span class="detail-label">Payment Type:</span>
//                 <span>${this.getPaymentTypeDisplay(receiptData.payment.paymentType)}</span>
//             </div>
//             <div class="detail-row">
//                 <span class="detail-label">Amount:</span>
//                 <span class="amount">${receiptData.payment.currency} ${receiptData.payment.amount.toLocaleString()}</span>
//             </div>
//             <div class="detail-row">
//                 <span class="detail-label">Status:</span>
//                 <span class="status-success">${receiptData.payment.status}</span>
//             </div>
//             <div class="detail-row">
//                 <span class="detail-label">Payment Method:</span>
//                 <span>${receiptData.payment.paymentMethod || 'N/A'}</span>
//             </div>
//             ${receiptData.payment.description ? `
//             <div class="detail-row">
//                 <span class="detail-label">Description:</span>
//                 <span>${receiptData.payment.description}</span>
//             </div>
//             ` : ''}
//         </div>

//         <div class="footer">
//             <p>Thank you for using NewCondo Platform!</p>
//             <p>This is a computer-generated receipt and does not require a signature.</p>
//         </div>

//         <div class="no-print" style="margin-top: 30px; text-align: center;">
//             <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer;">
//                 Print Receipt
//             </button>
//         </div>
//     </body>
//     </html>
//     `;
//   }

//   /**
//    * Generate JSON receipt data
//    */
//   static generateJSONReceipt(receiptData: ReceiptData): object {
//     return {
//       receiptNumber: receiptData.receiptNumber,
//       generatedAt: new Date().toISOString(),
//       payment: {
//         id: receiptData.payment.id,
//         amount: receiptData.payment.amount,
//         currency: receiptData.payment.currency,
//         type: receiptData.payment.paymentType,
//         status: receiptData.payment.status,
//         method: receiptData.payment.paymentMethod,
//         transactionId: receiptData.payment.transactionId,
//         description: receiptData.payment.description,
//         paidAt: receiptData.payment.paidAt,
//         createdAt: receiptData.payment.createdAt
//       },
//       customer: {
//         name: receiptData.payment.user.name,
//         email: receiptData.payment.user.email,
//         phone: receiptData.payment.user.phone
//       },
//       property: receiptData.payment.rental ? {
//         title: receiptData.payment.rental.property.title,
//         address: receiptData.payment.rental.property.address,
//         city: receiptData.payment.rental.property.city,
//         state: receiptData.payment.rental.property.state,
//         unit: receiptData.payment.rental.unit?.unitNumber,
//         rentalPeriod: `${format(receiptData.payment.rental.startDate, 'PP')} - ${receiptData.payment.rental.endDate ? format(receiptData.payment.rental.endDate, 'PP') : 'Ongoing'}`
//       } : undefined,
//       company: this.DEFAULT_COMPANY_DETAILS,
//     };
//   }

//   /**
//    * Helper to get a displayable payment type name
//    */
//   private static getPaymentTypeDisplay(paymentType: PaymentType): string {
//     switch (paymentType) {
//       case PaymentType.RENT:
//         return 'Rent Payment';
//       case PaymentType.DEPOSIT:
//         return 'Security Deposit';
//       case PaymentType.AGENT_COMMISSION:
//         return 'Agent Commission';
//       case PaymentType.PROPERTY_MARKING:
//         return 'Property Marking Fee';
//       case PaymentType.PREMIUM_UPGRADE:
//         return 'Premium Subscription';
//       default:
//         return 'General Payment';
//     }
//   }
// }