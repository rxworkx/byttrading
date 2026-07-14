"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES, findCountry } from "@/lib/countries";

interface CountrySelectProps {
  value: string | null;
  onChange: (code: string) => void;
  id?: string;
}

export function CountrySelect({ value, onChange, id }: CountrySelectProps) {
  const selected = findCountry(value);

  return (
    <Select value={value ?? ""} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="Select a country">{selected?.name}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {COUNTRIES.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
