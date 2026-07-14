import { currencyLabel } from "@/lib/asset-labels";

const CREDIT_TYPES = new Set([
  "DEPOSIT",
  "TRANSFER_IN",
  "PROFIT_CREDIT",
  "PRINCIPAL_RELEASE",
  "REFERRAL_BONUS",
]);
const DEBIT_TYPES = new Set(["WITHDRAWAL", "TRANSFER_OUT", "SUBSCRIPTION", "INVESTMENT_LOCK"]);

// Every other type stores amount as an unsigned magnitude, so direction comes
// from the type itself. ADMIN_ADJUSTMENT is the one exception, an admin can
// credit or debit, so its amount is already signed at the source, use that
// sign directly instead of guessing from the type.
function signFor(type: string, amount: string): "+" | "-" {
  if (CREDIT_TYPES.has(type)) return "+";
  if (DEBIT_TYPES.has(type)) return "-";
  return Number(amount) < 0 ? "-" : "+";
}

// The asset amount plus its USD equivalent muted underneath, used everywhere
// a transaction amount shows up in a list: admin and user facing alike.
export function TransactionAmount({
  amount,
  currencySymbol,
  usdEquivalent,
  type,
  maximumFractionDigits = 6,
  className,
}: {
  amount: string;
  currencySymbol: string;
  usdEquivalent: string | null;
  type: string;
  maximumFractionDigits?: number;
  className?: string;
}) {
  const sign = signFor(type, amount);
  return (
    <div className={className}>
      <p>
        {sign}
        {Math.abs(Number(amount)).toLocaleString(undefined, { maximumFractionDigits })}{" "}
        {currencyLabel(currencySymbol)}
      </p>
      {usdEquivalent ? (
        <p className="mt-0.5 text-xs text-muted-foreground">
          {sign}
          {Math.abs(Number(usdEquivalent)).toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
        </p>
      ) : null}
    </div>
  );
}
