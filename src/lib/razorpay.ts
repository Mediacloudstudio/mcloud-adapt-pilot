// Razorpay SDK singleton (PART 65 — the desktop app never talks to
// Razorpay directly; only this server-side module does). Keys come from
// env vars and are never sent to the browser except the public key ID,
// which Razorpay's own Checkout.js requires client-side by design.

import Razorpay from "razorpay";
import { env } from "@/lib/env";

let client: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new Error(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment (see .env.example)."
    );
  }
  if (!client) {
    client = new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
  }
  return client;
}

export function isRazorpayConfigured(): boolean {
  return Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
}

// Razorpay amounts are always the smallest currency unit (paise for INR).
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}
