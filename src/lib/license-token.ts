// Short-lived, signed "device authorization" tokens (PART 68 Phase 7).
// Issued on every successful /license/activate or /license/validate call
// so the desktop app can prove "I already went through activation" on
// its NEXT call (and keep working offline for up to
// LICENSE_TOKEN_TTL_HOURS) without re-sending the raw license key every
// time. The token is a bearer of *identity*, never of *authority* — every
// endpoint that accepts one still re-checks the license/subscription/
// device status fresh from the database before doing anything (PART 66);
// nothing here is ever trusted at face value.
//
// Format: base64url(JSON payload) + "." + base64url(HMAC-SHA256 signature)
// — deliberately not a full JWT library dependency for three fields.

import { createHmac, timingSafeEqual } from "crypto";
import { env } from "@/lib/env";

export type DeviceTokenPayload = {
  licenseId: string;
  deviceId: string;
  companyId: string;
  exp: number; // unix seconds
};

export function isLicenseTokenSigningConfigured(): boolean {
  return Boolean(env.LICENSE_TOKEN_SIGNING_SECRET);
}

function getSigningSecret(): string {
  if (!env.LICENSE_TOKEN_SIGNING_SECRET) {
    throw new Error("LICENSE_TOKEN_SIGNING_SECRET is not configured.");
  }
  return env.LICENSE_TOKEN_SIGNING_SECRET;
}

function base64url(input: Buffer): string {
  return input.toString("base64url");
}

export function signDeviceToken(payload: Omit<DeviceTokenPayload, "exp">): { token: string; expiresAt: Date } {
  const exp = Math.floor(Date.now() / 1000) + Math.round(env.LICENSE_TOKEN_TTL_HOURS * 60 * 60);
  const fullPayload: DeviceTokenPayload = { ...payload, exp };

  const payloadPart = base64url(Buffer.from(JSON.stringify(fullPayload)));
  const signature = createHmac("sha256", getSigningSecret()).update(payloadPart).digest();
  const signaturePart = base64url(signature);

  return { token: `${payloadPart}.${signaturePart}`, expiresAt: new Date(exp * 1000) };
}

export function verifyDeviceToken(token: string): DeviceTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadPart, signaturePart] = parts;
  if (!payloadPart || !signaturePart) return null;

  let expectedSignature: Buffer;
  let providedSignature: Buffer;
  try {
    expectedSignature = createHmac("sha256", getSigningSecret()).update(payloadPart).digest();
    providedSignature = Buffer.from(signaturePart, "base64url");
  } catch {
    return null;
  }

  if (expectedSignature.length !== providedSignature.length || !timingSafeEqual(expectedSignature, providedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8")) as DeviceTokenPayload;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // expired
    }
    if (!payload.licenseId || !payload.deviceId || !payload.companyId) return null;
    return payload;
  } catch {
    return null;
  }
}
