// Resolves "how many devices is this license actually allowed to have
// active right now" — never trust anything the desktop client claims
// about its own entitlement; this is always computed fresh from the
// database (PART 53/66). Priority, most specific wins: a per-license
// admin override (Admin → Licenses), then a per-company custom device
// limit (PART 46 enterprise overrides), then the plan's own device
// limit.

import { db } from "@/lib/db";

export async function resolveDeviceLimit(licenseId: string): Promise<number> {
  const license = await db.license.findUniqueOrThrow({
    where: { id: licenseId },
    include: {
      subscription: { include: { plan: true } },
      company: { include: { planOverride: true } },
    },
  });

  if (license.deviceLimitOverride != null) return license.deviceLimitOverride;
  if (license.company.planOverride?.customDeviceLimit != null) return license.company.planOverride.customDeviceLimit;
  return license.subscription?.plan.deviceLimit ?? 1;
}

export async function countActiveDevices(licenseId: string): Promise<number> {
  return db.device.count({ where: { licenseId, status: "ACTIVE" } });
}
