"use server";

// Admin-portal mutations. Every action: (1) re-derives the acting admin
// from the session via getAdminContext — never trusts a claimed identity
// from the client, (2) performs the mutation, (3) writes an AuditLog row
// via recordAuditLog (PART 55 — "every important admin action must be
// logged"). None of these ever accept price/device-limit/status directly
// into a raw SQL string or trust a value without validating it server-side
// (PART 53/66).

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminContext } from "@/server/admin/context";
import { recordAuditLog } from "@/server/audit/log";
import { getRazorpayClient, isRazorpayConfigured, rupeesToPaise } from "@/lib/razorpay";

type ActionResult = { success: boolean; message: string };

// ───────────────────────────── Customers ─────────────────────────────────

export async function suspendCustomer(companyId: string): Promise<ActionResult> {
  const { userId } = await getAdminContext();
  const company = await db.company.findUniqueOrThrow({ where: { id: companyId } });

  await db.$transaction([
    db.company.update({ where: { id: companyId }, data: { status: "SUSPENDED" } }),
    db.subscription.updateMany({ where: { companyId, status: { not: "CANCELLED" } }, data: { status: "SUSPENDED" } }),
    db.license.updateMany({ where: { companyId }, data: { status: "SUSPENDED" } }),
    // Force every session for every user at this company to die on next check.
    db.user.updateMany({
      where: { companyMemberships: { some: { companyId } } },
      data: { sessionVersion: { increment: 1 } },
    }),
  ]);

  await recordAuditLog({
    userId,
    companyId,
    action: "CUSTOMER_SUSPENDED",
    entity: "Company",
    entityId: companyId,
    oldValue: { status: company.status },
    newValue: { status: "SUSPENDED" },
  });

  revalidatePath(`/admin/customers/${companyId}`);
  revalidatePath("/admin/customers");
  return { success: true, message: "Customer suspended." };
}

export async function reactivateCustomer(companyId: string): Promise<ActionResult> {
  const { userId } = await getAdminContext();

  await db.$transaction([
    db.company.update({ where: { id: companyId }, data: { status: "ACTIVE" } }),
    db.subscription.updateMany({ where: { companyId, status: "SUSPENDED" }, data: { status: "ACTIVE" } }),
    db.license.updateMany({ where: { companyId, status: "SUSPENDED" }, data: { status: "ACTIVE" } }),
  ]);

  await recordAuditLog({ userId, companyId, action: "CUSTOMER_REACTIVATED", entity: "Company", entityId: companyId });
  revalidatePath(`/admin/customers/${companyId}`);
  revalidatePath("/admin/customers");
  return { success: true, message: "Customer reactivated." };
}

const extendAccessSchema = z.object({ days: z.coerce.number().int().min(1).max(3650) });

export async function extendSubscriptionAccess(subscriptionId: string, formData: FormData): Promise<ActionResult> {
  const { userId } = await getAdminContext();
  const parsed = extendAccessSchema.safeParse({ days: formData.get("days") });
  if (!parsed.success) return { success: false, message: "Enter a valid number of days." };

  const subscription = await db.subscription.findUniqueOrThrow({ where: { id: subscriptionId } });
  const base = subscription.nextBillingDate && subscription.nextBillingDate > new Date() ? subscription.nextBillingDate : new Date();
  const newDate = new Date(base.getTime() + parsed.data.days * 24 * 60 * 60 * 1000);

  await db.subscription.update({ where: { id: subscriptionId }, data: { nextBillingDate: newDate, status: "ACTIVE" } });

  await recordAuditLog({
    userId,
    companyId: subscription.companyId,
    action: "SUBSCRIPTION_EXTENDED",
    entity: "Subscription",
    entityId: subscriptionId,
    oldValue: { nextBillingDate: subscription.nextBillingDate },
    newValue: { nextBillingDate: newDate },
  });

  revalidatePath(`/admin/customers/${subscription.companyId}`);
  revalidatePath("/admin/subscriptions");
  return { success: true, message: `Access extended by ${parsed.data.days} day(s).` };
}

