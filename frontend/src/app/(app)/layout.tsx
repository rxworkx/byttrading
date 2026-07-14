"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getMe } from "@/lib/auth-client";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    getMe().then((user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setAuthorized(true);
    });
  }, [router]);

  if (!authorized) return null;

  return <AppShell>{children}</AppShell>;
}
