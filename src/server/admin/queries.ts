// Read-only admin data access. Unlike src/server/portal/queries.ts, these
// are intentionally NOT company-scoped — the admin portal's entire job is
// cross-customer visibility — but every route that calls these sits
// behind getAdminContext() (src/server/admin/context.ts), so only
// isPlatformAdmin users ever reach them.

import { db } from "@/lib/db";

function startOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}
function startOfDay(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function getAdminDashboardStats() {
  const [
    totalCustomers,
    activeSubscriptions,
    suspendedSubscriptions,
    trialSubscriptions,
    activeLicenses,
    activeDevices,
    paidThisMonth,
    failedPayments,
    outputsToday,
    outputsThisMonth,
    recentPayments,
    recentDevices,
    recentErrorJobs,
  ] = await Promise.all([
    db.company.count(),
    db.subscription.count({ where: { status: "ACTIVE" } }),
    db.subscription.count({ where: { status: "SUSPENDED" } }),
    db.subscription.count({ where: { status: "TRIAL" } }),
    db.license.count({ where: { status: "ACTIVE" } }),
    db.device.count({ where: { status: "ACTIVE" } }),
    db.payment.aggregate({ where: { status: "PAID", paymentDate: { gte: startOfMonth() } }, _sum: { amount: true } }),
    db.payment.count({ where: { status: "FAILED" } }),
    db.job.aggregate({ where: { startedAt: { gte: startOfDay() } }, _sum: { outputCount: true } }),
    db.job.aggregate({ where: { startedAt: { gte: startOfMonth() } }, _sum: { outputCount: true } }),
    db.payment.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { company: true } }),
    db.device.findMany({ orderBy: { activatedAt: "desc" }, take: 6, include: { company: true } }),
    db.job.findMany({ where: { status: "ERROR" }, orderBy: { startedAt: "desc" }, take: 6, include: { company: true } }),
  ]);

  return {
    totalCustomers,
    activeSubscriptions,
    suspendedSubscriptions,
    trialSubscriptions,
    activeLicenses,
    activeDevices,
    monthlyRevenue: paidThisMonth._sum.amount ?? 0,
    failedPayments,
    outputsToday: outputsToday._sum.outputCount ?? 0,
    outputsThisMonth: outputsThisMonth._sum.outputCount ?? 0,
    recentPayments,
    recentDevices,
    recentErrorJobs,
  };
}

export async function getCustomers() {
  return db.company.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      subscriptions: { orderBy: { createdAt: "desc" }, take: 1, include: { plan: true } },
      licenses: { orderBy: { createdAt: "desc" }, take: 1 },
      devices: true,
      users: { include: { user: true } },
    },
  });
}

export async function getCustomerDetail(companyId: string) {
  return db.company.findUnique({
    where: { id: companyId },
    include: {
      subscriptions: { orderBy: { createdAt: "desc" }, include: { plan: true } },
      licenses: { orderBy: { createdAt: "desc" }, include: { devices: true } },
      devices: true,
      users: { include: { user: true, role: true } },
      payments: { orderBy: { createdAt: "desc" }, take: 10 },
      razorpayCustomer: true,
      planOverride: true,
      jobs: { orderBy: { startedAt: "desc" }, take: 10 },
      auditLogs: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
}

export async function getPlans() {
  return db.plan.findMany({ orderBy: { sortOrder: "asc" }, include: { features: true } });
}

export async function getSubscriptions() {
  return db.subscription.findMany({
    orderBy: { createdAt: "desc" },
    include: { company: true, plan: true },
  });
}

export async function getPayments() {
  return db.payment.findMany({
    orderBy: { createdAt: "desc" },
    include: { company: true, invoice: true },
  });
}

export async function getLicenses() {
  return db.license.findMany({
    orderBy: { createdAt: "desc" },
    include: { company: true, devices: true, subscription: { include: { plan: true } } },
  });
}

export async function getDevices() {
  return db.device.findMany({ orderBy: { activatedAt: "desc" }, include: { company: true } });
}

export async function getTemplates() {
  return db.template.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true, customerTemplates: { include: { company: true } } },
  });
}

export async function getTemplateCategories() {
  return db.templateCategory.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getAppVersions() {
  return db.appVersion.findMany({ orderBy: { publishedAt: "desc" } });
}

export async function getBanners() {
  return db.banner.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getFeatureFlags() {
  return db.featureFlag.findMany({
    orderBy: { createdAt: "desc" },
    include: { company: true, plan: true },
  });
}

export async function getAdminUsageStats() {
  const [outputsToday, outputsThisMonth, jobsToday, doneJobs, errorJobs, topCompanies] = await Promise.all([
    db.job.aggregate({ where: { startedAt: { gte: startOfDay() } }, _sum: { outputCount: true } }),
    db.job.aggregate({ where: { startedAt: { gte: startOfMonth() } }, _sum: { outputCount: true } }),
    db.job.count({ where: { startedAt: { gte: startOfDay() } } }),
    db.job.count({ where: { status: "DONE" } }),
    db.job.count({ where: { status: "ERROR" } }),
    db.job.groupBy({
      by: ["companyId"],
      _sum: { outputCount: true },
      orderBy: { _sum: { outputCount: "desc" } },
      take: 10,
    }),
  ]);

  const companies = await db.company.findMany({
    where: { id: { in: topCompanies.map((c) => c.companyId) } },
  });

  return {
    outputsToday: outputsToday._sum.outputCount ?? 0,
    outputsThisMonth: outputsThisMonth._sum.outputCount ?? 0,
    jobsToday,
    doneJobs,
    errorJobs,
    topCompanies: topCompanies.map((row) => ({
      company: companies.find((c) => c.id === row.companyId),
      outputs: row._sum.outputCount ?? 0,
    })),
  };
}

export async function getInvoices() {
  return db.invoice.findMany({ orderBy: { invoiceDate: "desc" }, include: { company: true } });
}

export async function getRefunds() {
  return db.refund.findMany({ orderBy: { createdAt: "desc" }, include: { payment: { include: { company: true } } } });
}

export async function getAllTickets() {
  return db.supportTicket.findMany({
    orderBy: { updatedAt: "desc" },
    include: { company: true, user: true },
  });
}

export async function getAdminTicket(ticketId: string) {
  return db.supportTicket.findUnique({
    where: { id: ticketId },
    include: { company: true, user: true, replies: { include: { author: true }, orderBy: { createdAt: "asc" } } },
  });
}

export async function getAuditLogs() {
  return db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: true, company: true },
  });
}

export async function getAppSettings() {
  const settings = await db.appSetting.findMany();
  return Object.fromEntries(settings.map((s) => [s.key, s.value]));
}
