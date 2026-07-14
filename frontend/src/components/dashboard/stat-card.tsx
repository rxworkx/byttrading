import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface StatDetail {
  label: string;
  value: ReactNode;
}

export function StatCard({
  label,
  value,
  details,
  extra,
  cta,
  gradient,
  className,
}: {
  label: string;
  value: ReactNode;
  details?: StatDetail[];
  extra?: ReactNode;
  cta?: ReactNode;
  gradient?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-2xl border border-hairline p-5",
        gradient ? "brand-gradient text-background" : "bg-surface",
        className,
      )}
    >
      <p className={cn("text-sm", gradient ? "text-background/80" : "text-muted-foreground")}>{label}</p>
      <div className="text-tabular mt-2 flex flex-wrap items-center gap-3 text-3xl font-semibold">{value}</div>

      {details && details.length > 0 ? (
        <dl
          className={cn(
            "mt-4 grid grid-cols-2 gap-3 border-t pt-4",
            gradient ? "border-background/20" : "border-hairline",
          )}
        >
          {details.map((detail) => (
            <div key={detail.label}>
              <dt className={cn("text-xs", gradient ? "text-background/70" : "text-muted-foreground")}>
                {detail.label}
              </dt>
              <dd className="text-tabular mt-0.5 text-sm font-semibold">{detail.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {extra ? <div className="mt-4">{extra}</div> : null}

      {cta ? <div className="mt-auto pt-4">{cta}</div> : null}
    </div>
  );
}
