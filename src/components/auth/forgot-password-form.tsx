"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/auth/form-field";
import { AuthShell, AuthLink } from "@/components/auth/auth-shell";

const schema = z.object({ email: z.string().min(1, "Email is required").email("Enter a valid email address") });
type Values = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    setSubmitting(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
    } finally {
      // Always show the same success state — the API deliberately never
      // reveals whether the email exists, and neither does this form.
      setSubmitting(false);
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <AuthShell title="Check your email" subtitle="If an account exists for that email, a reset link is on its way.">
        <p className="text-center text-sm text-ink-600">
          The link expires in 1 hour. Didn&apos;t get it?{" "}
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="font-semibold text-brand-700 hover:text-brand-800"
          >
            Try again
          </button>
          .
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link"
      footer={<AuthLink href="/login">Back to Login</AuthLink>}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Button type="submit" size="lg" disabled={submitting} className="w-full">
          {submitting ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>
    </AuthShell>
  );
}
