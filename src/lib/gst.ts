// GST calculation (PART 32). The rate and MediaCloud's own registered
// state are both stored in AppSetting, not hard-coded, so Finance can
// change the GST rate the day the government changes it without a
// code deploy. Intra-state sales split the rate into CGST+SGST; every
// other state is billed IGST — standard Indian GST treatment.

import { db } from "@/lib/db";

export type GstBreakdown = {
  ratePercent: number;
  taxAmount: number;
  breakdown: Record<string, number>;
};

async function loadGstSettings(): Promise<{ ratePercent: number; homeState: string | null }> {
  const settings = await db.appSetting.findMany({ where: { key: { in: ["gstRatePercent", "state"] } } });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  return {
    ratePercent: Number(map.gstRatePercent ?? 18),
    homeState: typeof map.state === "string" && map.state ? map.state : null,
  };
}

// Given a tax-exclusive subtotal, returns the tax to add on top.
export async function calculateGst(subtotal: number, customerState: string | null | undefined): Promise<GstBreakdown> {
  const { ratePercent, homeState } = await loadGstSettings();

  const taxAmount = round2((subtotal * ratePercent) / 100);
  const isIntraState = Boolean(homeState && customerState && homeState.trim().toLowerCase() === customerState.trim().toLowerCase());

  const breakdown: Record<string, number> = isIntraState
    ? { CGST: round2(taxAmount / 2), SGST: round2(taxAmount / 2) }
    : { IGST: taxAmount };

  return { ratePercent, taxAmount, breakdown };
}

// Given a tax-INCLUSIVE total already charged (e.g. via Razorpay), backs
// out the subtotal and tax breakdown for invoicing.
export async function splitInclusiveTotal(total: number, customerState: string | null | undefined): Promise<GstBreakdown & { subtotal: number }> {
  const { ratePercent, homeState } = await loadGstSettings();

  const subtotal = round2(total / (1 + ratePercent / 100));
  const taxAmount = round2(total - subtotal);
  const isIntraState = Boolean(homeState && customerState && homeState.trim().toLowerCase() === customerState.trim().toLowerCase());

  const breakdown: Record<string, number> = isIntraState
    ? { CGST: round2(taxAmount / 2), SGST: round2(taxAmount / 2) }
    : { IGST: taxAmount };

  return { ratePercent, taxAmount, breakdown, subtotal };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
