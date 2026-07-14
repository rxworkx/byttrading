"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { forgotPassword } from "@/lib/auth-client";

const schema = z.object({ email: z.string().email("Enter a valid email") });
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      await forgotPassword(values.email);
    } finally {
      setSubmitting(false);
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Check your email</h1>
        <p className="mt-3 text-base text-muted-foreground">
          If an account exists for that address, we&apos;ve sent a password reset link.
        </p>
        <Link href="/login" className="mt-8 inline-block text-base font-medium text-primary hover:underline">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Reset your password</h1>
      <p className="mt-3 text-base text-muted-foreground">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-10">
        <FieldGroup>
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email" className="text-base">Email</FieldLabel>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            <FieldError errors={errors.email ? [errors.email] : undefined} />
          </Field>

          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="mt-3 w-full brand-gradient text-background hover:opacity-90"
          >
            {submitting ? "Sending…" : "Send reset link"}
          </Button>
        </FieldGroup>
      </form>
    </div>
  );
}
