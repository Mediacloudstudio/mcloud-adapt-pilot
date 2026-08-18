// Public version check — deliberately does NOT require a device token.
// A brand-new install has no license yet and still needs to know "is
// there a newer installer, and am I even allowed to run at all" before
// a customer has entered a license key.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const versionCheckSchema = z.object({
  currentVersion: z.string().min(1).optional(),
  platform: z.enum(["WINDOWS", "MACOS"]).default("WINDOWS"),
});

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => ({}));
  const parsed = versionCheckSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ status: "ERROR", message: "Malformed version check request." }, { status: 400 });
  }

  const latest = await db.appVersion.findFirst({
    where: { platform: parsed.data.platform },
    orderBy: { publishedAt: "desc" },
  });

  if (!latest) {
    return NextResponse.json({ status: "NO_VERSIONS_PUBLISHED" }, { status: 404 });
  }

  const currentVersion = parsed.data.currentVersion;
  const updateAvailable = currentVersion ? compareVersions(currentVersion, latest.version) < 0 : true;
  const updateRequired = currentVersion ? compareVersions(currentVersion, latest.minimumSupportedVersion) < 0 : false;

  return NextResponse.json({
    status: "OK",
    latestVersion: latest.version,
    minimumSupportedVersion: latest.minimumSupportedVersion,
    mandatory: latest.mandatory,
    installerUrl: latest.installerUrl,
    releaseNotes: latest.releaseNotes,
    updateAvailable,
    // True when the caller's current version has fallen below what the
    // server will still accept — desktop app should block usage (not
    // just nag) until updated.
    updateRequired,
  });
}

// Simple dotted-numeric semver comparator ("2.10.0" > "2.9.0"). Falls
// back to treating missing segments as 0.
function compareVersions(a: string, b: string): number {
  const partsA = a.split(".").map((n) => parseInt(n, 10) || 0);
  const partsB = b.split(".").map((n) => parseInt(n, 10) || 0);
  const length = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < length; i++) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
    if (diff !== 0) return diff < 0 ? -1 : 1;
  }
  return 0;
}
