"use client";

import { Suspense, useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  BellPlus,
  Coins,
  Gift,
  LayoutDashboard,
  ListPlus,
  LogOut,
  Receipt,
  Settings,
  ShieldCheck,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/layout/logo";
import { getMe, logout, type PublicUser } from "@/lib/auth-client";
import { notificationsApi, type Notification } from "@/lib/dashboard-api";
import { formatDateTime } from "@/lib/utils";

interface AdminNavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}

interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

const adminNavGroups: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "People",
    items: [
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "KYC Queue", href: "/admin/kyc", icon: ShieldCheck },
      { label: "Send Notification", href: "/admin/send-notification", icon: BellPlus },
    ],
  },
  {
    label: "Trading",
    items: [
      { label: "Active Trades", href: "/admin/tradings?status=active", icon: TrendingUp },
      { label: "Tradings", href: "/admin/tradings", icon: TrendingUp },
      { label: "Subscriptions", href: "/admin/subscriptions", icon: Users },
      { label: "Plans", href: "/admin/plans", icon: ListPlus },
    ],
  },
  {
    label: "Money",
    items: [
      { label: "Pending Transactions", href: "/admin/transactions", icon: Receipt },
      { label: "Transactions", href: "/admin/ledger", icon: Receipt },
      { label: "Add Transaction", href: "/admin/add-transaction", icon: ListPlus },
      { label: "Deposits", href: "/admin/ledger?type=DEPOSIT", icon: Receipt },
      { label: "Withdrawals", href: "/admin/ledger?type=WITHDRAWAL", icon: Receipt },
      { label: "Referral Commissions", href: "/admin/ledger?type=REFERRAL_BONUS", icon: Gift },
      { label: "Earnings", href: "/admin/earnings", icon: Coins },
    ],
  },
  {
    label: "Platform",
    items: [
      { label: "Tokens", href: "/admin/tokens", icon: Coins },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

function parseHref(href: string) {
  const [path, queryString] = href.split("?");
  return { path, params: new URLSearchParams(queryString ?? "") };
}

// Nav items that share a path (e.g. /admin/ledger with different ?type=
// values) only differ by a query key, so highlighting has to compare that
// key's value rather than just the pathname, or every item on that path
// lights up together.
const pathKeys = new Map<string, Set<string>>();
for (const group of adminNavGroups) {
  for (const item of group.items) {
    const { path, params } = parseHref(item.href);
    const keys = pathKeys.get(path) ?? new Set<string>();
    for (const key of params.keys()) keys.add(key);
    pathKeys.set(path, keys);
  }
}

function isActive(pathname: string, searchParams: URLSearchParams, href: string) {
  const { path, params } = parseHref(href);
  if (pathname !== path) return false;
  const keys = pathKeys.get(path) ?? new Set<string>();
  for (const key of keys) {
    if ((params.get(key) ?? "") !== (searchParams.get(key) ?? "")) return false;
  }
  return true;
}

function AdminNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <>
      {adminNavGroups.map((group) => (
        <div key={group.label}>
          <p className="px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{group.label}</p>
          <div className="mt-1 space-y-1">
            {group.items.map((item) => {
              const active = isActive(pathname, searchParams, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Suspense fallback={null}>
      <AdminNavLinks onNavigate={onNavigate} />
    </Suspense>
  );
}

function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    notificationsApi.mine().then(setNotifications);
  }, []);

  const hasUnread = notifications.some((n) => !n.isRead);

  async function handleSelect(notification: Notification) {
    if (!notification.isRead) {
      await notificationsApi.markRead(notification.id);
    }
    const userId = notification.metadata?.userId;
    if (typeof userId === "string") {
      router.push(`/admin/users/detail?userId=${userId}`);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button type="button" className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground">
            <Bell className="size-5" />
            {hasUnread ? <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-status-critical" /> : null}
          </button>
        }
      />
      <DropdownMenuContent align="end" sideOffset={8} className="w-80">
        <div className="px-2 py-1.5 text-sm font-medium text-foreground">Notifications</div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">No notifications yet.</div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.slice(0, 20).map((n) => (
              <DropdownMenuItem key={n.id} onClick={() => handleSelect(n)} className="flex flex-col items-start gap-0.5 whitespace-normal">
                <span className={`text-sm font-medium ${n.isRead ? "text-foreground" : "text-primary"}`}>{n.title}</span>
                <span className="text-xs text-muted-foreground">{n.body}</span>
                <span className="text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</span>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);

  useEffect(() => {
    getMe().then(setUser);
  }, []);

  // The admin panel runs its own white/black theme (see .admin-theme in
  // globals.css), independent of the dark theme used everywhere else on the
  // site. Toggled on <html> rather than a wrapper div so portaled content
  // (dialogs, popovers, dropdowns) inherits it too. useLayoutEffect (not
  // useEffect) so the class lands before first paint, minimizing the flash
  // of the wrong theme on navigation.
  //
  // <html> also always carries a permanent "dark" class (this site has no
  // light/dark toggle, :root and .dark share the same values on purpose) —
  // every shadcn component still ships real dark: variants (e.g. the
  // outline Button's dark:bg-input/30), which stay live regardless of our
  // CSS variable overrides and show up as a stray gray fill. Has to come
  // off while admin-theme is active, not just admin-theme added.
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.classList.add("admin-theme");
    return () => {
      root.classList.remove("admin-theme");
      root.classList.add("dark");
    };
  }, []);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="admin-sidebar hidden w-64 shrink-0 flex-col border-r border-hairline bg-surface text-foreground md:flex">
        <div className="px-5 py-6">
          <Logo size="sm" wordmarkClassName="text-foreground" />
          <p className="mt-1 text-xs font-medium text-muted-foreground">Admin</p>
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-4">
          <AdminNav />
        </nav>
        <div className="border-t border-hairline p-4">
          <Button variant="ghost" className="w-full justify-start gap-3 px-2" nativeButton={false} render={<Link href="/dashboard">View user dashboard</Link>} />
          <Button variant="ghost" className="mt-1 w-full justify-start gap-3 px-2" onClick={handleLogout}>
            <LogOut className="size-4" /> Logout
          </Button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-hairline bg-background/80 px-4 backdrop-blur sm:px-6">
          <Logo size="sm" className="md:hidden" wordmarkClassName="text-foreground" />
          <div className="hidden md:block">
            {user ? (
              <p className="text-base text-muted-foreground">
                Welcome back, <span className="font-medium text-foreground">{user.firstName}</span>
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5">
            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="flex size-9 items-center justify-center rounded-full brand-gradient text-sm font-semibold text-background"
                  >
                    {user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : <UserRound className="size-4" />}
                  </button>
                }
              />
              <DropdownMenuContent align="end" sideOffset={8} className="min-w-48">
                {user ? (
                  <div className="px-2 py-1.5 text-sm font-normal text-foreground">
                    {user.firstName} {user.lastName}
                  </div>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/admin/settings" />}>
                  <Settings className="size-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/dashboard" />}>
                  <LayoutDashboard className="size-4" /> View user dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                  <LogOut className="size-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="md:hidden">
              <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/dashboard">Dashboard</Link>} />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 md:py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
