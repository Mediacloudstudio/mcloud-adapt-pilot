// Registration business logic (PART 13). Kept out of the route handler so
// it's independently testable and reusable — the same function could
// later back an admin-initiated "create customer" flow without
// duplicating the Company/User/CompanyUser creation logic.

import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { generateRawToken, hashToken } from "@/lib/auth/tokens";
import { sendVerificationEmail } from "@/lib/email";
import { env } from "@/lib/env";

export type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  country: string;
  password: string;
};

export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super("An account with this email already exists.");
    this.name = "EmailAlreadyRegisteredError";
  }
}

const EMAIL_VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function registerCustomer(input: RegisterInput) {
  const email = input.email.toLowerCase().trim();

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    // Note: the API route still returns a generic-shaped error to avoid
    // being a trivial "does this email exist" oracle for unauthenticated
    // callers beyond what's unavoidable for registration UX; see the
    // route handler for how this is surfaced.
    throw new EmailAlreadyRegisteredError();
  }

  const passwordHash = await hashPassword(input.password);

  // Company Admin role is seeded in Phase 1 (prisma/seed.ts). Registering
  // a brand-new company always makes its first user the Company Admin
  // (PART 14) — every other role is granted later by that admin (PART 57).
  const companyAdminRole = await db.role.findUniqueOrThrow({ where: { code: "COMPANY_ADMIN" } });

  const { user, company } = await db.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        companyName: input.companyName,
        country: input.country,
        status: "ACTIVE",
      },
    });

    const user = await tx.user.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email,
        phone: input.phone,
        passwordHash,
        status: "INVITED", // becomes ACTIVE once email is verified
      },
    });

    await tx.companyUser.create({
      data: { companyId: company.id, userId: user.id, roleId: companyAdminRole.id },
    });

    return { user, company };
  });

  const rawToken = generateRawToken();
  await db.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS),
    },
  });

  const verifyUrl = `${env.NEXT_PUBLIC_APP_URL}/verify-email?token=${rawToken}`;
  await sendVerificationEmail(user.email, user.firstName, verifyUrl);

  return { userId: user.id, companyId: company.id };
}
