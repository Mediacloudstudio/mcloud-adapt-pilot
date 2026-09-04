// Streams back a freshly-rendered PDF for one of the signed-in company's
// own invoices. No blob storage is configured for this pilot, so rather
// than pre-generating and uploading a file (and wiring up Invoice.pdfUrl),
// this renders the PDF on every request — simple, always reflects the
// current AppSetting billing identity, and cheap at this invoice volume.

import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { renderInvoicePdf } from "@/server/billing/invoice-pdf";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.companyId) {
    return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });
  }

  const invoice = await db.invoice.findUnique({
    where: { id: params.id },
    include: { company: true, subscription: { include: { plan: true } } },
  });

  if (!invoice || invoice.companyId !== session.user.companyId) {
    return NextResponse.json({ message: "Invoice not found." }, { status: 404 });
  }

  const settingsRows = await db.appSetting.findMany({
    where: { key: { in: ["legalName", "gstin", "pan", "registeredAddress", "state"] } },
  });
  const settings = Object.fromEntries(
    settingsRows.map((s: { key: string; value: unknown }) => [s.key, typeof s.value === "string" ? s.value : ""])
  );

  const pdfBuffer = await renderInvoicePdf(invoice, {
    legalName: settings.legalName ?? "",
    gstin: settings.gstin ?? "",
    pan: settings.pan ?? "",
    registeredAddress: settings.registeredAddress ?? "",
    state: settings.state ?? "",
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`,
      "Cache-Control": "private, max-age=0, no-cache",
    },
  });
}
