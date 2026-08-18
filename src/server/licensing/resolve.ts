// Shared "who is calling" resolution for every licensing endpoint except
// /license/activate (which starts from a bare license key, since no
// device token can exist yet). Accepts either a previously-issued
// deviceToken, or a fallback of {licenseKey, deviceId} for a client
// that lost its stored token. Either way, everything returned here is a
// FRESH read from the database — the token is only ever used to find
// the row, never to answer "is it still valid" (PART 66).

import { createHash } from "crypto";
import { db } from "@/lib/db";
import { verifyDeviceToken } from "@/lib/license-token";

export type ResolvedDevice = Awaited<ReturnType<typeof loadDevice>>;

async function loadDevice(licenseId: string, deviceId: string) {
  return db.device.findFirst({
    where: { licenseId, deviceId },
    include: {
      license: { include: { company: true, subscription: { include: { plan: true } } } },
    },
  });
}

export async function resolveDeviceFromRequest(input: {
  deviceToken?: string;
  licenseKey?: string;
  deviceId?: string;
}): Promise<{ device: NonNullable<ResolvedDevice> } | { error: string }> {
  if (input.deviceToken) {
    const payload = verifyDeviceToken(input.deviceToken);
    if (!payload) return { error: "Device token is invalid or expired. Re-activate to obtain a new one." };

    const device = await loadDevice(payload.licenseId, payload.deviceId);
    if (!device) return { error: "Device not found." };
    return { device };
  }

  if (input.licenseKey && input.deviceId) {
    const keyHash = createHash("sha256").update(input.licenseKey.trim()).digest("hex");
    const license = await db.license.findUnique({ where: { licenseKeyHash: keyHash } });
    if (!license) return { error: "Invalid license key." };

    const device = await loadDevice(license.id, input.deviceId);
    if (!device) return { error: "Device not found. Activate this device first." };
    return { device };
  }

  return { error: "Provide either a deviceToken or a licenseKey + deviceId." };
}
