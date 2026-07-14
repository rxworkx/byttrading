"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { login, adminLogin, getMe, ApiError } from "@/lib/auth-client";

const schema = z.object({
  identifier: z.string().min(1, "Required"),
  password: z.string().min(1, "Required"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // Already signed in? Skip straight past the login form instead of asking
  // for credentials again.
  useEffect(() => {
    getMe().then((user) => {
      if (user) router.replace("/dashboard");
    });
  }, [router]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      // A value with no "@" is treated as an admin username rather than an
      // email, so the same field logs in either kind of account.
      if (!values.identifier.includes("@")) {
        await adminLogin({ username: values.identifier, password: values.password });
        router.push("/admin");
        return;
      }

      const result = await login({ email: values.identifier, password: values.password });
      if (result.requiresOtp && result.ref) {
        router.push(`/verify-otp?ref=${encodeURIComponent(result.ref)}`);
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Welcome back</h1>
      <p className="mt-3 text-base text-muted-foreground">Log in to your BYT Trading account.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-10">
        <FieldGroup>
          <Field data-invalid={!!errors.identifier}>
            <FieldLabel htmlFor="identifier" className="text-base">Email or username</FieldLabel>
            <Input id="identifier" type="text" autoComplete="username" {...register("identifier")} />
            <FieldError errors={errors.identifier ? [errors.identifier] : undefined} />
          </Field>

          <Field data-invalid={!!errors.password}>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password" className="text-base">Password</FieldLabel>
              <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-foreground">
                Forgot password?
              </Link>
            </div>
            <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
            <FieldError errors={errors.password ? [errors.password] : undefined} />
          </Field>

          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="mt-3 w-full brand-gradient text-background hover:opacity-90"
          >
            {submitting ? "Logging in…" : "Log in"}
          </Button>
        </FieldGroup>
      </form>

      <p className="mt-8 text-center text-base text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
