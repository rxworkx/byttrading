import Image from "next/image";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SubscriptionPaymentOption } from "@/lib/dashboard-api";
import { assetIconSrc, currencyLabel } from "@/lib/asset-labels";

// Same look as WalletSelect, but for the company's accepted payment tokens
// rather than the user's own wallets, so there is no balance to show.
export function PaymentAssetSelect({
  options,
  value,
  onChange,
  placeholder = "Select a token",
}: {
  options: SubscriptionPaymentOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const selected = options.find((option) => option.symbol === value);

  return (
    <Select value={value} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder}>
          {selected ? (
            <>
              {assetIconSrc(selected.symbol) ? (
                <Image
                  src={assetIconSrc(selected.symbol)!}
                  alt=""
                  width={18}
                  height={18}
                  className="size-[18px] shrink-0 object-contain"
                />
              ) : null}
              {selected.name} ({currencyLabel(selected.symbol)})
            </>
          ) : (
            placeholder
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => {
          const icon = assetIconSrc(option.symbol);
          return (
            <SelectItem key={option.symbol} value={option.symbol}>
              {icon ? (
                <Image src={icon} alt="" width={18} height={18} className="size-[18px] shrink-0 object-contain" />
              ) : null}
              {option.name} ({currencyLabel(option.symbol)})
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
