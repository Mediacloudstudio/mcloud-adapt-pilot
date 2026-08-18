import "next-auth";
import "next-auth/jwt";

// Extend NextAuth's built-in types with the fields our app actually needs
// on `session.user` and inside the JWT. Keeping this centralized means
// every `useSession()` / `getServerSession()` call site gets full type
// safety instead of `any`.

declare module "next-auth" {
  interface Session {
    // Present when the underlying JWT failed the sessionVersion check
    // (admin suspended the user, forced logout, or the password changed
    // since this token was issued). `user` is intentionally omitted in
    // that case — callers must check `error` before reading `user`.
    error?: "SESSION_REVOKED";
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      // The active company context for this session. A user can belong to
      // more than one company (PART 14); the portal lets them switch, and
      // the chosen companyId is embedded back into the JWT.
      companyId: string | null;
      role: string | null; // Role.code for the active company, e.g. "COMPANY_ADMIN"
      isPlatformAdmin: boolean;
    };
  }

  interface User {
    id: string;
    firstName: string;
    lastName: string;
    sessionVersion: number;
    isPlatformAdmin: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    firstName: string;
    lastName: string;
    companyId: string | null;
    role: string | null;
    sessionVersion: number;
    isPlatformAdmin: boolean;
    error?: "SESSION_REVOKED";
  }
}
