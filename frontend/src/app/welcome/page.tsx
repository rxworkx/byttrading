"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { getMe, type PublicUser } from "@/lib/auth-client";

export default function WelcomePage() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);

  useEffect(() => {
    getMe().then((me) => {
      if (!me) {
        router.push("/login");
        return;
      }
      setUser(me);
    });
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16">
      <Logo size="lg" className="mb-10" />

      <div className="w-full max-w-md text-center">
        <PartyPopper className="mx-auto size-10 text-primary" />
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          Welcome{user ? `, ${user.firstName}` : ""}!
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          We are so glad to have you with us. Your account is ready, take a look around.
        </p>

        <Button
          size="lg"
          className="mt-8 w-full brand-gradient text-background hover:opacity-90"
          onClick={() => router.push("/dashboard")}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
