// Called periodically by the desktop app (typically on launch) to
// re-confirm everything is still in good standing and to refresh its
// offline device token before the old one expires. Every field in the
// response is read fresh from the database on this call — a client
// presenting a still-cryptographically-valid token from yesterday gets
// today's actual status, not whatever the token's payload happened to
// say when it was issued (PART 66).

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { signDeviceToken, isLicenseTokenSigningConfigured } from "@/lib/license-token";
import { resolveDeviceFromRequest } from "@/server/licensing/resolve";
import { resolveDeviceLimit, countActiveDevices } from "@/server/licensing/device-limit";

const validateSchema = z.object({
  deviceToken: z.string().min(1).optional(),
  licenseKey: z.string().min(10).optional(),
  deviceId: z.string().min(4).optional(),
});

export async function POST(request: NextRequest) {
  if (!isLicenseTokenSigningConfigured()) {
    return NextResponse.json({ status: "ERROR", message: "Licensing is not configured on this environment yet." }, { status: 503 });
  }

  const json = await request.json().catch(() => null);
  const parsed = validateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ status: "ERROR", message: "Malformed validation request." }, { status: 400 });
  }

  const resolution = await resolveDeviceFromRequest(parsed.data);
  if ("error" in resolution) {
    return NextResponse.json({ status: "ERROR", message: resolution.error }, { status: 401 });
  }
  const { device } = resolution;
  const { license } = device;

  if (device.status !== "ACTIVE") {
    return NextResponse.json({ status: "DEVICE_INACTIVE", message: `This device is ${device.status.toLowerCase()}. Re-activate to continue.` }, { status: 403 });
  }
  if (license.status !== "ACTIVE") {
    return NextResponse.json({ status: "LICENSE_INVALID", message: `License is ${license.status.toLowerCase()}.` }, { status: 403 });
  }

  const subscriptionStatus = license.subscription?.status ?? null;
  const inGoodStanding = subscriptionStatus ? ["ACTIVE", "TRIAL", "GRACE_PERIOD"].includes(subscriptionStatus) : false;
  if (!inGoodStanding) {
    return NextResponse.json(
      { status: "SUBSCRIPTION_INACTIVE", message: "Subscription is not currently in good standing.", subscriptionStatus },
      { status: 403 }
    );
  }

  await db.device.update({ where: { id: device.id }, data: { lastSeenAt: new Date() } });
  await db.licenseEvent.create({ data: { licenseId: license.id, deviceId: device.id, event: "VALIDATED" } });

  const [deviceLimit, activeDeviceCount] = await Promise.all([resolveDeviceLimit(license.id), countActiveDevices(license.id)]);
  const { token, expiresAt } = signDeviceToken({ licenseId: license.id, deviceId: device.deviceId, companyId: license.companyId });

  return NextResponse.json({
    status: "ACTIVE",
    deviceToken: token,
    tokenExpiresAt: expiresAt.toISOString(),
    subscriptionStatus,
    license: { displayKey: license.displayKey, validUntil: license.validUntil },
    plan: license.subscription ? { name: license.subscription.plan.name, deviceLimit: license.subscription.plan.deviceLimit } : null,
    deviceLimit,
    activeDeviceCount,
  });
}
