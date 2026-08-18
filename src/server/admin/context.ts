// Admin-portal auth gate. Distinct from the customer portal's context —
// being logged in and even being a COMPANY_ADMIN for some customer grants
// zero admin access. Only `User.isPlatformAdmin` does (PART 42/44).

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function getAdminContext() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }
  if (!session.user.isPlatformAdmin) {
    redirect("/portal");
  }

  return { session, userId: session.user.id };
}
