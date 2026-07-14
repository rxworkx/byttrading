"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Logo } from "@/components/layout/logo";
import { adminLogin, ApiError } from "@/lib/auth-client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminLogin({ username, password });
      router.push("/admin");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16">
      <Logo size="lg" className="mb-10" />

      <div className="w-full max-w-sm">
        <div className="text-center">
          <ShieldCheck className="mx-auto size-8 text-primary" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Admin login</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in with your admin username.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <Field>
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <Input id="username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="w-full brand-gradient text-background hover:opacity-90"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
