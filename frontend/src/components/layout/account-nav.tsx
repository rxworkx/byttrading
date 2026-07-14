"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { accountNavGroups } from "@/lib/account-nav";

export function AccountNav({
  pathname,
  onNavigate,
  className,
}: {
  pathname: string;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <nav className={cn("flex flex-col gap-6", className)}>
      {accountNavGroups.map((group, i) => (
        <div key={group.label ?? `group-${i}`}>
          {group.label ? (
            <p className="px-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {group.label}
            </p>
          ) : null}
          <div className={cn("flex flex-col gap-1", group.label ? "mt-2" : undefined)}>
            {group.items.map((item) => {
              const active = !item.external && pathname.startsWith(item.href);
              if (item.external) {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <item.icon className="size-5 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    <ExternalLink className="size-3.5 shrink-0" />
                  </a>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-base transition-colors",
                    active
                      ? "bg-secondary font-medium text-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <item.icon className="size-5 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
