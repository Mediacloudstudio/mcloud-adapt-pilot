// Lightweight liveness ping — cheaper than a full /license/validate
// round trip, called more frequently (e.g. hourly while the app is
// open) purely to keep Device.lastSeenAt fresh so Admin → Devices shows
// accurate activity and stale/abandoned installs are easy to spot.
// Does NOT refresh the offline device token — that only happens on
// activate/validate, which also re-confirm entitlement.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { resolveDeviceFromRequest } from "@/server/licensing/resolve";

const heartbeatSchema = z.object({
  deviceToken: z.string().min(1).optional(),
  licenseKey: z.string().min(10).optional(),
  deviceId: z.string().min(4).optional(),
  appVersion: z.string().max(50).optional(),
});

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = heartbeatSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ status: "ERROR", message: "Malformed heartbeat request." }, { status: 400 });
  }

  const resolution = await resolveDeviceFromRequest(parsed.data);
  if ("error" in resolution) {
    return NextResponse.json({ status: "ERROR", message: resolution.error }, { status: 401 });
  }
  const { device } = resolution;

  if (device.status !== "ACTIVE") {
    return NextResponse.json({ status: "DEVICE_INACTIVE", message: `This device is ${device.status.toLowerCase()}.` }, { status: 403 });
  }

  await db.device.update({
    where: { id: device.id },
    data: { lastSeenAt: new Date(), appVersion: parsed.data.appVersion ?? device.appVersion },
  });

  return NextResponse.json({ status: "OK", serverTime: new Date().toISOString() });
}
