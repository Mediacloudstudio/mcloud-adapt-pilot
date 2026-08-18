"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deactivateDevice } from "@/server/portal/actions";

export function DeactivateDeviceButton({ deviceId }: { deviceId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (message) {
    return <span className="text-xs text-ink-500">{message}</span>;
  }

  return (
    <Button
      variant="ghost"
      size="md"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await deactivateDevice(deviceId);
          setMessage(result.message);
        })
      }
    >
      {pending ? "Deactivating..." : "Deactivate"}
    </Button>
  );
}
