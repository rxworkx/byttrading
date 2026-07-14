"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { getMe } from "@/lib/auth-client";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    getMe().then((user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      if (user.role !== "ADMIN") {
        router.replace("/dashboard");
        return;
      }
      setAuthorized(true);
    });
  }, [router]);

  if (!authorized) return null;

  return <AdminShell>{children}</AdminShell>;
}
