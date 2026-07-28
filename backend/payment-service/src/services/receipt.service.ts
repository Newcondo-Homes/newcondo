// backend/payment-service/src/services/receipt.service.ts
// ============================================================
// Transaction receipts — ALIGNED TO schema.prisma Payment:
//   userId (payer) · flutterwaveRef (reference) · paymentType · platformFee ·
//   ownerAmount (net) · rental → property (title, ownerId, agentId)
//   NEW field required: Payment.receiptKey String? (schema-additions.prisma)
// Ownership: the payer, the property owner, or the listing agent on the
// rental can fetch a receipt.
// PDF via pdfkit, cached to S3 under receipts/, served by presigned URL.
// ============================================================
import PDFDocument from "pdfkit";
import { prisma } from "@newcondo/db";
import { ForbiddenError, NotFoundError } from "@newcondo/backend-shared";
import { presignDownload } from "@newcondo/backend-shared"; // s3Upload util
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET = process.env.S3_BUCKET!;
const ngn = (n: number) => `NGN ${Math.abs(n).toLocaleString("en-NG")}`;

async function getOwnedPayment(paymentId: string, callerId: string) {
  const p = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      user: { select: { name: true, email: true } },
      rental: { include: { property: { select: { title: true, ownerId: true, agentId: true } } } },
    },
  });
  if (!p) throw new NotFoundError("Transaction not found");
  const party = p.userId === callerId || p.rental?.property.ownerId === callerId || p.rental?.property.agentId === callerId;
  if (!party) throw new ForbiddenError("You are not a party to this transaction");
  return p;
}

/** Canonical receipt payload — single source of truth for PDF + UI. */
export async function buildReceiptData(paymentId: string, callerId: string) {
  const p = await getOwnedPayment(paymentId, callerId);
  return {
    reference: p.flutterwaveRef ?? p.id,
    date: p.paidAt ?? p.createdAt,
    type: p.paymentType,
    description: p.description ?? p.paymentType,
    amount: Number(p.amount),
    fee: p.platformFee != null ? Number(p.platformFee) : null,
    net: Number(p.ownerAmount ?? p.amount),
    status: p.status,
    channel: "Flutterwave · virtual account",
    payer: p.user?.name ?? null,
    property: p.rental?.property.title ?? null,
    escrowWindow: p.paymentType === "RENT" ? "24 hours" : null,
  };
}

/** Render → cache to S3 → return a 10-min presigned download URL. */
export async function generateReceiptPdf(paymentId: string, callerId: string): Promise<{ url: string }> {
  const p = await getOwnedPayment(paymentId, callerId);
  const key = `receipts/${p.userId}/${p.flutterwaveRef ?? p.id}.pdf`;
  if (!p.receiptKey) {
    const d = await buildReceiptData(paymentId, callerId);
    const pdf = await renderPdf(d);
    await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: pdf, ContentType: "application/pdf", ServerSideEncryption: "AES256" }));
    await prisma.payment.update({ where: { id: paymentId }, data: { receiptKey: key } });
  }
  return { url: await presignDownload(p.receiptKey ?? key, 600) };
}

function renderPdf(d: Awaited<ReturnType<typeof buildReceiptData>>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A5", margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.rect(0, 0, doc.page.width, 70).fill("#131313");
    doc.fill("#F9F9EF").fontSize(18).font("Helvetica-Bold").text("newcondo", 40, 26);
    doc.fill("#131313").moveDown(3);
    doc.fontSize(11).font("Helvetica-Bold").text("Transaction receipt");
    doc.fontSize(9).font("Helvetica").fillColor("#555").text(new Date(d.date).toUTCString());
    doc.moveDown();
    const row = (k: string, v: string | null) => { if (v == null) return; doc.fillColor("#888").text(k, { continued: true }).fillColor("#131313").text(`  ${v}`, { align: "right" }); };
    row("Reference", d.reference);
    row("Type", d.type);
    row("Description", d.description);
    row("Property", d.property);
    row("Amount", ngn(d.amount));
    if (d.fee != null) row("Platform commission", ngn(d.fee));
    row("Net", ngn(d.net));
    row("Status", d.status);
    row("Channel", d.channel);
    if (d.escrowWindow) row("Escrow window", d.escrowWindow);
    doc.moveDown(2).fontSize(8).fillColor("#888")
      .text("Escrowed by Newcondo. Never settle rent off-platform — protection only applies to payments made through your Newcondo dashboard.");
    doc.end();
  });
}
