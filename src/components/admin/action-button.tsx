"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function ActionButton({
  action,
  label,
  pendingLabel,
  variant = "outline",
  confirmMessage,
}: {
  action: () => Promise<{ success: boolean; message: string }>;
  label: string;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  confirmMessage?: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (message) {
    return <span className="text-xs text-ink-500">{message}</span>;
  }

  return (
    <Button
      variant={variant}
      size="md"
      disabled={pending}
      onClick={() => {
        if (confirmMessage && !window.confirm(confirmMessage)) return;
        startTransition(async () => {
          const result = await action();
          setMessage(result.message);
        });
      }}
    >
      {pending ? pendingLabel ?? "Working..." : label}
    </Button>
  );
}
