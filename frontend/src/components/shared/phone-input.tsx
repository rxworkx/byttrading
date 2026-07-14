"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES, parsePhone, formatPhone } from "@/lib/countries";

interface PhoneInputProps {
  value: string | null;
  onChange: (phone: string) => void;
  id?: string;
}

// Renders as a dial-code select beside a plain number field, but the two
// combine into one stored string via formatPhone, so callers only ever see
// a single phone value in and out.
export function PhoneInput({ value, onChange, id }: PhoneInputProps) {
  const parsed = parsePhone(value);
  const [dialCode, setDialCode] = useState(parsed.dialCode);
  const [number, setNumber] = useState(parsed.number);

  function update(nextDialCode: string, nextNumber: string) {
    setDialCode(nextDialCode);
    setNumber(nextNumber);
    onChange(formatPhone(nextDialCode, nextNumber));
  }

  return (
    <div className="flex gap-2">
      <Select value={dialCode} onValueChange={(v) => v && update(v, number)}>
        <SelectTrigger className="w-28 shrink-0">
          <SelectValue placeholder="Code">{dialCode}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {COUNTRIES.map((c) => (
            <SelectItem key={c.code} value={c.dialCode}>
              {c.name} ({c.dialCode})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        id={id}
        inputMode="tel"
        placeholder="Phone number"
        value={number}
        onChange={(e) => update(dialCode, e.target.value)}
        className="flex-1"
      />
    </div>
  );
}
