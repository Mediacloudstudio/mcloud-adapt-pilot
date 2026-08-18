"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyLicenseKeyButton({ displayKey }: { displayKey: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      variant="outline"
      size="md"
      onClick={async () => {
        await navigator.clipboard.writeText(displayKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied" : "Copy License Key"}
    </Button>
  );
}
