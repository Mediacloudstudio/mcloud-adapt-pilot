"use server";

// Customer-portal mutations, implemented as React Server Actions so the
// client components below can call them directly without hand-rolling a
// REST endpoint per action. Every action re-derives the caller's identity
// and companyId from the session server-side — none of them trust a
// companyId passed in from the client (PART 53/66).

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { generateRawToken, hashToken } from "@/lib/auth/tokens";
import { sendPasswordResetEmail, sendPasswordChangedEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { getPortalContext, requireCompanyAdmin } from "@/server/portal/context";

type ActionResult = { success: boolean; message: string };

// ───────────────────────────── Devices ─────────────────────────────────

export async function deactivateDevice(deviceId: string): Promise<ActionResult> {
  const { companyId } = await getPortalContext();

  const device = await db.device.findFirst({ where: { id: deviceId, companyId } });
  if (!device) {
    return { success: false, message: "Device not found." };
  }
  if (device.status !== "ACTIVE") {
    return { success: false, message: "Device is already deactivated." };
  }

  await db.$transaction([
    db.device.update({
      where: { id: device.id },
      data: { status: "DEACTIVATED", deactivatedAt: new Date() },
    }),
    db.licenseEvent.create({
      data: { licenseId: device.licenseId, deviceId: device.id, event: "DEACTIVATED", detail: "Deactivated from customer portal" },
    }),
  ]);

  revalidatePath("/portal/devices");
  revalidatePath("/portal");
  return { success: true, message: `${device.deviceName ?? "Device"} deactivated. The slot is now free.` };
}

// ───────────────────────────── Subscription ─────────────────────────────

export async function cancelSubscription(): Promise<ActionResult> {
  const { companyId } = await getPortalContext();

  const subscription = await db.subscription.findFirst({
    where: { companyId },
    orderBy: { createdAt: "desc" },
  });
  if (!subscription) {
    return { success: false, message: "No subscription found." };
  }

  await db.subscription.update({
    where: { id: subscription.id },
    data: { cancelAtPeriodEnd: true },
  });

  revalidatePath("/portal/billing");
  revalidatePath("/portal/subscription");
  return {
    success: true,
    message: "Your subscription will not renew after the current billing period.",
  };
}

// ───────────────────────────── Support ─────────────────────────────────

const ticketSchema = z.object({
  subject: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  description: z.string().min(1).max(5000),
});

export async function submitSupportTicket(formData: FormData): Promise<ActionResult> {
  const { companyId, userId } = await getPortalContext();

  const parsed = ticketSchema.safeParse({
    subject: formData.get("subject"),
    category: formData.get("category"),
    priority: formData.get("priority"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { success: false, message: "Please fill in every field." };
  }

  const ticket = await db.supportTicket.create({
    data: { companyId, userId, ...parsed.data, status: "OPEN" },
  });

  revalidatePath("/portal/support");
  return { success: true, message: `Ticket #${ticket.id.slice(-6).toUpperCase()} created.` };
}

export async function replyToTicket(ticketId: string, formData: FormData): Promise<ActionResult> {
  const { companyId, userId } = await getPortalContext();

  const message = formData.get("message");
  if (typeof message !== "string" || message.trim().length === 0) {
    return { success: false, message: "Reply cannot be empty." };
  }

  const ticket = await db.supportTicket.findFirst({ where: { id: ticketId, companyId } });
  if (!ticket) {
    return { success: false, message: "Ticket not found." };
  }

  await db.$transaction([
    db.supportTicketReply.create({
      data: { ticketId: ticket.id, authorUserId: userId, message: message.trim(), isAdminReply: false },
    }),
    db.supportTicket.update({
      where: { id: ticket.id },
      data: { status: ticket.status === "RESOLVED" || ticket.status === "CLOSED" ? "OPEN" : "WAITING_FOR_CUSTOMER" },
    }),
  ]);

  revalidatePath(`/portal/support/${ticketId}`);
  return { success: true, message: "Reply sent." };
}

// ───────────────────────────── Team ─────────────────────────────────────

const inviteSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  roleId: z.string().min(1),
});

export async function inviteTeamMember(formData: FormData): Promise<ActionResult> {
  const { companyId, role } = await getPortalContext();
  requireCompanyAdmin(role);

  const parsed = inviteSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    roleId: formData.get("roleId"),
  });
  if (!parsed.success) {
    return { success: false, message: "Please fill in every field." };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, message: "A user with this email already exists." };
  }

  // Invited users get an unusable random password hash — they set a real
  // one by completing the same reset-password flow used for "forgot
  // password" (src/server/auth/password-reset.ts), which also marks them
  // ACTIVE + emailVerified on success. One flow, two entry points.
  const placeholderHash = await hashPassword(generateRawToken());

  const user = await db.user.create({
    data: { firstName: parsed.data.firstName, lastName: parsed.data.lastName, email, passwordHash: placeholderHash, status: "INVITED" },
  });

  await db.companyUser.create({ data: { companyId, userId: user.id, roleId: parsed.data.roleId } });

  const rawToken = generateRawToken();
  await db.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  });
  const setPasswordUrl = `${env.NEXT_PUBLIC_APP_URL}/reset-password?token=${rawToken}`;
  await sendPasswordResetEmail(user.email, user.firstName, setPasswordUrl);

  revalidatePath("/portal/team");
  return { success: true, message: `Invitation sent to ${email}.` };
}

// ───────────────────────────── Settings ──────────────────────────────────

const profileSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().max(30).optional(),
});

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const { userId } = await getPortalContext();

  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone") || undefined,
  });
  if (!parsed.success) {
    return { success: false, message: "Please check the form and try again." };
  }

  await db.user.update({ where: { id: userId }, data: parsed.data });
  revalidatePath("/portal/settings");
  return { success: true, message: "Profile updated." };
}

const billingProfileSchema = z.object({
  legalName: z.string().max(200).optional(),
  gstin: z.string().max(20).optional(),
  billingAddress: z.string().max(500).optional(),
  state: z.string().max(100).optional(),
  pinCode: z.string().max(20).optional(),
  country: z.string().max(100),
});

export async function updateBillingProfile(formData: FormData): Promise<ActionResult> {
  const { companyId, role } = await getPortalContext();
  requireCompanyAdmin(role);

  const parsed = billingProfileSchema.safeParse({
    legalName: formData.get("legalName") || undefined,
    gstin: formData.get("gstin") || undefined,
    billingAddress: formData.get("billingAddress") || undefined,
    state: formData.get("state") || undefined,
    pinCode: formData.get("pinCode") || undefined,
    country: formData.get("country"),
  });
  if (!parsed.success) {
    return { success: false, message: "Please check the form and try again." };
  }

  await db.company.update({ where: { id: companyId }, data: parsed.data });
  revalidatePath("/portal/settings");
  return { success: true, message: "Billing information updated." };
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, { message: "Passwords do not match" });

export async function changePassword(formData: FormData): Promise<ActionResult> {
  const { userId } = await getPortalContext();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const currentValid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!currentValid) {
    return { success: false, message: "Current password is incorrect." };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db.user.update({
    where: { id: userId },
    data: { passwordHash, sessionVersion: { increment: 1 } },
  });

  await sendPasswordChangedEmail(user.email, user.firstName);

  return { success: true, message: "Password changed. Please log in again." };
}
