"use client";

// Loads Razorpay's Checkout.js on demand and drives the full pay flow:
// create order (server decides the price) → open Checkout → verify
// signature server-side → land back on /portal/subscription once the
// subscription is actually active in our own database, not just
// "Razorpay said success" in the browser.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const CHECKOUT_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadCheckoutScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${CHECKOUT_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay Checkout.")));
      return;
    }
    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay Checkout."));
    document.body.appendChild(script);
  });
}

export function CheckoutButton({
  planId,
  planName,
  customerEmail,
  customerName,
  label = "Pay & Activate",
  variant = "primary",
}: {
  planId: string;
  planName: string;
  customerEmail?: string | null;
  customerName?: string | null;
  label?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setStatus("loading");
    setError(null);

    try {
      const orderResponse = await fetch("/api/v1/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const order = await orderResponse.json();
      if (!orderResponse.ok) {
        throw new Error(order.message || "Could not start checkout.");
      }

      await loadCheckoutScript();
      if (!window.Razorpay) {
        throw new Error("Razorpay Checkout failed to load.");
      }

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "MediaCloud Studio",
        description: `${planName} — ${order.companyName}`,
        prefill: { email: customerEmail ?? undefined, name: customerName ?? undefined },
        theme: { color: "#4338ca" },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const verifyResponse = await fetch("/api/v1/billing/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const verifyResult = await verifyResponse.json();
            if (!verifyResponse.ok) {
              throw new Error(verifyResult.message || "Payment verification failed.");
            }
            router.push("/portal/subscription?paid=1");
            router.refresh();
          } catch (verifyError) {
            setStatus("error");
            setError(verifyError instanceof Error ? verifyError.message : "Payment verification failed.");
          }
        },
        modal: {
          ondismiss: () => setStatus("idle"),
        },
      });

      razorpay.open();
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong starting checkout.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant={variant} size="md" disabled={status === "loading"} onClick={startCheckout}>
        {status === "loading" ? "Starting checkout…" : label}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
