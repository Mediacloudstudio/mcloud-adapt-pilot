// Demo/seed data (PART 62). Safe to run repeatedly — every block uses
// upsert or checks for existing rows first, so re-running `npm run db:seed`
// won't create duplicates.
//
// Run with: npm run db:seed

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";

const db = new PrismaClient();

function hashKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

function makeDisplayKey(): string {
  const seg = () => randomBytes(2).toString("hex").toUpperCase();
  return `MCAP-${seg()}-${seg()}-${seg()}`;
}

async function main() {
  console.log("Seeding roles & permissions...");

  const permissionCodes = [
    "billing.view",
    "billing.manage",
    "devices.manage",
    "templates.view",
    "users.invite",
    "subscription.manage",
    "support.manage",
  ];
  for (const code of permissionCodes) {
    await db.permission.upsert({ where: { code }, update: {}, create: { code } });
  }

  const companyAdminRole = await db.role.upsert({
    where: { code: "COMPANY_ADMIN" },
    update: {},
    create: { code: "COMPANY_ADMIN", name: "Company Admin", description: "Controls company account and users." },
  });
  await db.role.upsert({
    where: { code: "DESIGNER" },
    update: {},
    create: { code: "DESIGNER", name: "Designer", description: "Uses MCloud Adapt Pilot." },
  });
  await db.role.upsert({
    where: { code: "BILLING_ADMIN" },
    update: {},
    create: { code: "BILLING_ADMIN", name: "Billing Admin", description: "Can view payments and invoices." },
  });

  console.log("Seeding plans (PART 11 — exact prices, not computed)...");

  const plan1pc = await db.plan.upsert({
    where: { code: "PLAN_1PC" },
    update: {},
    create: {
      code: "PLAN_1PC",
      name: "1 PC Plan",
      price: 10000,
      currency: "INR",
      billingFrequency: "ANNUAL",
      deviceLimit: 1,
      sortOrder: 1,
      status: "ACTIVE",
    },
  });

  const plan2pc = await db.plan.upsert({
    where: { code: "PLAN_2PC" },
    update: {},
    create: {
      code: "PLAN_2PC",
      name: "2 PC Plan",
      price: 15000,
      currency: "INR",
      billingFrequency: "ANNUAL",
      deviceLimit: 2,
      isRecommended: true,
      sortOrder: 2,
      status: "ACTIVE",
    },
  });

  const plan3pc = await db.plan.upsert({
    where: { code: "PLAN_3PC" },
    update: {},
    create: {
      code: "PLAN_3PC",
      name: "3 PC Plan",
      price: 20000,
      currency: "INR",
      billingFrequency: "ANNUAL",
      deviceLimit: 3,
      sortOrder: 3,
      status: "ACTIVE",
    },
  });

  const sharedFeatures: [string, string][] = [
    ["desktop_app", "MCloud Adapt Pilot Desktop Application"],
    ["indesign_automation", "Adobe InDesign Automation"],
    ["automated_adaptation", "Automated Creative Adaptation"],
    ["template_access", "Template Access"],
    ["software_updates", "Software Updates"],
    ["customer_portal", "Customer Portal"],
    ["device_management", "Device Management"],
    ["usage_dashboard", "Usage Dashboard"],
    ["support", "Support"],
  ];
  for (const plan of [plan1pc, plan2pc, plan3pc]) {
    for (const [featureCode, label] of sharedFeatures) {
      await db.planFeature.upsert({
        where: { planId_featureCode: { planId: plan.id, featureCode } },
        update: {},
        create: { planId: plan.id, featureCode, label, enabled: true },
      });
    }
  }

  console.log("Seeding template categories...");
  for (const [code, label, sortOrder] of [
    ["INSTORE", "In-Store", 1],
    ["OUTDOOR", "Outdoor", 2],
    ["STATIC", "Static", 3],
  ] as const) {
    await db.templateCategory.upsert({
      where: { code },
      update: {},
      create: { code, label, sortOrder },
    });
  }

  console.log("Seeding demo app version...");
  await db.appVersion.upsert({
    where: { version: "1.0.0" },
    update: {},
    create: {
      version: "1.0.0",
      minimumSupportedVersion: "1.0.0",
      platform: "WINDOWS",
      installerUrl: "https://downloads.mediacloud.studio/mcap/MCloudAdaptPilotSetup-1.0.0.exe",
      installerFileName: "MCloudAdaptPilotSetup.exe",
      releaseNotes: "Initial public release of MCloud Adapt Pilot.",
      mandatory: false,
    },
  });

  console.log("Seeding demo company: ABC Creative Pvt Ltd...");

  const demoCompany = await db.company.upsert({
    where: { id: "demo-company-abc-creative" },
    update: {},
    create: {
      id: "demo-company-abc-creative",
      companyName: "ABC Creative Pvt Ltd",
      legalName: "ABC Creative Private Limited",
      gstin: "27ABCDE1234F1Z5",
      billingAddress: "14th Floor, Creative Tower, Bandra Kurla Complex",
      state: "Maharashtra",
      pinCode: "400051",
      country: "India",
      status: "ACTIVE",
    },
  });

  const demoPasswordHash = await bcrypt.hash("Demo@12345", 12);

  const demoUser = await db.user.upsert({
    where: { email: "demo.admin@abccreative.example" },
    update: {},
    create: {
      firstName: "Aditi",
      lastName: "Shah",
      email: "demo.admin@abccreative.example",
      passwordHash: demoPasswordHash,
      emailVerified: new Date(),
      phone: "+91-9800000000",
      status: "ACTIVE",
    },
  });

  await db.companyUser.upsert({
    where: { companyId_userId: { companyId: demoCompany.id, userId: demoUser.id } },
    update: {},
    create: { companyId: demoCompany.id, userId: demoUser.id, roleId: companyAdminRole.id },
  });

  const now = new Date();
  const nextBilling = new Date(now);
  nextBilling.setMonth(nextBilling.getMonth() + 11); // ~1 year subscription, seeded mid-cycle

  const demoSubscription = await db.subscription.upsert({
    where: { id: "demo-subscription-abc-creative" },
    update: {},
    create: {
      id: "demo-subscription-abc-creative",
      companyId: demoCompany.id,
      planId: plan2pc.id,
      status: "ACTIVE",
      startDate: now,
      nextBillingDate: nextBilling,
      razorpaySubscriptionId: "sub_demo_abc_creative",
    },
  });

  await db.razorpayCustomer.upsert({
    where: { companyId: demoCompany.id },
    update: {},
    create: { companyId: demoCompany.id, razorpayCustomerId: "cust_demo_abc_creative" },
  });

  const demoPayment = await db.payment.upsert({
    where: { id: "demo-payment-abc-creative" },
    update: {},
    create: {
      id: "demo-payment-abc-creative",
      companyId: demoCompany.id,
      subscriptionId: demoSubscription.id,
      razorpayPaymentId: "pay_demo_abc_creative",
      razorpayOrderId: "order_demo_abc_creative",
      amount: 15000,
      currency: "INR",
      status: "PAID",
      paymentDate: now,
    },
  });

  await db.invoice.upsert({
    where: { id: "demo-invoice-abc-creative" },
    update: {},
    create: {
      id: "demo-invoice-abc-creative",
      companyId: demoCompany.id,
      subscriptionId: demoSubscription.id,
      paymentId: demoPayment.id,
      invoiceNumber: "MCS-2026-0001",
      customerGstin: demoCompany.gstin,
      subtotal: 15000,
      taxAmount: 2700,
      taxBreakdown: { CGST: 1350, SGST: 1350 },
      total: 17700,
      status: "PAID",
      invoiceDate: now,
    },
  });

  const rawLicenseKey = "MCAP-DEMO-0001-ABCD";
  const demoLicense = await db.license.upsert({
    where: { id: "demo-license-abc-creative" },
    update: {},
    create: {
      id: "demo-license-abc-creative",
      companyId: demoCompany.id,
      subscriptionId: demoSubscription.id,
      licenseKeyHash: hashKey(rawLicenseKey),
      displayKey: makeDisplayKey(),
      status: "ACTIVE",
      validUntil: nextBilling,
    },
  });

  const device1 = await db.device.upsert({
    where: { licenseId_deviceId: { licenseId: demoLicense.id, deviceId: "device-design-pc-01" } },
    update: {},
    create: {
      licenseId: demoLicense.id,
      companyId: demoCompany.id,
      deviceId: "device-design-pc-01",
      fingerprintHash: hashKey("fingerprint-design-pc-01"),
      deviceName: "DESIGN-PC-01",
      computerName: "DESIGN-PC-01",
      os: "Windows 11",
      appVersion: "1.0.0",
      status: "ACTIVE",
      lastSeenAt: now,
    },
  });

  const device2 = await db.device.upsert({
    where: { licenseId_deviceId: { licenseId: demoLicense.id, deviceId: "device-design-pc-02" } },
    update: {},
    create: {
      licenseId: demoLicense.id,
      companyId: demoCompany.id,
      deviceId: "device-design-pc-02",
      fingerprintHash: hashKey("fingerprint-design-pc-02"),
      deviceName: "DESIGN-PC-02",
      computerName: "DESIGN-PC-02",
      os: "Windows 11",
      appVersion: "1.0.0",
      status: "ACTIVE",
      lastSeenAt: now,
    },
  });

  const instoreCategory = await db.templateCategory.findUniqueOrThrow({ where: { code: "INSTORE" } });
  const demoTemplate = await db.template.upsert({
    where: { id: "demo-template-retail-poster" },
    update: {},
    create: {
      id: "demo-template-retail-poster",
      name: "Retail Launch Poster",
      categoryId: instoreCategory.id,
      version: "1.2.0",
      description: "Master template for multi-size retail launch posters.",
      status: "ACTIVE",
    },
  });

  await db.customerTemplate.upsert({
    where: { companyId_templateId: { companyId: demoCompany.id, templateId: demoTemplate.id } },
    update: {},
    create: { companyId: demoCompany.id, templateId: demoTemplate.id },
  });

  console.log("Seeding demo usage history (~1,248 outputs this month)...");
  const existingJobs = await db.job.count({ where: { companyId: demoCompany.id } });
  if (existingJobs === 0) {
    const jobsToCreate = 24; // 24 jobs averaging 52 outputs ≈ 1,248
    for (let i = 0; i < jobsToCreate; i++) {
      const startedAt = new Date(now);
      startedAt.setDate(startedAt.getDate() - i);
      const completedAt = new Date(startedAt.getTime() + 4 * 60 * 1000);
      await db.job.create({
        data: {
          companyId: demoCompany.id,
          userId: demoUser.id,
          deviceId: i % 2 === 0 ? device1.id : device2.id,
          templateId: demoTemplate.id,
          outputCount: 52,
          status: "DONE",
          appVersion: "1.0.0",
          startedAt,
          completedAt,
          processingTimeMs: 4 * 60 * 1000,
        },
      });
    }
  }

  console.log("Seeding a demo banner and feature flags...");
  await db.banner.upsert({
    where: { id: "demo-banner-welcome" },
    update: {},
    create: {
      id: "demo-banner-welcome",
      title: "Welcome to MCloud Adapt Pilot 1.0",
      subtitle: "Automated InDesign production is now live.",
      status: "ACTIVE",
      startDate: now,
    },
  });

  for (const code of ["enable_template_generator", "enable_ratio_generator", "enable_batch_processing"]) {
    const existingFlag = await db.featureFlag.findFirst({
      where: { code, scope: "GLOBAL", companyId: null, planId: null },
    });
    if (existingFlag) {
      await db.featureFlag.update({ where: { id: existingFlag.id }, data: { enabled: true } });
    } else {
      await db.featureFlag.create({ data: { code, scope: "GLOBAL", enabled: true } });
    }
  }

  console.log("Seeding default application settings...");
  const defaultSettings: Record<string, string> = {
    legalName: "MediaCloud Studio Private Limited",
    gstin: "",
    pan: "",
    registeredAddress: "",
    state: "Maharashtra",
    invoicePrefix: "MCAP",
    // PART 32 — configurable, never hard-coded into billing logic.
    gstRatePercent: "18",
  };
  for (const [key, value] of Object.entries(defaultSettings)) {
    await db.appSetting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  console.log("Seeding MediaCloud platform admin user...");
  const adminPasswordHash = await bcrypt.hash("Admin@12345", 12);
  await db.user.upsert({
    where: { email: "admin@mediacloud.studio" },
    update: { isPlatformAdmin: true },
    create: {
      firstName: "MediaCloud",
      lastName: "Admin",
      email: "admin@mediacloud.studio",
      passwordHash: adminPasswordHash,
      emailVerified: new Date(),
      status: "ACTIVE",
      isPlatformAdmin: true,
    },
  });

  console.log("✅ Seed complete.");
  console.log("   Customer login: demo.admin@abccreative.example / Demo@12345");
  console.log("   Admin login:    admin@mediacloud.studio / Admin@12345");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
