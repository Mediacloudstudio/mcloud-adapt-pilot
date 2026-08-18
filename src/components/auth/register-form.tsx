"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormField } from "@/components/auth/form-field";
import { AuthShell, AuthLink } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";

const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    phone: z.string().min(6, "Enter a valid phone number"),
    companyName: z.string().min(1, "Company name is required"),
    country: z.string().min(1, "Country is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the Terms & Conditions to continue" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterValues = z.infer<typeof registerSchema>;

// PART 13 registration fields, fully validated client-side and wired to
// POST /api/auth/register (Phase 3) — which hashes the password, creates
// the User + Company + CompanyUser rows, and emails a verification link.
export function RegisterForm({ preselectedPlanName }: { preselectedPlanName?: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterValues) {
    setSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setFormError(body?.message ?? "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setFormError("Couldn't reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <AuthShell title="Check your email" subtitle="We've sent a verification link to your inbox">
        <p className="text-center text-sm text-ink-600">
          Verify your email to activate your account, then choose a plan and complete payment to
          get your license.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle={
        preselectedPlanName
          ? `Signing up for the ${preselectedPlanName} — you'll confirm this after verifying your email.`
          : "Start automating your InDesign production"
      }
      footer={
        <>
          Already have an account? <AuthLink href="/login">Log In</AuthLink>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        {formError && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
            {formError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField label="First Name" error={errors.firstName?.message} {...register("firstName")} />
          <FormField label="Last Name" error={errors.lastName?.message} {...register("lastName")} />
        </div>

        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <FormField
          label="Phone"
          type="tel"
          autoComplete="tel"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <FormField label="Company Name" error={errors.companyName?.message} {...register("companyName")} />
        <FormField label="Country" defaultValue="India" error={errors.country?.message} {...register("country")} />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Password"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <FormField
            label="Confirm Password"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
        </div>

        <label className="flex items-start gap-2.5 text-sm text-ink-600">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
            {...register("acceptTerms")}
          />
          <span>
            I accept the <AuthLink href="/legal/terms">Terms of Service</AuthLink> and{" "}
            <AuthLink href="/legal/privacy">Privacy Policy</AuthLink>.
          </span>
        </label>
        {errors.acceptTerms && <span className="text-xs text-red-600">{errors.acceptTerms.message}</span>}

        <Button type="submit" size="lg" disabled={submitting} className="w-full">
          {submitting ? "Creating account..." : "Get Started"}
        </Button>
      </form>
    </AuthShell>
  );
}
