"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { resetPassword, ApiError } from "@/lib/auth-client";

const schema = z.object({ newPassword: z.string().min(8, "At least 8 characters") });
type FormValues = z.infer<typeof schema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      await resetPassword({ token, newPassword: values.newPassword });
      setDone(true);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Reset failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Password updated</h1>
        <p className="mt-3 text-base text-muted-foreground">You can now log in with your new password.</p>
        <Link href="/login" className="mt-8 inline-block text-base font-medium text-primary hover:underline">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Set a new password</h1>
      <p className="mt-3 text-base text-muted-foreground">Choose a new password for your account.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-10">
        <FieldGroup>
          <Field data-invalid={!!errors.newPassword}>
            <FieldLabel htmlFor="newPassword" className="text-base">New password</FieldLabel>
            <Input id="newPassword" type="password" autoComplete="new-password" {...register("newPassword")} />
            <FieldError errors={errors.newPassword ? [errors.newPassword] : undefined} />
          </Field>

          <Button
            type="submit"
            size="lg"
            disabled={submitting || !token}
            className="mt-3 w-full brand-gradient text-background hover:opacity-90"
          >
            {submitting ? "Saving…" : "Reset password"}
          </Button>
        </FieldGroup>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
