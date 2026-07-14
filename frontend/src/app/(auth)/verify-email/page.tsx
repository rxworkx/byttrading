"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { verifyEmail, ApiError } from "@/lib/auth-client";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(token ? "loading" : "error");
  const [message, setMessage] = useState(token ? "" : "Missing verification token.");

  useEffect(() => {
    if (!token) return;
    verifyEmail(token)
      .then((res) => {
        setStatus("success");
        setMessage(res.message);
      })
      .catch((error) => {
        setStatus("error");
        setMessage(error instanceof ApiError ? error.message : "Verification failed");
      });
  }, [token]);

  return (
    <div className="text-center">
      {status === "loading" && <Loader2 className="mx-auto size-10 animate-spin text-muted-foreground" />}
      {status === "success" && <CheckCircle2 className="mx-auto size-10 text-status-good" />}
      {status === "error" && <XCircle className="mx-auto size-10 text-destructive" />}

      <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
        {status === "loading" ? "Verifying your email…" : status === "success" ? "Email verified" : "Verification failed"}
      </h1>
      {message ? <p className="mt-3 text-base text-muted-foreground">{message}</p> : null}
      {status === "error" ? (
        <p className="mt-3 text-base text-muted-foreground">
          No rush though, email verification is optional and your account already works without it.
        </p>
      ) : null}

      <Link href="/login" className="mt-8 inline-block text-base font-medium text-primary hover:underline">
        Go to login
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
