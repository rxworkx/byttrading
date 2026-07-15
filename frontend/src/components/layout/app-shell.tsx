"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, LayoutDashboard, LogOut, Menu, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/layout/logo";
import { AccountNav } from "@/components/layout/account-nav";
import { mobileQuickNav } from "@/lib/account-nav";
import { getMe, logout, type PublicUser } from "@/lib/auth-client";
import { notificationsApi } from "@/lib/dashboard-api";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    getMe().then(setUser);
    notificationsApi.mine().then((items) => setHasUnread(items.some((n) => !n.isRead)));
  }, []);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar: the primary account navigation */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-hairline bg-[#071120] md:flex">
        <div className="px-5 py-6">
          <Logo size="sm" />
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <AccountNav pathname={pathname} />
        </div>
        <div className="border-t border-hairline p-4">
          {user ? (
            <p className="px-2 text-sm text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{user.firstName} {user.lastName}</span>
            </p>
          ) : null}
          <Button variant="ghost" className="mt-2 w-full justify-start gap-3 px-2" onClick={handleLogout}>
            <LogOut className="size-5" /> Logout
          </Button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-hairline bg-background/80 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 md:px-8">
            <Logo size="sm" className="md:hidden" />

            <div className="hidden md:block">
              {user ? (
                <p className="text-base text-muted-foreground">
                  Welcome back, <span className="font-medium text-foreground">{user.firstName}</span>
                </p>
              ) : null}
            </div>

            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="icon-lg" className="relative" nativeButton={false} render={<Link href="/notifications" />}>
                <Bell className="size-5" />
                {hasUnread ? (
                  <span className="absolute right-2 top-2 size-2 rounded-full bg-status-critical" />
                ) : null}
              </Button>

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
                  <DropdownMenuItem render={<Link href="/profile" />}>
                    <UserRound className="size-4" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/security" />}>
                    <ShieldCheck className="size-4" /> Security
                  </DropdownMenuItem>
                  {user?.role === "ADMIN" ? (
                    <DropdownMenuItem render={<Link href="/admin" />}>
                      <LayoutDashboard className="size-4" /> Admin panel
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                    <LogOut className="size-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                <Button variant="ghost" size="icon-lg" className="md:hidden" onClick={() => setDrawerOpen(true)}>
                  <Menu className="size-6" />
                </Button>
                <SheetContent side="right" className="w-80 gap-0 p-0">
                  <SheetHeader className="border-b border-hairline px-5 py-6">
                    <SheetTitle>
                      <Logo href={null} size="sm" />
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto px-3 py-4">
                    <AccountNav pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
                  </div>
                  <div className="border-t border-hairline p-4">
                    {user ? (
                      <p className="px-2 text-sm text-muted-foreground">
                        Signed in as <span className="font-medium text-foreground">{user.firstName}</span>
                      </p>
                    ) : null}
                    <Button variant="ghost" className="mt-2 w-full justify-start gap-3 px-2" onClick={handleLogout}>
                      <LogOut className="size-5" /> Logout
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 sm:px-6 md:pb-10 md:pt-8 lg:px-8">
          {children}
        </main>

        {/* Mobile-only quick nav. Supplementary shortcut bar; the sidebar/drawer above is the real navigation. */}
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-surface/95 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-5xl items-center justify-around px-2 py-2">
            {mobileQuickNav.map((tab) => {
              const active = pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-xs ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <tab.icon className="size-5" />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
