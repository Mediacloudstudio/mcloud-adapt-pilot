import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { generateRawToken, hashToken } from "@/lib/auth/tokens";
import { sendPasswordChangedEmail, sendPasswordResetEmail } from "@/lib/email";
import { env } from "@/lib/env";

const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Always resolves without revealing whether the email exists — the caller
 * (API route) returns the same generic success response either way.
 */
export async function requestPasswordReset(rawEmail: string): Promise<void> {
  const email = rawEmail.toLowerCase().trim();
  const user = await db.user.findUnique({ where: { email } });

  if (!user || user.status === "DISABLED") {
    return;
  }

  const rawToken = generateRawToken();
  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
    },
  });

  const resetUrl = `${env.NEXT_PUBLIC_APP_URL}/reset-password?token=${rawToken}`;
  await sendPasswordResetEmail(user.email, user.firstName, resetUrl);
}

export type ResetPasswordResult =
  | { status: "success" }
  | { status: "invalid" }
  | { status: "expired" }
  | { status: "already-used" };

export async function resetPassword(rawToken: string, newPassword: string): Promise<ResetPasswordResult> {
  const tokenHash = hashToken(rawToken);

  const token = await db.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!token) return { status: "invalid" };
  if (token.usedAt) return { status: "already-used" };
  if (token.expiresAt < new Date()) return { status: "expired" };

  const passwordHash = await hashPassword(newPassword);

  await db.$transaction([
    db.user.update({
      where: { id: token.userId },
      data: {
        passwordHash,
        // Bumping sessionVersion signs the user out of every existing
        // session everywhere — standard practice on password change, and
        // what makes src/lib/auth.ts's revocation check actually useful.
        sessionVersion: { increment: 1 },
        // Team invites (src/server/portal/actions.ts inviteTeamMember)
        // reuse this exact flow as their "set your password" step — only
        // the invitee could have received the emailed link, so completing
        // it is treated as both password-set and email verification for
        // a still-INVITED user. Already-ACTIVE users are unaffected.
        ...(token.user.status === "INVITED" ? { status: "ACTIVE" as const, emailVerified: new Date() } : {}),
      },
    }),
    db.passwordResetToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    }),
    // Invalidate any other still-unused reset tokens for this user so an
    // old, previously-emailed link can't be used after a newer one (or
    // this one) has already succeeded.
    db.passwordResetToken.updateMany({
      where: { userId: token.userId, usedAt: null, id: { not: token.id } },
      data: { usedAt: new Date() },
    }),
  ]);

  await sendPasswordChangedEmail(token.user.email, token.user.firstName);

  return { status: "success" };
}
