// Desktop-app-facing license activation (PART 68 Phase 7). The Python
// client calls this once per install with the license key a customer
// pasted in from their portal. Everything that matters — is the key
// real, is the subscription paid up, is there a free device slot — is
// decided here from the database, never from anything the client
// asserts about itself (PART 53/66). The desktop app never talks to
// Razorpay or sees another customer's data; this is its only gateway.

import { createHash } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getClientIp } from "@/lib/request-ip";
import { checkRateLimit, recordAttempt } from "@/lib/rate-limit";
import { signDeviceToken, isLicenseTokenSigningConfigured } from "@/lib/license-token";
import { resolveDeviceLimit, countActiveDevices } from "@/server/licensing/device-limit";

const activateSchema = z.object({
  licenseKey: z.string().min(10),
  deviceId: z.string().min(4).max(200),
  fingerprint: z.string().min(4).max(500),
  deviceName: z.string().max(200).optional(),
  computerName: z.string().max(200).optional(),
  os: z.string().max(200).optional(),
  appVersion: z.string().max(50).optional(),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  // License-key guessing protection — generous enough for a legitimate
  // install-time retry loop, tight enough to blunt brute-forcing keys.
  const rateLimitKey = `license-activate:ip:${ip}`;
  const limit = await checkRateLimit(rateLimitKey, { maxAttempts: 20, windowMs: 60 * 60 * 1000 });
  if (limit.blocked) {
    return NextResponse.json({ status: "ERROR", message: "Too many activation attempts. Try again later." }, { status: 429 });
  }

  if (!isLicenseTokenSigningConfigured()) {
    return NextResponse.json({ status: "ERROR", message: "Licensing is not configured on this environment yet." }, { status: 503 });
  }

  const json = await request.json().catch(() => null);
  const parsed = activateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ status: "ERROR", message: "Malformed activation request." }, { status: 400 });
  }
  await recordAttempt(rateLimitKey);

  const { licenseKey, deviceId, fingerprint, deviceName, computerName, os, appVersion } = parsed.data;
  const licenseKeyHash = createHash("sha256").update(licenseKey.trim()).digest("hex");
  const fingerprintHash = createHash("sha256").update(fingerprint.trim()).digest("hex");

  const license = await db.license.findUnique({
    where: { licenseKeyHash },
    include: { company: true, subscription: { include: { plan: true } } },
  });

  if (!license) {
    return NextResponse.json({ status: "ERROR", message: "Invalid license key." }, { status: 404 });
  }
  if (license.status !== "ACTIVE") {
    return NextResponse.json({ status: "ERROR", message: `This license is ${license.status.toLowerCase()}. Contact your account admin.` }, { status: 403 });
  }
  if (!["ACTIVE", "TRIAL", "GRACE_PERIOD"].includes(license.subscription?.status ?? "")) {
    return NextResponse.json(
      { status: "ERROR", message: "This company's subscription is not currently in good standing. Contact your account admin." },
      { status: 403 }
    );
  }

  // Idempotent re-activation: the same device (by its stable deviceId)
  // activating again just refreshes its fingerprint/metadata instead of
  // consuming a second device slot.
  const existingDevice = await db.device.findFirst({ where: { licenseId: license.id, deviceId } });

  if (existingDevice && existingDevice.status === "ACTIVE") {
    await db.device.update({
      where: { id: existingDevice.id },
      data: { fingerprintHash, deviceName, computerName, os, appVersion, lastSeenAt: new Date() },
    });
    const { token, expiresAt } = signDeviceToken({ licenseId: license.id, deviceId, companyId: license.companyId });
    return NextResponse.json(buildActivationResponse(license, token, expiresAt, "Device re-activated."));
  }

  const deviceLimit = await resolveDeviceLimit(license.id);
  const activeCount = await countActiveDevices(license.id);

  if (!existingDevice && activeCount >= deviceLimit) {
    await db.licenseEvent.create({
      data: { licenseId: license.id, event: "DEVICE_LIMIT_REJECTED", detail: `deviceId=${deviceId}`, ipAddress: ip },
    });
    return NextResponse.json(
      { status: "ERROR", message: `Device limit reached (${activeCount}/${deviceLimit}). Deactivate another device first.` },
      { status: 409 }
    );
  }

  const device = existingDevice
    ? await db.device.update({
        where: { id: existingDevice.id },
        data: { status: "ACTIVE", fingerprintHash, deviceName, computerName, os, appVersion, deactivatedAt: null, lastSeenAt: new Date() },
      })
    : await db.device.create({
        data: { licenseId: license.id, companyId: license.companyId, deviceId, fingerprintHash, deviceName, computerName, os, appVersion },
      });

  await db.licenseEvent.create({
    data: { licenseId: license.id, deviceId: device.id, event: "ACTIVATED", detail: `deviceId=${deviceId}`, ipAddress: ip },
  });

  const { token, expiresAt } = signDeviceToken({ licenseId: license.id, deviceId, companyId: license.companyId });
  return NextResponse.json(buildActivationResponse(license, token, expiresAt, "Device activated."));
}

function buildActivationResponse(
  license: { displayKey: string; validUntil: Date | null; subscription: { status: string; plan: { name: string; deviceLimit: number } } | null; company: { companyName: string } },
  deviceToken: string,
  tokenExpiresAt: Date,
  message: string
) {
  return {
    status: "ACTIVE",
    message,
    deviceToken,
    tokenExpiresAt: tokenExpiresAt.toISOString(),
    license: { displayKey: license.displayKey, validUntil: license.validUntil },
    plan: license.subscription ? { name: license.subscription.plan.name, deviceLimit: license.subscription.plan.deviceLimit } : null,
    subscriptionStatus: license.subscription?.status ?? null,
    company: { name: license.company.companyName },
  };
}
