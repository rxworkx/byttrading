"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { verifyOtp, ApiError } from "@/lib/auth-client";

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") ?? "";
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (code.length !== 6) return;
    setSubmitting(true);
    try {
      await verifyOtp({ ref, code });
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Invalid code");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Check your email</h1>
      <p className="mt-3 text-base text-muted-foreground">
        Enter the 6 digit code we just emailed you to finish logging in.
      </p>

      <div className="mt-10 flex justify-center">
        <InputOTP maxLength={6} value={code} onChange={setCode}>
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      <Button
        size="lg"
        className="mt-8 w-full brand-gradient text-background hover:opacity-90"
        disabled={submitting || code.length !== 6 || !ref}
        onClick={handleSubmit}
      >
        {submitting ? "Verifying…" : "Verify"}
      </Button>

      {!ref ? (
        <p className="mt-4 text-center text-base text-destructive">
          Missing login reference, please log in again.
        </p>
      ) : null}
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpForm />
    </Suspense>
  );
}