const changePlanSchema = z.object({ planId: z.string().min(1) });

export async function changeCustomerPlan(subscriptionId: string, formData: FormData): Promise<ActionResult> {
  const { userId } = await getAdminContext();
  const parsed = changePlanSchema.safeParse({ planId: formData.get("planId") });
  if (!parsed.success) return { success: false, message: "Select a plan." };

  const subscription = await db.subscription.findUniqueOrThrow({ where: { id: subscriptionId } });
  const newPlan = await db.plan.findUniqueOrThrow({ where: { id: parsed.data.planId } });

  await db.subscription.update({ where: { id: subscriptionId }, data: { planId: newPlan.id } });

  await recordAuditLog({
    userId,
    companyId: subscription.companyId,
    action: "PLAN_CHANGED",
    entity: "Subscription",
    entityId: subscriptionId,
    oldValue: { planId: subscription.planId },
    newValue: { planId: newPlan.id },
  });

  revalidatePath(`/admin/customers/${subscription.companyId}`);
  revalidatePath("/admin/subscriptions");
  return { success: true, message: `Plan changed to ${newPlan.name}. Effective on the desktop app's next license check.` };
}

// ───────────────────────────── Plans ─────────────────────────────────────

const planUpdateSchema = z.object({
  name: z.string().min(1),
  price: z.coerce.number().min(0),
  deviceLimit: z.coerce.number().int().min(1),
  billingFrequency: z.enum(["MONTHLY", "ANNUAL", "ONE_TIME", "CUSTOM"]),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]),
  isRecommended: z.coerce.boolean().optional(),
});

export async function updatePlan(planId: string, formData: FormData): Promise<ActionResult> {
  const { userId } = await getAdminContext();
  const parsed = planUpdateSchema.safeParse({
    name: formData.get("name"),
    price: formData.get("price"),
    deviceLimit: formData.get("deviceLimit"),
    billingFrequency: formData.get("billingFrequency"),
    status: formData.get("status"),
    isRecommended: formData.get("isRecommended") === "on",
  });
  if (!parsed.success) return { success: false, message: "Please check the form and try again." };

  const before = await db.plan.findUniqueOrThrow({ where: { id: planId } });
  await db.plan.update({ where: { id: planId }, data: { ...parsed.data, isRecommended: parsed.data.isRecommended ?? false } });

  await recordAuditLog({
    userId,
    action: "PLAN_UPDATED",
    entity: "Plan",
    entityId: planId,
    oldValue: { name: before.name, price: before.price.toString(), deviceLimit: before.deviceLimit, status: before.status },
    newValue: parsed.data,
  });

  revalidatePath("/admin/plans");
  revalidatePath("/pricing");
  return { success: true, message: "Plan updated — live on the pricing page immediately." };
}

const planCreateSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  price: z.coerce.number().min(0),
  deviceLimit: z.coerce.number().int().min(1),
  billingFrequency: z.enum(["MONTHLY", "ANNUAL", "ONE_TIME", "CUSTOM"]),
});

export async function createPlan(formData: FormData): Promise<ActionResult> {
  const { userId } = await getAdminContext();
  const parsed = planCreateSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    price: formData.get("price"),
    deviceLimit: formData.get("deviceLimit"),
    billingFrequency: formData.get("billingFrequency"),
  });
  if (!parsed.success) return { success: false, message: "Please check the form and try again." };

  const existing = await db.plan.findUnique({ where: { code: parsed.data.code } });
  if (existing) return { success: false, message: "A plan with this code already exists." };

  const plan = await db.plan.create({
    data: { ...parsed.data, currency: "INR", status: "ACTIVE", sortOrder: (await db.plan.count()) + 1 },
  });
  await recordAuditLog({ userId, action: "PLAN_CREATED", entity: "Plan", entityId: plan.id, newValue: parsed.data });

  revalidatePath("/admin/plans");
  revalidatePath("/pricing");
  return { success: true, message: `${plan.name} created.` };
}

