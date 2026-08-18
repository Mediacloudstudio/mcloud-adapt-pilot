import type { Metadata } from "next";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { verifyEmailToken } from "@/server/auth/verify-email";
import { AuthShell, AuthLink } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Verify Email",
  robots: { index: false },
};

export default async function VerifyEmailPage({ searchParams }: { searchParams: { token?: string } }) {
  if (!searchParams.token) {
    return (
      <AuthShell title="Missing verification token" subtitle="This link is incomplete">
        <div className="flex justify-center">
          <AuthLink href="/register">Back to sign up</AuthLink>
        </div>
      </AuthShell>
    );
  }

  const result = await verifyEmailToken(searchParams.token);

  if (result.status === "success") {
    return (
      <AuthShell title="Email verified" subtitle={result.email}>
        <div className="flex flex-col items-center gap-4">
          <CheckCircle2 className="h-10 w-10 text-green-600" strokeWidth={1.5} />
          <p className="text-center text-sm text-ink-600">
            Your account is active. You can log in and choose a plan.
          </p>
          <AuthLink href="/login">Log In</AuthLink>
        </div>
      </AuthShell>
    );
  }

  if (result.status === "expired") {
    return (
      <AuthShell title="This link has expired" subtitle="Verification links expire after 24 hours">
        <div className="flex flex-col items-center gap-4">
          <Clock className="h-10 w-10 text-amber-500" strokeWidth={1.5} />
          <AuthLink href="/support">Contact support for a new link</AuthLink>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={result.status === "already-used" ? "Already verified" : "Invalid verification link"}
      subtitle={
        result.status === "already-used"
          ? "This account has already been verified"
          : "This link isn't valid"
      }
    >
      <div className="flex flex-col items-center gap-4">
        <XCircle className="h-10 w-10 text-ink-400" strokeWidth={1.5} />
        <AuthLink href="/login">Go to Login</AuthLink>
      </div>
    </AuthShell>
  );
}
