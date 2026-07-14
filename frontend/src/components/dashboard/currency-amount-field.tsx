import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";

export function CurrencyAmountField({
  id,
  label,
  value,
  onChange,
  currencyCode,
  placeholder = "0.00",
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  currencyCode: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          inputMode="decimal"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="flex-1"
        />
        <span className="flex h-11 shrink-0 items-center rounded-lg border border-hairline bg-secondary px-3 text-sm font-medium text-muted-foreground">
          {currencyCode}
        </span>
      </div>
    </Field>
  );
}