// ───────────────────────────── Licenses ──────────────────────────────────

export async function setLicenseStatus(
  licenseId: string,
  status: "ACTIVE" | "SUSPENDED" | "REVOKED"
): Promise<ActionResult> {
  const { userId } = await getAdminContext();
  const before = await db.license.findUniqueOrThrow({ where: { id: licenseId } });

  await db.$transaction([
    db.license.update({ where: { id: licenseId }, data: { status } }),
    db.licenseEvent.create({
      data: { licenseId, event: status === "ACTIVE" ? "REACTIVATED" : status === "SUSPENDED" ? "SUSPENDED" : "REVOKED", detail: "Changed by admin" },
    }),
  ]);

  await recordAuditLog({
    userId,
    companyId: before.companyId,
    action: `LICENSE_${status}`,
    entity: "License",
    entityId: licenseId,
    oldValue: { status: before.status },
    newValue: { status },
  });

  revalidatePath("/admin/licenses");
  return { success: true, message: `License ${status.toLowerCase()}.` };
}

const deviceLimitOverrideSchema = z.object({ deviceLimitOverride: z.coerce.number().int().min(0).nullable() });

export async function setLicenseDeviceLimitOverride(licenseId: string, formData: FormData): Promise<ActionResult> {
  const { userId } = await getAdminContext();
  const raw = formData.get("deviceLimitOverride");
  const parsed = deviceLimitOverrideSchema.safeParse({ deviceLimitOverride: raw === "" ? null : raw });
  if (!parsed.success) return { success: false, message: "Enter a valid device limit or leave blank to clear it." };

  const before = await db.license.findUniqueOrThrow({ where: { id: licenseId } });
  await db.license.update({ where: { id: licenseId }, data: { deviceLimitOverride: parsed.data.deviceLimitOverride } });

  await recordAuditLog({
    userId,
    companyId: before.companyId,
    action: "LICENSE_DEVICE_LIMIT_OVERRIDDEN",
    entity: "License",
    entityId: licenseId,
    oldValue: { deviceLimitOverride: before.deviceLimitOverride },
    newValue: { deviceLimitOverride: parsed.data.deviceLimitOverride },
  });

  revalidatePath("/admin/licenses");
  return { success: true, message: "Device limit override updated." };
}

export async function adminResetDevice(deviceId: string): Promise<ActionResult> {
  const { userId } = await getAdminContext();
  const device = await db.device.findUniqueOrThrow({ where: { id: deviceId } });

  await db.$transaction([
    db.device.update({ where: { id: deviceId }, data: { status: "DEACTIVATED", deactivatedAt: new Date() } }),
    db.licenseEvent.create({ data: { licenseId: device.licenseId, deviceId, event: "RESET", detail: "Reset by admin" } }),
  ]);

  await recordAuditLog({
    userId,
    companyId: device.companyId,
    action: "DEVICE_RESET",
    entity: "Device",
    entityId: deviceId,
  });

  revalidatePath("/admin/devices");
  return { success: true, message: "Device reset — the slot is now free." };
}

// ───────────────────────────── Templates ─────────────────────────────────

const templateSchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().min(1),
  version: z.string().min(1),
  description: z.string().optional(),
});

