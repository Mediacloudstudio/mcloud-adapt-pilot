// Centralized, validated environment access.
// Import `env` instead of reading `process.env` directly anywhere else in
// the codebase — this fails fast at startup if a required variable is
// missing, instead of failing silently deep inside a request handler.

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
  NEXTAUTH_URL: z.string().url().optional(),

  // Razorpay — optional in Phase 1 (not wired up until Phase 6), but the
  // shape is validated now so Phase 6 has nothing left to configure.
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  EMAIL_SERVER_HOST: z.string().optional(),
  EMAIL_SERVER_PORT: z.string().optional(),
  EMAIL_SERVER_USER: z.string().optional(),
  EMAIL_SERVER_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  LICENSE_TOKEN_SIGNING_SECRET: z.string().optional(),
  // How long a device's offline-validation token stays valid before the
  // desktop app must call /api/v1/license/validate again. Configurable
  // per PART 68's Phase 7 spec — 24-48h is the recommended range so a
  // laptop with no internet for a day still opens fine.
  LICENSE_TOKEN_TTL_HOURS: z.coerce.number().positive().default(48),

  STORAGE_ENDPOINT: z.string().optional(),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_ACCESS_KEY_ID: z.string().optional(),
  STORAGE_SECRET_ACCESS_KEY: z.string().optional(),
  STORAGE_REGION: z.string().optional(),
});

// Vercel (and other dashboards) can end up storing an env var as a
// present-but-empty string rather than omitting it entirely — e.g. a field
// left blank in the "Environment Variables" UI. Zod's `.default()` and
// `.optional()` only kick in for `undefined`, not `""`, so an empty string
// would otherwise fail validation (or fail `.positive()`/`.url()` checks)
// instead of falling back cleanly. Normalize empty strings to `undefined`
// before validating so blank-but-present vars behave the same as unset ones.
const rawEnv = Object.fromEntries(
  Object.entries(process.env).map(([key, value]) => [key, value === "" ? undefined : value])
);

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  console.error(
    "❌ Invalid or missing environment variables:\n",
    JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)
  );
  throw new Error("Invalid environment variables. Check .env against .env.example.");
}

export const env = parsed.data;
