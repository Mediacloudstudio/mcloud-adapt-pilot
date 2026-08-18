// Which InDesign templates the calling device's company is entitled to
// generate from. Entitlement comes entirely from CustomerTemplate grants
// made in Admin → Templates (Phase 5) — the desktop app never decides
// for itself what it's allowed to run.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { resolveDeviceFromRequest } from "@/server/licensing/resolve";
import { resolveCustomerTemplates } from "@/server/entitlements/templates";

const templatesSchema = z.object({
  deviceToken: z.string().min(1).optional(),
  licenseKey: z.string().min(10).optional(),
  deviceId: z.string().min(4).optional(),
});

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = templatesSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ status: "ERROR", message: "Malformed templates request." }, { status: 400 });
  }

  const resolution = await resolveDeviceFromRequest(parsed.data);
  if ("error" in resolution) {
    return NextResponse.json({ status: "ERROR", message: resolution.error }, { status: 401 });
  }
  const { device } = resolution;
  const { license } = device;

  if (device.status !== "ACTIVE" || license.status !== "ACTIVE") {
    return NextResponse.json({ status: "ERROR", message: "This device or license is not active." }, { status: 403 });
  }

  const templates = await resolveCustomerTemplates(license.companyId);
  return NextResponse.json({ status: "OK", templates });
}
