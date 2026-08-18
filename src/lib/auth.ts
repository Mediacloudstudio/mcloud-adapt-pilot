// Auth.js (NextAuth v4) configuration.
//
// Strategy: JWT sessions (not database sessions). Credentials-based
// providers cannot safely use NextAuth's database session strategy, so we
// use signed JWTs instead — but that normally means an admin suspending a
// user has NO way to revoke an already-issued token until it expires.
//
// Fix: every User row has a `sessionVersion` integer. It's embedded in the
// JWT at sign-in and re-checked against the database on every request in
// the `jwt` callback (the same pattern NextAuth's own docs use for OAuth
// token-refresh errors). Bumping `sessionVersion` — on password change, or
// when an admin suspends/disables a company or user (PART 22/27/44) —
// makes every existing token fail this check on its very next use. When
// that happens we set `token.error = "SESSION_REVOKED"` rather than
// fighting NextAuth's types by returning a malformed session: the
// middleware below treats any token carrying `error` as unauthenticated,
// and `session.error` is available to server components/pages that want
// to show a "you were signed out" message.
//
// Google/Microsoft SSO (spec: "structure so SSO can be added later"): add
// the provider(s) to the `providers` array below. Because `Account` and
// `Session` tables already exist in the Prisma schema, no migration is
// needed — this file is the only thing that changes.

import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { checkRateLimit, recordAttempt } from "@/lib/rate-limit";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.toLowerCase().trim();

        // PART 53 — brute-force login protection. Keyed by email (blocks
        // hammering one account regardless of source IP) AND by IP
        // (blocks one IP spraying many emails) — both must be under
        // budget for the attempt to even reach a password check.
        const ip =
          (req?.headers?.["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
          (req?.headers?.["x-real-ip"] as string | undefined) ??
          "unknown";

        const [emailLimit, ipLimit] = await Promise.all([
          checkRateLimit(`login:email:${email}`, { maxAttempts: 5, windowMs: 15 * 60 * 1000 }),
          checkRateLimit(`login:ip:${ip}`, { maxAttempts: 20, windowMs: 15 * 60 * 1000 }),
        ]);

        if (emailLimit.blocked || ipLimit.blocked) {
          throw new Error("TOO_MANY_ATTEMPTS");
        }

        const user = await db.user.findUnique({ where: { email } });

        if (!user || user.status === "DISABLED") {
          // Deliberately generic — never reveal whether the email exists.
          // Still counts as an attempt for rate-limiting purposes.
          await Promise.all([recordAttempt(`login:email:${email}`), recordAttempt(`login:ip:${ip}`)]);
          return null;
        }

        const passwordValid = await verifyPassword(credentials.password, user.passwordHash);
        if (!passwordValid) {
          await Promise.all([recordAttempt(`login:email:${email}`), recordAttempt(`login:ip:${ip}`)]);
          return null;
        }

        if (!user.emailVerified) {
          // Signal a distinct error so the login page can show
          // "please verify your email" instead of a generic failure.
          // Does not count against the rate limit — a correct password
          // shouldn't burn attempts.
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          sessionVersion: user.sessionVersion,
          isPlatformAdmin: user.isPlatformAdmin,
        };
      },
    }),
    // Reserved for later phases:
    // GoogleProvider({ clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }),
    // AzureADProvider({ clientId: env.MICROSOFT_CLIENT_ID, clientSecret: env.MICROSOFT_CLIENT_SECRET, tenantId: env.MICROSOFT_TENANT_ID }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On sign-in, `user` is populated from `authorize()` above.
      if (user) {
        token.userId = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.sessionVersion = user.sessionVersion;
        token.isPlatformAdmin = user.isPlatformAdmin;
        delete token.error;

        const primaryMembership = await db.companyUser.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: "asc" },
          include: { role: true },
        });
        token.companyId = primaryMembership?.companyId ?? null;
        token.role = primaryMembership?.role.code ?? null;
        return token;
      }

      // On every subsequent request, re-verify against the database.
      // This is what makes an admin's "Suspend Customer" / "Force Logout"
      // / password-change action take effect immediately instead of
      // waiting up to `session.maxAge` for the token to expire on its own.
      const currentUser = await db.user.findUnique({
        where: { id: token.userId },
        select: { sessionVersion: true, status: true, isPlatformAdmin: true },
      });

      if (!currentUser || currentUser.status === "DISABLED" || currentUser.sessionVersion !== token.sessionVersion) {
        token.error = "SESSION_REVOKED";
      } else {
        delete token.error;
        // Keep in sync every request too — an admin's access should be
        // revocable just as instantly as any other permission change.
        token.isPlatformAdmin = currentUser.isPlatformAdmin;
      }

      return token;
    },
    async session({ session, token }) {
      if (token.error) {
        session.error = token.error;
        return session;
      }

      session.user = {
        id: token.userId,
        email: token.email ?? "",
        firstName: token.firstName,
        lastName: token.lastName,
        companyId: token.companyId,
        role: token.role,
        isPlatformAdmin: token.isPlatformAdmin,
      };
      return session;
    },
  },
};
