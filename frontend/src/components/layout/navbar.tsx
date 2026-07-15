"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/layout/logo";
import { mainNav } from "@/lib/site-config";
import { getMe, type PublicUser } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Starts logged-out so Login/Sign up render immediately, same as the
  // hero's "Get started" button, instead of waiting on a round trip to the
  // backend first. Swaps to "Dashboard" if getMe() later confirms a session.
  const [user, setUser] = useState<PublicUser | null>(null);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    getMe().then(setUser);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors duration-300",
        scrolled ? "border-hairline bg-background" : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo size="md" />

        <nav className="hidden items-center gap-10 md:flex">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground lg:text-lg"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          {user ? (
            <Button
              size="lg"
              nativeButton={false}
              className="brand-gradient text-background hover:opacity-90"
              render={<Link href="/dashboard">Dashboard</Link>}
            />
          ) : (
            <>
              <Button variant="ghost" size="lg" nativeButton={false} render={<Link href="/login">Login</Link>} />
              <Button
                size="lg"
                nativeButton={false}
                className="brand-gradient text-background hover:opacity-90"
                render={<Link href="/signup">Sign up</Link>}
              />
            </>
          )}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon-lg" className="md:hidden">
                <Menu className="size-6" />
              </Button>
            }
          />
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle>
                <Logo href={null} size="sm" />
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4">
              {mainNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-3 text-base text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-4 flex flex-col gap-3 border-t border-hairline pt-4">
                {user ? (
                  <Button
                    size="lg"
                    className="brand-gradient text-background"
                    nativeButton={false}
                    render={
                      <Link href="/dashboard" onClick={() => setOpen(false)}>
                        Dashboard
                      </Link>
                    }
                  />
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="lg"
                      nativeButton={false}
                      render={
                        <Link href="/login" onClick={() => setOpen(false)}>
                          Login
                        </Link>
                      }
                    />
                    <Button
                      size="lg"
                      className="brand-gradient text-background"
                      nativeButton={false}
                      render={
                        <Link href="/signup" onClick={() => setOpen(false)}>
                          Sign up
                        </Link>
                      }
                    />
                  </>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
