"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/auth/form-field";
import { AuthShell, AuthLink } from "@/components/auth/auth-shell";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

// This form is fully functional today, unlike Register — it talks to the
// Auth.js Credentials provider built in Phase 1 (src/lib/auth.ts). Try it
// with the seed demo account: demo.admin@abccreative.example / Demo@12345.
export function LoginForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    setSubmitting(true);

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    setSubmitting(false);

    if (!result || result.error) {
      if (result?.error === "EMAIL_NOT_VERIFIED") {
        setFormError("Please verify your email address before logging in. Check your inbox for the verification link.");
      } else if (result?.error === "TOO_MANY_ATTEMPTS") {
        setFormError("Too many login attempts. Please wait a few minutes and try again.");
      } else {
        setFormError("Invalid email or password.");
      }
      return;
    }

    router.push("/portal");
    router.refresh();
  }

  return (
    <AuthShell
      title="Log in to your account"
      subtitle="Access your subscription, license and devices"
      footer={
        <>
          Don&apos;t have an account? <AuthLink href="/register">Get Started</AuthLink>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        {formError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {formError}
          </div>
        )}

        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <FormField
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />

        <div className="flex justify-end">
          <AuthLink href="/forgot-password">Forgot password?</AuthLink>
        </div>

        <Button type="submit" size="lg" disabled={submitting} className="w-full">
          {submitting ? "Logging in..." : "Log In"}
        </Button>
      </form>
    </AuthShell>
  );
}
