// Route protection for the two private areas of the site:
//   /portal/*  — customer portal (any authenticated user)
//   /admin/*   — MediaCloud internal admin (checked again per-route in
//                Phase 5 against an admin role/table; this middleware only
//                guarantees "logged in" so unauthenticated requests never
//                even reach an admin page).
//
// Public marketing routes and /login, /register, /api/auth/* are
// intentionally left untouched.

import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // A token that failed the sessionVersion check (see src/lib/auth.ts)
    // carries `error: "SESSION_REVOKED"`. Treating it as unauthorized here
    // — not just at the point some page happens to read `session.error` —
    // is what actually blocks a suspended user from reaching /portal or
    // /admin, rather than merely hiding their name in the UI.
    authorized: ({ token }) => Boolean(token) && !token?.error,
  },
});

export const config = {
  matcher: ["/portal/:path*", "/admin/:path*"],
};
