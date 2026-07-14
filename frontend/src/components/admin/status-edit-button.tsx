"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface StatusOption {
  value: string;
  label: string;
  className?: string;
}

interface StatusEditButtonProps {
  value: string;
  options: StatusOption[];
  onChange: (value: string) => void | Promise<void>;
  disabled?: boolean;
}

// One reusable status badge + edit control, used identically for Users,
// Transactions, and Tradings: a small pen icon opens a popover listing the
// selectable statuses, click one to change it.
export function StatusEditButton({ value, options, onChange, disabled }: StatusEditButtonProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const current = options.find((o) => o.value === value);

  async function select(next: string) {
    if (next === value) {
      setOpen(false);
      return;
    }
    setSaving(true);
    try {
      await onChange(next);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <Badge className={`border-0 ${current?.className ?? "bg-secondary text-foreground"}`}>
        {current?.label ?? value}
      </Badge>
      {!disabled ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button variant="outline" size="icon-xs" disabled={saving}>
                <Pencil className="size-3" />
              </Button>
            }
          />
          <PopoverContent align="start" className="w-44 p-1">
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => select(o.value)}
                disabled={saving}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-secondary ${
                  o.value === value ? "font-medium text-foreground" : "text-muted-foreground"
                }`}
              >
                {o.label}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  );
}
