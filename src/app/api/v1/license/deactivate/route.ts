// Releases a device's slot on its license — called when a customer
// uninstalls, or moves to a new machine and wants their old one freed
// up. Frees exactly one Device row; never touches any other device on
// the license or any other customer's data.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { resolveDeviceFromRequest } from "@/server/licensing/resolve";

const deactivateSchema = z.object({
  deviceToken: z.string().min(1).optional(),
  licenseKey: z.string().min(10).optional(),
  deviceId: z.string().min(4).optional(),
});

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = deactivateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ status: "ERROR", message: "Malformed deactivation request." }, { status: 400 });
  }

  const resolution = await resolveDeviceFromRequest(parsed.data);
  if ("error" in resolution) {
    return NextResponse.json({ status: "ERROR", message: resolution.error }, { status: 401 });
  }
  const { device } = resolution;

  if (device.status === "ACTIVE") {
    await db.$transaction([
      db.device.update({ where: { id: device.id }, data: { status: "DEACTIVATED", deactivatedAt: new Date() } }),
      db.licenseEvent.create({ data: { licenseId: device.licenseId, deviceId: device.id, event: "DEACTIVATED" } }),
    ]);
  }

  return NextResponse.json({ status: "DEACTIVATED", message: "Device slot released." });
}