export async function createTemplate(formData: FormData): Promise<ActionResult> {
  const { userId } = await getAdminContext();
  const parsed = templateSchema.safeParse({
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
    version: formData.get("version"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return { success: false, message: "Please check the form and try again." };

  const template = await db.template.create({ data: { ...parsed.data, status: "ACTIVE" } });
  await recordAuditLog({ userId, action: "TEMPLATE_CREATED", entity: "Template", entityId: template.id, newValue: parsed.data });

  revalidatePath("/admin/templates");
  return { success: true, message: "Template created." };
}

const assignTemplateSchema = z.object({ companyId: z.string().min(1) });

export async function assignTemplateToCompany(templateId: string, formData: FormData): Promise<ActionResult> {
  const { userId } = await getAdminContext();
  const parsed = assignTemplateSchema.safeParse({ companyId: formData.get("companyId") });
  if (!parsed.success) return { success: false, message: "Select a customer." };

  const existing = await db.customerTemplate.findUnique({
    where: { companyId_templateId: { companyId: parsed.data.companyId, templateId } },
  });
  if (existing) return { success: false, message: "Already assigned to that customer." };

  await db.customerTemplate.create({ data: { companyId: parsed.data.companyId, templateId } });
  await recordAuditLog({
    userId,
    companyId: parsed.data.companyId,
    action: "TEMPLATE_ASSIGNED",
    entity: "Template",
    entityId: templateId,
  });

  revalidatePath("/admin/templates");
  return { success: true, message: "Template assigned." };
}

// ───────────────────────────── Application ───────────────────────────────

const publishVersionSchema = z.object({
  version: z.string().min(1),
  minimumSupportedVersion: z.string().min(1),
  installerUrl: z.string().url(),
  releaseNotes: z.string().optional(),
  mandatory: z.coerce.boolean().optional(),
});

export async function publishAppVersion(formData: FormData): Promise<ActionResult> {
  const { userId } = await getAdminContext();
  const parsed = publishVersionSchema.safeParse({
    version: formData.get("version"),
    minimumSupportedVersion: formData.get("minimumSupportedVersion"),
    installerUrl: formData.get("installerUrl"),
    releaseNotes: formData.get("releaseNotes") || undefined,
    mandatory: formData.get("mandatory") === "on",
  });
  if (!parsed.success) return { success: false, message: "Please check the form and try again." };

  const version = await db.appVersion.create({
    data: { ...parsed.data, mandatory: parsed.data.mandatory ?? false, platform: "WINDOWS" },
  });
  await recordAuditLog({ userId, action: "APP_VERSION_PUBLISHED", entity: "AppVersion", entityId: version.id, newValue: parsed.data });

  revalidatePath("/admin/application/versions");
  revalidatePath("/portal/downloads");
  return { success: true, message: `Version ${version.version} published.` };
}

const bannerSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  linkUrl: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export async function createBanner(formData: FormData): Promise<ActionResult> {
  const { userId } = await getAdminContext();
  const parsed = bannerSchema.safeParse({
    title: formData.get("title"),
    subtitle: formData.get("subtitle") || undefined,
    linkUrl: formData.get("linkUrl") || undefined,
    status: formData.get("status"),
  });
  if (!parsed.success) return { success: false, message: "Please check the form and try again." };

  const banner = await db.banner.create({ data: parsed.data });
  await recordAuditLog({ userId, action: "BANNER_CREATED", entity: "Banner", entityId: banner.id, newValue: parsed.data });

  revalidatePath("/admin/application/banners");
  return { success: true, message: "Banner created." };
}

export async function toggleFeatureFlag(flagId: string, enabled: boolean): Promise<ActionResult> {
  const { userId } = await getAdminContext();
  await db.featureFlag.update({ where: { id: flagId }, data: { enabled } });
  await recordAuditLog({ userId, action: enabled ? "FEATURE_ENABLED" : "FEATURE_DISABLED", entity: "FeatureFlag", entityId: flagId });

  revalidatePath("/admin/application/feature-flags");
  return { success: true, message: `Flag ${enabled ? "enabled" : "disabled"}.` };
}

// ───────────────────────────── Refunds ───────────────────────────────────

const refundSchema = z.object({ amount: z.coerce.number().positive(), reason: z.string().optional() });

export async function createRefund(paymentId: string, formData: FormData): Promise<ActionResult> {
  const { userId } = await getAdminContext();
  const parsed = refundSchema.safeParse({ amount: formData.get("amount"), reason: formData.get("reason") || undefined });
  if (!parsed.success) return { success: false, message: "Enter a valid refund amount." };

  const payment = await db.payment.findUniqueOrThrow({ where: { id: paymentId } });

  // If this payment actually went through Razorpay and Razorpay is
  // configured, push the refund to Razorpay itself — money only actually
  // moves there. The webhook (refund.processed) is still the source of
  // truth that flips status to PROCESSED; we record PENDING here and let
  // that event confirm it, same idempotent pattern as payment capture.
  let razorpayRefundId: string | undefined;
  if (payment.razorpayPaymentId && isRazorpayConfigured()) {
    try {
      const refund = await getRazorpayClient().payments.refund(payment.razorpayPaymentId, {
        amount: rupeesToPaise(parsed.data.amount),
        notes: parsed.data.reason ? { reason: parsed.data.reason } : undefined,
      });
      razorpayRefundId = refund.id;
    } catch (error) {
      console.error("Razorpay refund API call failed:", error);
      return { success: false, message: "Razorpay rejected the refund request. No changes were made." };
    }
  }

  await db.$transaction([
    db.refund.create({
      data: { paymentId, razorpayRefundId, amount: parsed.data.amount, reason: parsed.data.reason, status: razorpayRefundId ? "PROCESSED" : "PENDING" },
    }),
    db.payment.update({
      where: { id: paymentId },
      data: { status: parsed.data.amount >= Number(payment.amount) ? "REFUNDED" : "PARTIALLY_REFUNDED" },
    }),
  ]);

  await recordAuditLog({
    userId,
    companyId: payment.companyId,
    action: "REFUND_ISSUED",
    entity: "Payment",
    entityId: paymentId,
    newValue: { ...parsed.data, razorpayRefundId },
  });

  revalidatePath("/admin/refunds");
  revalidatePath("/admin/payments");
  return {
    success: true,
    message: razorpayRefundId
      ? "Refund submitted to Razorpay."
      : "Refund recorded locally (no Razorpay payment on file to refund automatically).",
  };
}

// ───────────────────────────── Support ───────────────────────────────────

export async function adminReplyToTicket(ticketId: string, formData: FormData): Promise<ActionResult> {
  const { userId } = await getAdminContext();
  const message = formData.get("message");
  const status = formData.get("status");
  if (typeof message !== "string" || message.trim().length === 0) {
    return { success: false, message: "Reply cannot be empty." };
  }

  await db.$transaction([
    db.supportTicketReply.create({ data: { ticketId, authorUserId: userId, message: message.trim(), isAdminReply: true } }),
    db.supportTicket.update({
      where: { id: ticketId },
      data: { status: typeof status === "string" && status ? (status as never) : "WAITING_FOR_CUSTOMER" },
    }),
  ]);

  await recordAuditLog({ userId, action: "TICKET_REPLIED", entity: "SupportTicket", entityId: ticketId });

  revalidatePath(`/admin/support/${ticketId}`);
  return { success: true, message: "Reply sent." };
}

// ───────────────────────────── Settings ──────────────────────────────────

const settingsSchema = z.object({
  legalName: z.string().optional(),
  gstin: z.string().optional(),
  registeredAddress: z.string().optional(),
  state: z.string().optional(),
  pan: z.string().optional(),
  invoicePrefix: z.string().optional(),
});

export async function updateAppSettings(formData: FormData): Promise<ActionResult> {
  const { userId } = await getAdminContext();
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { success: false, message: "Please check the form and try again." };

  await db.$transaction(
    Object.entries(parsed.data)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) =>
        db.appSetting.upsert({ where: { key }, update: { value: value as string }, create: { key, value: value as string } })
      )
  );

  await recordAuditLog({ userId, action: "SETTINGS_UPDATED", entity: "AppSetting", newValue: parsed.data });

  revalidatePath("/admin/settings");
  return { success: true, message: "Settings saved." };
}
