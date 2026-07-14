"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { CountrySelect } from "@/components/shared/country-select";
import { PhoneInput } from "@/components/shared/phone-input";
import { signup, getMe, ApiError } from "@/lib/auth-client";

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});

type FormValues = z.infer<typeof schema>;

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // Already signed in? Skip straight past the signup form instead of asking
  // to create a second account.
  useEffect(() => {
    getMe().then((user) => {
      if (user) router.replace("/dashboard");
    });
  }, [router]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      await signup({
        ...values,
        country: country || undefined,
        phone: phone || undefined,
        referralCode: searchParams.get("ref") ?? undefined,
      });
      toast.success("Account created.");
      router.push("/welcome");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Signup failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Create your account</h1>
      <p className="mt-3 text-base text-muted-foreground">
        Start trading with BYT Trading. Email verification and two factor login are optional extras
        you can turn on later from your security settings.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-10">
        <FieldGroup>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.firstName}>
              <FieldLabel htmlFor="firstName" className="text-base">First name</FieldLabel>
              <Input id="firstName" {...register("firstName")} />
              <FieldError errors={errors.firstName ? [errors.firstName] : undefined} />
            </Field>
            <Field data-invalid={!!errors.lastName}>
              <FieldLabel htmlFor="lastName" className="text-base">Last name</FieldLabel>
              <Input id="lastName" {...register("lastName")} />
              <FieldError errors={errors.lastName ? [errors.lastName] : undefined} />
            </Field>
          </div>

          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email" className="text-base">Email</FieldLabel>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            <FieldError errors={errors.email ? [errors.email] : undefined} />
          </Field>

          <Field>
            <FieldLabel className="text-base">Country</FieldLabel>
            <CountrySelect value={country || null} onChange={setCountry} />
          </Field>

          <Field>
            <FieldLabel className="text-base">Phone</FieldLabel>
            <PhoneInput value={phone || null} onChange={setPhone} />
          </Field>

          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password" className="text-base">Password</FieldLabel>
            <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
            <FieldError errors={errors.password ? [errors.password] : undefined} />
          </Field>

          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="mt-3 w-full brand-gradient text-background hover:opacity-90"
          >
            {submitting ? "Creating account…" : "Sign up"}
          </Button>
        </FieldGroup>
      </form>

      <p className="mt-8 text-center text-base text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
