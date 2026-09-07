// Runtime configuration for an already-activated device: which feature
// flags are on, and which banners to show. Requires a device
// token/license identity because feature flags can be scoped per
// company or per plan — the response is different customer to
// customer, unlike /api/v1/app/version which is the same for everyone.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { resolveDeviceFromRequest } from "@/server/licensing/resolve";
import { resolveFeatureFlags } from "@/server/entitlements/feature-flags";

const configSchema = z.object({
  deviceToken: z.string().min(1).optional(),
  licenseKey: z.string().min(10).optional(),
  deviceId: z.string().min(4).optional(),
});

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = configSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ status: "ERROR", message: "Malformed config request." }, { status: 400 });
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

  const planId = license.subscription?.planId ?? null;
  const now = new Date();

  const [featureFlags, banners, homeImageSetting] = await Promise.all([
    resolveFeatureFlags(license.companyId, planId),
    db.banner.findMany({
      where: {
        status: "ACTIVE",
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
      orderBy: { createdAt: "desc" },
    }),
    // Admin -> Application -> Home Screen: lets the desktop app's
    // Home page picture be swapped without a new app release, the
    // same idea as banners. Stored as a plain AppSetting row (see
    // setDesktopHomeImage in server/admin/actions.ts) rather than its
    // own table, since it's a single global value.
    db.appSetting.findUnique({ where: { key: "desktopHomeImageUrl" } }),
  ]);

  // Precedence: an explicit Home Screen override (Admin -> Application
  // -> Home Screen) wins if set; otherwise default to whatever image
  // the currently active banner is using, so "the banner I already set
  // up" is enough on its own without also configuring a separate Home
  // Screen image - Admin -> Application -> Home Screen only needs to
  // be touched at all when a customer wants the Home page picture to
  // differ from the banner's.
  const explicitHomeImageUrl = typeof homeImageSetting?.value === "string" && homeImageSetting.value ? homeImageSetting.value : null;
  const homeImageUrl = explicitHomeImageUrl ?? banners[0]?.imageUrl ?? null;

  return NextResponse.json({
    status: "OK",
    featureFlags,
    banners: banners.map((b) => ({ id: b.id, title: b.title, subtitle: b.subtitle, imageUrl: b.imageUrl, linkUrl: b.linkUrl })),
    homeImageUrl,
  });
}
