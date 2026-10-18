// backend/payment-service/src/services/receipt.service.ts
// ============================================================
// Branded PDF receipts. buildReceiptData() is the canonical payload (the UI
// renders it inline); generateReceiptPdf() renders with pdfkit, caches the
// file in S3 under receipts/, and returns a short-lived presigned URL so
// repeat downloads don't re-render.
//
// Ownership: only the payer, the property owner, or the listing agent on the
// rental may fetch a receipt.
//
// BUILD REQUIREMENTS (previous failures were missing deps/exports):
//   pnpm --filter @newcondo/payment-service add pdfkit @aws-sdk/client-s3
//   pnpm --filter @newcondo/payment-service add -D @types/pdfkit
//   backend/shared/src/utils/index.ts must `export * from "./s3Upload"`.
// ============================================================
import PDFDocument from "pdfkit";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@newcondo/db";
import { forbidden, notFound, presignDownload, PRIVATE_BUCKET } from "@newcondo/backend-shared";

// Lazy client — constructing S3Client at module load throws "Region is
// missing" before dotenv runs (it crashes the whole combined-backend boot).
let _s3: S3Client | null = null;
const s3 = (): S3Client => (_s3 ??= new S3Client({ region: process.env.AWS_REGION || "eu-west-1" }));
const BUCKET = PRIVATE_BUCKET;
const ngn = (n: number) => `NGN ${Math.abs(n).toLocaleString("en-NG")}`;

async function getOwnedPayment(paymentId: string, callerId: string) {
  const p = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      user: { select: { name: true, email: true } },
      rental: { include: { property: { select: { title: true, ownerId: true, agentId: true } } } },
    },
  });
  if (!p) throw notFound("Transaction not found");
  const party = p.userId === callerId || p.rental?.property.ownerId === callerId || p.rental?.property.agentId === callerId;
  if (!party) throw forbidden("You are not a party to this transaction");
  return p;
}

export interface ReceiptData {
  reference: string; date: Date; type: string; description: string;
  amount: number; fee: number | null; net: number; status: string;
  /** ++ FLW FEES — Flutterwave cost passed to the user (separate line on the receipt) */
  processingFee: number | null;
  channel: string; payer: string | null; property: string | null; escrowWindow: string | null;
}

export async function buildReceiptData(paymentId: string, callerId: string): Promise<ReceiptData> {
  const p = await getOwnedPayment(paymentId, callerId);
  return {
    reference: p.flutterwaveRef ?? p.id,
    date: p.paidAt ?? p.createdAt,
    type: p.paymentType,
    description: p.description ?? p.paymentType,
    amount: Number(p.amount),
    fee: p.platformFee != null ? Number(p.platformFee) : null,
    processingFee: p.processingFee != null ? Number(p.processingFee) : null,
    net: Number(p.ownerAmount ?? p.amount),
    status: p.status,
    channel: "Flutterwave · virtual account",
    payer: p.user?.name ?? null,
    property: p.rental?.property.title ?? null,
    escrowWindow: p.paymentType === "RENT" ? "24 hours" : null,
  };
}

export async function generateReceiptPdf(paymentId: string, callerId: string): Promise<{ url: string }> {
  const p = await getOwnedPayment(paymentId, callerId);
  const key = p.receiptKey ?? `receipts/${p.userId}/${p.flutterwaveRef ?? p.id}.pdf`;

  if (!p.receiptKey) {
    const data = await buildReceiptData(paymentId, callerId);
    const pdf = await renderPdf(data);
    await s3().send(new PutObjectCommand({
      Bucket: BUCKET, Key: key, Body: pdf, ContentType: "application/pdf", ServerSideEncryption: "AES256",
    }));
    await prisma.payment.update({ where: { id: paymentId }, data: { receiptKey: key } });
  }
  return { url: await presignDownload(key, 600) };
}

function renderPdf(d: ReceiptData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A5", margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Brand: ink #131313 header, cream wordmark, Helvetica stand-in for Geist
    doc.rect(0, 0, doc.page.width, 70).fill("#131313");
    doc.fill("#F9F9EF").fontSize(18).font("Helvetica-Bold").text("newcondo", 40, 26);
    doc.fill("#131313").moveDown(3);
    doc.fontSize(11).font("Helvetica-Bold").text("Transaction receipt");
    doc.fontSize(9).font("Helvetica").fillColor("#555").text(new Date(d.date).toUTCString());
    doc.moveDown();

    const row = (k: string, v: string | null) => {
      if (v == null) return;
      doc.fillColor("#888").text(k, { continued: true }).fillColor("#131313").text(`  ${v}`, { align: "right" });
    };
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

    doc.moveDown(2).fontSize(8).fillColor("#888").text(
      "Escrowed by Newcondo. Never settle rent off-platform — protection only applies to payments made through your Newcondo dashboard."
    );
    doc.end();
  });
}
