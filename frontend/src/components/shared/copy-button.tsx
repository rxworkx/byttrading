"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CopyButton({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Button
      type="button"
      size="icon-sm"
      variant="ghost"
      className={cn("size-6 shrink-0", className)}
      onClick={handleCopy}
    >
      {copied ? <Check className="size-3.5 text-status-good" /> : <Copy className="size-3.5" />}
    </Button>
  );
}
