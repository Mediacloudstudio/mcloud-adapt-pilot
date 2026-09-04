// Generates a tax invoice PDF on demand (PART 32 follow-up). No blob
// storage is wired up for this pilot, so Invoice.pdfUrl stays unused —
// the PDF is built fresh from the database every time it's requested,
// which is simple, always up to date, and cheap at this volume.

import PDFDocument from "pdfkit";

// Hand-written rather than derived from the generated Prisma types
// (Prisma.InvoiceGetPayload etc.) — this only lists the fields the PDF
// actually reads, so it stays correct by structural typing no matter how
// the generated client's own type exports are shaped, and callers can
// pass a real Prisma query result straight through.
type InvoiceForPdf = {
  invoiceNumber: string;
  invoiceDate: Date;
  subtotal: unknown; // Decimal(12,2) at runtime — see money() below
  taxAmount: unknown;
  total: unknown;
  taxBreakdown: unknown; // Json column: Record<string, number> shape
  customerGstin: string | null;
  billingPeriodStart: Date | null;
  billingPeriodEnd: Date | null;
  company: {
    companyName: string;
    legalName: string | null;
    billingAddress: string | null;
    state: string | null;
  };
  subscription: { plan: { name: string } } | null;
};

type SellerDetails = {
  legalName: string;
  gstin: string;
  pan: string;
  registeredAddress: string;
  state: string;
};

const INR = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Invoice.subtotal/taxAmount/total are Prisma Decimal(12,2) columns, which
// come back as Decimal.js-like objects at runtime (not plain numbers) —
// Number(value) works for both that and a plain number/string.
function money(value: unknown): string {
  return `Rs. ${INR.format(Number(value))}`;
}

export async function renderInvoicePdf(invoice: InvoiceForPdf, seller: SellerDetails): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  // ── Header ────────────────────────────────────────────────────────
  doc.fontSize(18).font("Helvetica-Bold").text("TAX INVOICE", { align: "right" });
  doc.moveDown(0.3);
  doc.fontSize(10).font("Helvetica").fillColor("#555555").text(invoice.invoiceNumber, { align: "right" });
  doc.text(
    new Date(invoice.invoiceDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    { align: "right" }
  );
  doc.fillColor("#000000");
  doc.moveUp(3);

  doc.fontSize(16).font("Helvetica-Bold").text(seller.legalName || "MediaCloud Studio Pvt Ltd");
  doc.fontSize(9).font("Helvetica").fillColor("#444444");
  if (seller.registeredAddress) doc.text(seller.registeredAddress, { width: 300 });
  if (seller.gstin) doc.text(`GSTIN: ${seller.gstin}`);
  if (seller.pan) doc.text(`PAN: ${seller.pan}`);
  doc.fillColor("#000000");

  doc.moveDown(1.5);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#dddddd").stroke();
  doc.moveDown(1);

  // ── Bill To ───────────────────────────────────────────────────────
  doc.fontSize(9).font("Helvetica-Bold").text("BILL TO");
  doc.fontSize(10).font("Helvetica-Bold").text(invoice.company.legalName || invoice.company.companyName);
  doc.fontSize(9).font("Helvetica").fillColor("#444444");
  if (invoice.company.billingAddress) doc.text(invoice.company.billingAddress, { width: 300 });
  if (invoice.company.state) doc.text(invoice.company.state);
  if (invoice.customerGstin) doc.text(`GSTIN: ${invoice.customerGstin}`);
  doc.fillColor("#000000");

  doc.moveDown(1.5);

  // ── Line item ─────────────────────────────────────────────────────
  const planName = invoice.subscription?.plan?.name ?? "Subscription";
  const periodLine =
    invoice.billingPeriodStart && invoice.billingPeriodEnd
      ? `${new Date(invoice.billingPeriodStart).toLocaleDateString("en-IN")} – ${new Date(
          invoice.billingPeriodEnd
        ).toLocaleDateString("en-IN")}`
      : "";

  const tableTop = doc.y;
  doc.fontSize(9).font("Helvetica-Bold");
  doc.text("Description", 50, tableTop);
  doc.text("Amount", 450, tableTop, { width: 95, align: "right" });
  doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).strokeColor("#dddddd").stroke();

  doc.font("Helvetica").fontSize(9);
  const rowY = tableTop + 24;
  doc.text(planName, 50, rowY, { width: 350 });
  if (periodLine) doc.fillColor("#777777").fontSize(8).text(periodLine, 50, rowY + 13, { width: 350 });
  doc.fillColor("#000000").fontSize(9);
  doc.text(money(invoice.subtotal), 450, rowY, { width: 95, align: "right" });

  doc.moveDown(4);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#dddddd").stroke();
  doc.moveDown(0.5);

  // ── Totals ────────────────────────────────────────────────────────
  const breakdown = (invoice.taxBreakdown as Record<string, number> | null) ?? {};
  const totalsX = 350;
  let y = doc.y;

  const totalRow = (label: string, value: string, bold = false) => {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 10 : 9);
    doc.text(label, totalsX, y, { width: 100 });
    doc.text(value, 450, y, { width: 95, align: "right" });
    y += bold ? 18 : 15;
  };

  totalRow("Subtotal", money(invoice.subtotal));
  for (const [label, amount] of Object.entries(breakdown)) {
    totalRow(label, money(amount));
  }
  y += 4;
  doc.moveTo(totalsX, y - 2).lineTo(545, y - 2).strokeColor("#dddddd").stroke();
  totalRow("Total", money(invoice.total), true);

  doc.moveDown(3);
  doc.fontSize(8).fillColor("#999999").text(
    "This is a system-generated invoice and does not require a signature.",
    50,
    doc.y,
    { align: "center", width: 495 }
  );

  doc.end();
  return done;
}
