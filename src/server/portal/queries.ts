// Read-only data access for the customer portal. Every function is scoped
// to a companyId — none of these ever accept an id from the client without
// also filtering by companyId, so one customer can never read another's
// subscription/license/device/job data by guessing an id (PART 53).

import { db } from "@/lib/db";

export async function getActiveSubscription(companyId: string) {
  return db.subscription.findFirst({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    include: { plan: { include: { features: true } } },
  });
}

export async function getLicense(companyId: string) {
  return db.license.findFirst({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    include: { devices: true, subscription: { include: { plan: true } } },
  });
}

export async function getDevices(companyId: string) {
  return db.device.findMany({ where: { companyId }, orderBy: { activatedAt: "desc" } });
}

export async function getLatestAppVersion() {
  return db.appVersion.findFirst({ orderBy: { publishedAt: "desc" } });
}

function startOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function startOfDay(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function getDashboardData(companyId: string) {
  const [subscription, license, devices, appVersion, outputsThisMonth, recentJobs, recentPayments] =
    await Promise.all([
      getActiveSubscription(companyId),
      getLicense(companyId),
      getDevices(companyId),
      getLatestAppVersion(),
      db.job.aggregate({
        where: { companyId, startedAt: { gte: startOfMonth() } },
        _sum: { outputCount: true },
      }),
      db.job.findMany({
        where: { companyId },
        orderBy: { startedAt: "desc" },
        take: 5,
        include: { template: true, device: true },
      }),
      db.payment.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 5 }),
    ]);

  return {
    subscription,
    license,
    activeDeviceCount: devices.filter((d) => d.status === "ACTIVE").length,
    deviceLimit: license?.deviceLimitOverride ?? subscription?.plan.deviceLimit ?? 0,
    appVersion,
    outputsThisMonth: outputsThisMonth._sum.outputCount ?? 0,
    recentJobs,
    recentPayments,
  };
}

export async function getUsageStats(companyId: string) {
  const [outputsToday, outputsThisMonth, jobsToday, doneJobs, errorJobs, devices, templateBreakdown, dailyOutputs] =
    await Promise.all([
      db.job.aggregate({ where: { companyId, startedAt: { gte: startOfDay() } }, _sum: { outputCount: true } }),
      db.job.aggregate({ where: { companyId, startedAt: { gte: startOfMonth() } }, _sum: { outputCount: true } }),
      db.job.count({ where: { companyId, startedAt: { gte: startOfDay() } } }),
      db.job.count({ where: { companyId, status: "DONE" } }),
      db.job.count({ where: { companyId, status: "ERROR" } }),
      db.device.count({ where: { companyId, status: "ACTIVE" } }),
      db.job.groupBy({
        by: ["templateId"],
        where: { companyId, templateId: { not: null } },
        _sum: { outputCount: true },
        orderBy: { _sum: { outputCount: "desc" } },
        take: 1,
      }),
      db.job.findMany({
        where: { companyId, startedAt: { gte: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000) } },
        select: { startedAt: true, outputCount: true },
      }),
    ]);

  let mostUsedTemplateName: string | null = null;
  if (templateBreakdown[0]?.templateId) {
    const template = await db.template.findUnique({ where: { id: templateBreakdown[0].templateId } });
    mostUsedTemplateName = template?.name ?? null;
  }

  // Bucket the last 14 days of output volume for a simple trend bar chart.
  const buckets: { date: string; total: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const key = day.toISOString().slice(0, 10);
    buckets.push({ date: key, total: 0 });
  }
  for (const job of dailyOutputs) {
    const key = job.startedAt.toISOString().slice(0, 10);
    const bucket = buckets.find((b) => b.date === key);
    if (bucket) bucket.total += job.outputCount;
  }

  return {
    outputsToday: outputsToday._sum.outputCount ?? 0,
    outputsThisMonth: outputsThisMonth._sum.outputCount ?? 0,
    jobsToday,
    doneJobs,
    errorJobs,
    activeDevices: devices,
    mostUsedTemplateName,
    dailyOutputs: buckets,
  };
}

export async function getPayments(companyId: string) {
  return db.payment.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    include: { invoice: true, subscription: { include: { plan: true } } },
  });
}

export async function getInvoices(companyId: string) {
  return db.invoice.findMany({ where: { companyId }, orderBy: { invoiceDate: "desc" } });
}

export async function getCustomerTemplates(companyId: string) {
  return db.customerTemplate.findMany({
    where: { companyId },
    include: { template: { include: { category: true } } },
    orderBy: { grantedAt: "desc" },
  });
}

export async function getTickets(companyId: string) {
  return db.supportTicket.findMany({ where: { companyId }, orderBy: { updatedAt: "desc" } });
}

export async function getTicket(companyId: string, ticketId: string) {
  return db.supportTicket.findFirst({
    where: { id: ticketId, companyId },
    include: { replies: { include: { author: true }, orderBy: { createdAt: "asc" } }, user: true },
  });
}

export async function getTeamMembers(companyId: string) {
  return db.companyUser.findMany({
    where: { companyId },
    include: { user: true, role: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getRoles() {
  return db.role.findMany({ orderBy: { name: "asc" } });
}
