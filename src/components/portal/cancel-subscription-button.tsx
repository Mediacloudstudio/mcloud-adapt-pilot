"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cancelSubscription } from "@/server/portal/actions";

export function CancelSubscriptionButton() {
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (message) {
    return <p className="text-sm text-ink-600">{message}</p>;
  }

  if (!confirming) {
    return (
      <Button variant="ghost" onClick={() => setConfirming(true)}>
        Cancel Subscription
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-ink-600">Cancel at the end of the current billing period?</span>
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await cancelSubscription();
            setMessage(result.message);
          })
        }
      >
        {pending ? "Cancelling..." : "Confirm"}
      </Button>
      <Button variant="ghost" onClick={() => setConfirming(false)}>
        Keep Subscription
      </Button>
    </div>
  );
}
