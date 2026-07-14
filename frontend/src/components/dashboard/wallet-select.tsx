import Image from "next/image";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Wallet } from "@/lib/dashboard-api";
import { assetIconSrc, currencyLabel } from "@/lib/asset-labels";

export function WalletSelect({
  wallets,
  value,
  onChange,
  placeholder = "Select a wallet",
}: {
  wallets: Wallet[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const selected = wallets.find((wallet) => wallet.symbol === value);

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
        {wallets.map((wallet) => {
          const icon = assetIconSrc(wallet.symbol);
          return (
            <SelectItem key={wallet.symbol} value={wallet.symbol}>
              {icon ? (
                <Image src={icon} alt="" width={18} height={18} className="size-[18px] shrink-0 object-contain" />
              ) : null}
              {wallet.name} ({currencyLabel(wallet.symbol)}), balance{" "}
              {Number(wallet.balance).toLocaleString(undefined, { maximumFractionDigits: 4 })}
              {" "}(${Number(wallet.usdValue).toLocaleString(undefined, { maximumFractionDigits: 2 })})
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
