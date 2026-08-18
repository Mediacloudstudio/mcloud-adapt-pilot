# MCloud Adapt Pilot — System Architecture

MediaCloud Studio Pvt Ltd · Commercial website + SaaS control portal
Product: **MCloud Adapt Pilot** · Tagline: *Design Once. Deliver Everywhere.*

This document is the architecture reference for the whole build, written
before Phase 1's code (per the project's own development method). Every
later phase should be checked against this file, and this file should be
updated if a later phase legitimately needs to deviate from it.

---

## 0. Suggested modifications to the original spec

The spec you provided is thorough and technically sound. A handful of
changes are folded into the implementation below — flagging them
explicitly rather than silently deviating, so you can veto any of them:

1. **Enums instead of free-text status strings** in the database
   (`SubscriptionStatus`, `LicenseStatus`, `DeviceStatus`, etc.). Your spec
   lists these as plain strings; Postgres enums make an invalid state
   (e.g. a typo'd status) impossible to insert, which matters a lot for a
   system that gates paid software access.

2. **`TemplateCategory` is a table, not a hardcoded enum.** You explicitly
   asked to "prepare for future categories" (PART 38) — a lookup table lets
   an admin add `DIGITAL_OOH` or `PACKAGING` from the admin UI later with
   zero code changes, where an enum would need a migration + deploy.

3. **JWT sessions with a `sessionVersion` revocation check**, not
   database-backed sessions. Auth.js's Credentials provider (which you need
   for email/password) doesn't support database sessions cleanly. Instead,
   every `User` has a `sessionVersion` counter; bumping it (password
   change, admin suspend) invalidates all that user's active sessions
   within one request cycle, without the operational overhead of a session
   table on every request.

4. **Money is `Decimal(12,2)`, never a float**, everywhere — plan prices,
   payment amounts, invoice totals. This is standard practice for billing
   systems and avoids cent-level rounding drift.

5. **A background job runner is required, and Vercel alone can't provide
   it.** Grace-period expiry (PART 27), subscription "Expiring" transitions,
   and renewal reminders are all *time-based* state changes with no
   incoming HTTP request to trigger them. Vercel Cron Jobs (or an external
   scheduler calling a protected `/api/internal/cron/*` route) will run
   these on a schedule starting in Phase 6. This isn't a deviation so much
   as making an implicit requirement explicit.

6. **License keys and device fingerprints are stored hashed**, not in
   reversible form — `licenseKeyHash` / `fingerprintHash` (SHA-256). The
   UI shows a separate `displayKey` (the masked `MCAP-XXXX-XXXX-XXXX`
   form). This satisfies your own PART 20 instruction ("do not store
   reusable plain-text master license secrets") applied consistently.

7. **Rate limiting and brute-force protection** (PART 53) will use a
   lightweight token-bucket check backed by the database in early phases
   (no extra infra required to get started), with a note in Phase 7 to
   swap in Upstash Redis or Vercel's edge rate limiting once the API is
   live publicly — the interface will be a single `checkRateLimit()`
   function so the backing store can change without touching call sites.

8. **Recommended Postgres provider: Neon.** It has a generous free tier,
   scales to zero when idle (cheap for a pre-revenue product), and its
   connection pooling (via PgBouncer) plays well with Next.js serverless
   functions on Vercel. Supabase is an equally valid alternative if you
   later want its built-in storage/auth features, but nothing in this
   architecture depends on a specific provider.

None of these change anything you'll see in the product — they're
structural decisions that make the parts of your own spec (audit logging,
device security, future-proofing) actually hold up.

---

## A. System Architecture

```
                        ┌───────────────────────────┐
                        │      Public Website        │  Next.js (marketing)
                        │  Home / Pricing / Docs...  │  SSR + static, SEO'd
                        └──────────────┬─────────────┘
                                       │
                        ┌──────────────▼─────────────┐
                        │   Auth.js (Credentials)     │  Registration / Login /
                        │   Email verification         │  Password reset
                        └──────────────┬─────────────┘
                                       │
                ┌──────────────────────┼──────────────────────┐
                │                                             │
    ┌───────────▼────────────┐                    ┌───────────▼────────────┐
    │   Customer Portal        │                    │     Admin Portal        │
    │  (/portal/**)             │                    │    (/admin/**)          │
    │  Dashboard, Subscription, │                    │  Customers, Plans,      │
    │  License, Devices,        │                    │  Payments, Licenses,    │
    │  Billing, Templates, ...  │                    │  Devices, Templates,    │
    └───────────┬────────────┘                    │  Versions, Settings...  │
                │                                    └───────────┬────────────┘
                │                                                │
                └───────────────────┬────────────────────────────┘
                                    │
                        ┌───────────▼────────────┐
                        │   Application Backend     │  Next.js API routes,
                        │   (src/app/api/**,         │  business logic isolated
                        │    src/server/**)          │  in src/server/**
                        └───────────┬────────────┘
                    ┌───────────────┼────────────────┐
                    │               │                 │
        ┌───────────▼───┐ ┌─────────▼────────┐ ┌──────▼───────────┐
        │  PostgreSQL     │ │     Razorpay       │ │  Object storage   │
        │  (Prisma ORM)   │ │  Orders/Subs/      │ │  (installers,     │
        │  Single source  │ │  Webhooks           │ │  templates,       │
        │  of truth        │ │                     │ │  invoices PDF)     │
        └─────────────────┘ └────────────────────┘ └───────────────────┘
                                    ▲
                                    │  signed REST API only
                                    │  (never Razorpay, never DB directly)
                        ┌───────────┴────────────┐
                        │  MCloud Adapt Pilot       │  Python/desktop client
                        │  Desktop Application       │  (external to this repo)
                        └───────────┬────────────┘
                                    │  local automation only
                        ┌───────────▼────────────┐
                        │     Adobe InDesign         │
                        └─────────────────────────┘
```

Control flow, top to bottom, matches your PART 65 exactly:

**Razorpay** controls the payment transaction only → **MediaCloud Backend**
derives subscription status from that (never trusts Razorpay's status
directly, PART 28) → the **Plan** (plus any per-company override) controls
device entitlement and features → the **License Server** (this backend)
controls whether a specific device gets authorized → **MCloud Adapt Pilot**
performs local automation → **Adobe InDesign** does the actual creative
production. The desktop app talks to *this backend only* — never to
Razorpay, never directly to Postgres.

---

## B. Recommended Technology Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend framework | Next.js 14 (App Router) + React 18 + TypeScript | SSR for SEO'd marketing pages, API routes for backend, one deployable unit |
| Styling | Tailwind CSS | Fast to build a consistent, premium design system; no CSS file sprawl |
| Backend | Next.js API routes + isolated logic in `src/server/**` | No separate backend service to deploy/scale independently yet; logic is still decoupled enough to extract later (PART 67 scale) |
| Database | PostgreSQL | Relational integrity is essential for billing/licensing data |
| ORM | Prisma | Type-safe queries, migrations, and a single schema file as the source of truth |
| Auth | Auth.js (NextAuth v4), Credentials provider, JWT sessions | Production-ready, free, SSO-ready later (PART 14/Part "SSO added later") |
| Payments | Razorpay (Orders + Subscriptions APIs) | Specified primary gateway; architecture keeps a gateway-agnostic `payments` domain so a second gateway (PART 67) is additive, not a rewrite |
| Email | Any SMTP provider (Resend/Postmark/SES) via Nodemailer | Swappable; no vendor lock-in |
| File storage | S3-compatible (AWS S3, Cloudflare R2, or Backblaze B2) | Signed URLs for secure installer/invoice downloads (PART 59) |
| Hosting (app) | Vercel | Matches your spec; zero-config Next.js deploys, cron jobs, edge middleware |
| Hosting (DB) | Neon (or Supabase) | Managed Postgres, portable — the app only needs a `DATABASE_URL`, so switching provider is a config change |
| Background jobs | Vercel Cron → protected `/api/internal/cron/*` routes | Handles grace-period expiry, renewal reminders (see modification #5 above) |

Nothing here is Vercel-specific at the code level — `next build` output
runs on any Node.js host (Railway, Render, a plain VPS via `next start`),
satisfying your "keep the architecture portable" requirement.

---

## C. Database Structure

Full schema lives in `prisma/schema.prisma` (implemented in Phase 1) — that
file is the authoritative source. Summary of the model groups:

- **Identity**: `User`, `Account`/`Session` (NextAuth-compatible, unused
  until SSO ships), `EmailVerificationToken`, `PasswordResetToken`.
- **Company / RBAC**: `Company`, `Role`, `Permission`, `RolePermission`,
  `CompanyUser` (join table — a user can belong to multiple companies with
  different roles in each).
- **Plans & Subscriptions**: `Plan`, `PlanFeature`, `CompanyPlanOverride`
  (enterprise custom pricing, PART 46), `Subscription`.
- **Payments & Billing**: `RazorpayCustomer`, `Payment`, `RazorpayEvent`
  (webhook idempotency ledger, PART 29), `Refund`, `Invoice`.
- **Licensing & Devices**: `License`, `Device`, `LicenseEvent` (full audit
  trail of activate/validate/deactivate/reset events per PART 47).
- **Templates**: `TemplateCategory` (table, see modification #2),
  `Template`, `CustomerTemplate` (per-company or per-plan grants).
- **Application control**: `AppVersion`, `AppSetting` (generic key/value),
  `Banner`, `FeatureFlag` (scoped GLOBAL → PLAN → COMPANY).
- **Usage**: `Job` (one row per desktop-app production run).
- **Support**: `SupportTicket`, `SupportTicketReply`.
- **Audit**: `AuditLog` (every admin mutation, PART 55).

---

## D. Complete Page List

**Public marketing** (SEO-indexed, responsive mobile→desktop):
`/`, `/product`, `/how-it-works`, `/features`, `/solutions`,
`/solutions/[segment]`, `/pricing`, `/downloads`, `/resources`,
`/docs` (documentation index), `/support` (public help center),
`/login`, `/register`, `/forgot-password`, `/reset-password`,
`/verify-email`, `/legal/terms`, `/legal/privacy`.

**Customer portal** (`/portal/**`, auth-required, `noindex`):
`/portal` (dashboard), `/portal/subscription`, `/portal/license`,
`/portal/devices`, `/portal/downloads`, `/portal/templates`,
`/portal/usage`, `/portal/billing`, `/portal/billing/invoices`,
`/portal/support`, `/portal/support/[ticketId]`, `/portal/team`,
`/portal/settings`.

**Admin portal** (`/admin/**`, admin-role-required, `noindex`):
`/admin` (dashboard), `/admin/customers`, `/admin/customers/[companyId]`,
`/admin/plans`, `/admin/subscriptions`, `/admin/payments`,
`/admin/razorpay`, `/admin/licenses`, `/admin/devices`,
`/admin/templates`, `/admin/application/versions`,
`/admin/application/banners`, `/admin/application/feature-flags`,
`/admin/downloads`, `/admin/usage`, `/admin/invoices`, `/admin/refunds`,
`/admin/support`, `/admin/audit-logs`, `/admin/settings`.

---

## E. Customer Flow

```
Visit site → Read product/pricing → Register (PART 13 fields)
  → Verify email → Create company → Select plan
  → Backend creates/reuses Razorpay Customer
  → Backend creates Razorpay Order/Subscription
  → Razorpay Checkout (frontend) → Payment completed
  → Backend verifies signature (server-side, mandatory)
  → Webhook confirms → Payment + Subscription(ACTIVE) + License created
  → Customer dashboard → Download installer (signed URL)
  → Install desktop app → Enter license key
  → Desktop calls /api/v1/license/activate → device entitlement checked
  → Approved → MCloud Adapt Pilot works with Adobe InDesign
```

## F. Admin Flow

```
Admin logs in (separate role check, not just "any logged-in user")
  → Dashboard (KPIs: customers, revenue, active licenses/devices, errors)
  → Customers → select a company → view plan/subscription/payment/
    license/devices/templates/usage in one profile
  → Change entitlement (plan, device limit, license status, extend access)
  → Every change writes an AuditLog row (who/what/when/before/after)
  → Change is live immediately — desktop app picks it up on its next
    license validation call, no redeploy needed
```

## G. Razorpay Payment Architecture

```
Customer selects plan → creates/logs into account
  → POST /api/billing/checkout
      - backend looks up the Plan server-side (price NEVER taken from
        the frontend — PART 53)
      - creates/retrieves Razorpay Customer for this Company
      - creates a Razorpay Order (one-time) or Subscription (recurring)
  → Frontend opens Razorpay Checkout with the order/subscription id
  → Customer pays → Razorpay returns a client-side result
  → Frontend sends that result to POST /api/billing/verify
      - backend recomputes and checks the Razorpay HMAC signature
      - a failed/missing signature NEVER activates anything
  → POST /api/v1/webhooks/razorpay (server-to-server, independent of the
    user's browser being open)
      - verifies X-Razorpay-Signature against RAZORPAY_WEBHOOK_SECRET
      - looks up RazorpayEvent.eventId — if already PROCESSED, returns
        200 immediately and does nothing else (idempotency, PART 29)
      - otherwise: creates/updates Payment, transitions Subscription
        status, creates/updates License, writes AuditLog
  → Subscription.status = ACTIVE only after webhook-confirmed payment —
    never from the frontend's "success" callback alone (PART 16 critical
    rule, enforced literally: the verify endpoint marks payment PAID
    provisionally, but entitlement activation happens from the webhook
    handler, so a customer closing the tab mid-flow can't skip payment).
```

## H. Desktop License Architecture

```
Desktop app has a license key (customer pastes it once)
  → POST /api/v1/license/activate { license_key, device_id,
      machine_fingerprint, device_name, os, app_version }
      backend checks, in order:
        1. license exists (by hash) and status == ACTIVE
        2. subscription.status is one of ACTIVE / GRACE_PERIOD
        3. device not BLOCKED
        4. count(devices WHERE status=ACTIVE) < effective device limit
           (plan.deviceLimit, or CompanyPlanOverride.customDeviceLimit,
           or license.deviceLimitOverride — most specific wins)
      → if all pass: create/reactivate Device row, write LicenseEvent,
        return a short-lived signed authorization token
      → if device limit exceeded: 409 with a message the desktop UI shows
        verbatim ("Device Limit Reached... Deactivate Existing Device or
        Upgrade")
  → Desktop periodically calls POST /api/v1/license/validate
      → returns valid/status/plan/device_limit/allowed_features/
        app_update_available/mandatory_update/maintenance_mode
      → NEVER returns Razorpay secrets, DB credentials, or other
        customers' data (PART 50)
  → Desktop sends POST /api/v1/device/heartbeat periodically
      → updates Device.lastSeenAt only
  → Offline grace: validate() response includes a short-lived signed
    token (24–48h configurable) the desktop caches; past that window it
    must reconnect — no permanent offline licenses (PART 52)
```

---

## I. Folder Structure (Phase 1, as implemented)

```
mcloud-adapt-pilot/
├── README.md                     Setup instructions (Phase 1)
├── docs/
│   └── ARCHITECTURE.md           This file
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.js
├── .eslintrc.json
├── .env.example
├── .gitignore
├── prisma/
│   ├── schema.prisma             Full domain model (all phases' tables)
│   └── seed.ts                   Demo data (PART 62)
└── src/
    ├── middleware.ts             Protects /portal/** and /admin/**
    ├── types/
    │   └── next-auth.d.ts        Typed session/JWT shape
    ├── lib/
    │   ├── env.ts                Validated environment variables
    │   ├── db.ts                 Prisma client singleton
    │   ├── auth.ts               Auth.js configuration
    │   └── auth/
    │       ├── password.ts       bcrypt hash/verify
    │       └── tokens.ts         One-time token generate/hash helpers
    ├── server/
    │   └── README.md             Where Phase 6-8 business logic modules go
    └── app/
        ├── layout.tsx            Root layout + default SEO metadata
        ├── globals.css           Tailwind entrypoint + brand tokens
        ├── page.tsx               Placeholder homepage (real one: Phase 2)
        └── api/
            └── auth/
                └── [...nextauth]/route.ts
```

Future phases add to this structure without restructuring it:
- Phase 2 adds `src/app/(marketing)/**` route group + `src/components/**`.
- Phase 3 adds `/register`, `/login`, `/verify-email`, `/forgot-password`
  pages and their API routes.
- Phase 4 adds `src/app/portal/**` + a portal layout/sidebar.
- Phase 5 adds `src/app/admin/**` + an admin layout/sidebar + role-gate.
- Phase 6 adds `src/server/payments/**`, `src/server/billing/**`, and
  `src/app/api/v1/webhooks/razorpay/route.ts`.
- Phase 7 adds `src/server/licensing/**` and `src/app/api/v1/license/**`,
  `src/app/api/v1/device/**`.
- Phase 8 adds `src/server/entitlements/**` and
  `src/app/api/v1/app/**`, `src/app/api/v1/templates/**`.
- Phase 9 adds `docs/desktop-integration.md` (no app code — it's
  documentation for the separate Python desktop client repo).

---

## Phase log

- **PHASE 1 — COMPLETE.** Project scaffold, full Prisma schema (all
  domains, ahead of when each is wired up, so later phases are additive),
  Auth.js structure (Credentials provider; SSO-ready), environment
  validation, seed data, README.
- **PHASE 2 — COMPLETE.** Public marketing site (Home, Product, How It
  Works, Features, Solutions, Pricing, Downloads/Resources/Docs/Support
  placeholders, legal placeholders), responsive Header + Footer, and the
  Login/Register pages. Notable Phase 2 decisions:
  - The **Pricing page is a server component reading `Plan`/`PlanFeature`
    straight from Postgres** (`src/lib/plans.ts`, `dynamic = "force-dynamic"`)
    rather than hardcoded content — proving out PART 45's "no code
    deployment needed to change pricing" requirement immediately instead
    of waiting for the admin portal (Phase 5) to exist.
  - **Login is fully functional today**, not just a UI shell — it calls
    the Auth.js Credentials flow built in Phase 1. Try it with the seed
    demo account. A minimal `/portal` and `/admin` placeholder page were
    added (a few lines each) purely to prove `src/middleware.ts` actually
    blocks unauthenticated access to both route groups end-to-end; the
    real dashboards are still Phase 4 and Phase 5.
  - **Register is a fully validated UI** (all PART 13 fields, password
    confirmation, terms acceptance) that posts to `/api/auth/register`.
    That route doesn't exist until Phase 3 — submitting today surfaces a
    clear in-form message rather than a broken error, and the form needs
    no changes once Phase 3 adds the endpoint.
- **PHASE 3 — COMPLETE.** Registration API (`POST /api/auth/register`,
  transactional Company+User+CompanyUser creation), email verification
  (`/verify-email`, hashed one-time tokens, 24h expiry), forgot/reset
  password (`/forgot-password`, `/reset-password`, 1h expiry tokens,
  `sessionVersion` bump on reset so a password change signs the user out
  everywhere), and DB-backed brute-force rate limiting on login,
  registration, and password-reset requests (`RateLimitAttempt` model,
  `src/lib/rate-limit.ts`). Transactional email goes through
  `src/lib/email.ts` (nodemailer over SMTP; falls back to logging the
  email to the server console when `EMAIL_SERVER_HOST` isn't configured,
  so the full flow is testable without a real mail account).
- **PHASE 4 — COMPLETE.** Full customer portal at `/portal/**`: Dashboard,
  Subscription, License, Devices, Downloads, Templates, Usage, Billing +
  Invoices, Support (tickets + threaded replies), Team (invite via the
  same reset-password flow as "forgot password" — one flow, two entry
  points), Account Settings. All data reads are company-scoped
  (`src/server/portal/queries.ts`); all mutations are React Server
  Actions that re-derive the caller's identity server-side
  (`src/server/portal/actions.ts`) rather than trusting anything passed
  from the client. Actions with no Phase 6/7 backend yet (Upgrade Plan,
  installer downloads) link out or show an honest "ships in Phase X" note
  instead of pretending to work.
- **PHASE 5 — COMPLETE.** Full admin (platform-staff) portal at
  `/admin/**`: Dashboard (PART 43 KPIs — customers, active/suspended/trial
  subscriptions, active licenses/devices, MTD revenue, failed payments,
  today's/MTD output volume, recent payments/activations/errors),
  Customers (list + detail with change-plan, extend-access,
  suspend/reactivate), Plans (inline-editable — the same rows Phase 2's
  public `/pricing` page reads, so an admin price change is live
  immediately, no deploy), Subscriptions, Payments, Licenses
  (status control + per-license device-limit override), Devices (admin
  reset), Templates (create + assign to customer), Application →
  Versions (publish with mandatory-update flag), Banners,
  Feature Flags (global/company/plan-scoped toggles), Usage
  (cross-customer output stats + top customers), Invoices, Refunds
  (manual record — actual money movement stays in the Razorpay dashboard
  until Phase 6 automates it), Support (all-customer ticket queue +
  threaded reply), Audit Logs (read-only view of every `AuditLog` row),
  and Settings (MediaCloud's own legal/GSTIN/PAN/invoice-prefix identity
  used on generated invoices, PART 32).

  Two access-control additions ship with this phase:
  - **`User.isPlatformAdmin`** (new boolean column) is deliberately
    separate from the company-scoped `COMPANY_ADMIN` role added in
    Phase 1 — a customer's own admin has zero admin-portal access no
    matter what their in-company role is; only MediaCloud staff accounts
    seeded/flagged with `isPlatformAdmin: true` can reach `/admin/**`
    (`src/server/admin/context.ts` redirects everyone else to `/portal`).
  - **Every mutation in `src/server/admin/actions.ts` calls
    `recordAuditLog()`** (`src/server/audit/log.ts`) — who, what entity,
    before/after values, when — satisfying PART 55 from day one rather
    than bolting it on later. `suspendCustomer` additionally force-signs-out
    every user at that company by bumping each `User.sessionVersion`,
    reusing the same JWT-revocation mechanism built in Phase 3.

  Server actions that take a parameterized ID (e.g. "suspend company X")
  are wired into forms with `action.bind(null, id)` rather than an inline
  arrow function — required for Next.js to recognize the reference as a
  valid cross-boundary Server Reference.
- **PHASE 6 — COMPLETE.** Full Razorpay integration: order creation
  (`src/server/billing/orders.ts` — price and GST are always looked up
  server-side from `Plan`/`CompanyPlanOverride`/`AppSetting`, never
  trusted from the client, PART 53/66), a browser checkout flow
  (`src/components/billing/checkout-button.tsx` loads Razorpay
  Checkout.js on demand, opens it with a server-issued order, and posts
  the result back for verification — the desktop app is never involved
  and never talks to Razorpay directly, PART 65), signature-verified
  confirmation (`/api/v1/billing/verify`, HMAC over
  `order_id|payment_id` with the key secret), and an idempotent webhook
  receiver (`/api/v1/webhooks/razorpay`, PART 29) that is the durable
  source of truth for `payment.captured`, `payment.failed`, and
  `refund.processed` — every inbound event is claimed by its
  `x-razorpay-event-id` in the `RazorpayEvent` table before any side
  effect runs, so Razorpay's automatic retries can never double-activate
  a subscription or double-issue an invoice.

  `src/server/billing/activate.ts` is the single shared "a payment was
  captured" routine called by both the verify route and the webhook —
  it activates the subscription, issues (or reactivates) exactly one
  hashed license key per company (`src/lib/license-key.ts`, PART 20 —
  the raw key is only ever visible once, at issuance), and generates an
  invoice with a GST breakdown computed from admin-configurable settings
  (`src/lib/gst.ts` — rate and MediaCloud's own registered state both
  live in `AppSetting`, never hard-coded; intra-state sales split into
  CGST+SGST, everything else is IGST, standard Indian GST treatment).
  Invoice numbers are prefix + year + a per-year sequence
  (`src/server/billing/invoice.ts`), with the prefix itself admin-editable
  from Phase 5's Settings page.

  Two Phase 5 admin flows are now real instead of manual: `Admin →
  Refunds` calls the Razorpay Refund API directly when a Razorpay
  payment ID is on file (falling back to a local-only record when it
  isn't — e.g. a payment that predates Razorpay being configured), and
  the customer portal gained `/portal/subscription/checkout`, a live
  plan picker wired to the same checkout flow, replacing the "Upgrade
  Plan → /pricing" placeholder from Phase 4.

  Known simplification, flagged for a future pass rather than blocking
  this phase: switching plans via checkout charges the new plan's full
  price rather than prorating against the unused portion of the current
  cycle, even though `Subscription.upgradeStrategy` already anticipates
  `PRORATED_DIFFERENCE` billing. Proper proration needs a policy
  decision (credit vs. charge the difference, handle mid-cycle
  downgrades) that's worth a dedicated pass rather than guessing.
- **PHASE 7 — COMPLETE.** The desktop app's licensing surface:
  `POST /api/v1/license/activate`, `POST /api/v1/license/validate`,
  `POST /api/v1/license/deactivate`, `POST /api/v1/device/heartbeat`.
  None of these trust the caller about its own entitlement — every
  response is computed fresh from `License`/`Subscription`/`Device`
  rows on every single call (PART 66); a device presenting a
  cryptographically valid but stale token still gets today's actual
  status, not whatever the token said when it was issued.

  Device-limit enforcement (`src/server/licensing/device-limit.ts`)
  resolves the applicable limit in priority order — a per-license admin
  override, then a per-company enterprise override
  (`CompanyPlanOverride`, PART 46), then the plan's own `deviceLimit` —
  and counts only currently-`ACTIVE` devices, so a deactivated old
  laptop never blocks a new one. Re-activating the same `deviceId` is
  idempotent (refreshes metadata, doesn't consume a second slot);
  exceeding the limit writes a `DEVICE_LIMIT_REJECTED` `LicenseEvent`
  instead of silently failing, so Admin → Licenses shows exactly what
  was attempted and rejected.

  `src/lib/license-token.ts` issues a short-lived, HMAC-signed "device
  token" (`LICENSE_TOKEN_TTL_HOURS`, default 48h) on every successful
  activate/validate call, so the desktop app can keep working offline
  for that window and re-send its actual license key less often. The
  token is only ever used to *look up* which device is calling
  (`src/server/licensing/resolve.ts`, which also accepts a
  licenseKey+deviceId fallback for a client that lost its stored
  token) — it is never treated as proof that the license is still
  valid; that's re-checked from the database on every request
  regardless of what the token claims. `/license/activate` is rate
  limited per IP (20/hour) as a brute-force guard against license-key
  guessing, the same DB-backed limiter built in Phase 3.

  Feature flags, template permissions, and app-version/update checks
  are deliberately NOT part of this phase — those are Phase 8
  (`/api/v1/app/**`), so the desktop client has one endpoint family for
  "am I licensed to run at all" and a separate one for "what can I do
  once I'm running."
- **PHASE 8 — COMPLETE.** The desktop app's "what can I do" surface:
  `POST /api/v1/app/version` (public — no device token needed, since a
  fresh install has no license yet and still needs to check for
  updates before activation; returns `updateAvailable` vs.
  `updateRequired` by comparing the caller's version against the
  latest published `AppVersion` and its `minimumSupportedVersion`),
  `POST /api/v1/app/config` (device-authed — resolved feature flags +
  active banners), and `POST /api/v1/templates/list` (device-authed —
  the InDesign templates this company is actually entitled to
  generate from).

  `src/server/entitlements/feature-flags.ts` resolves each flag `code`
  with the same "most specific scope wins" precedence used everywhere
  else in this build: a `COMPANY`-scoped row beats a `PLAN`-scoped row
  beats a `GLOBAL` row, so Admin → Feature Flags (Phase 5) can roll a
  feature out globally and still carve out a per-customer or per-plan
  exception without special-casing anything in the API.
  `src/server/entitlements/templates.ts` returns exactly the templates
  an admin has explicitly granted via `CustomerTemplate` (Admin →
  Templates), filtered to currently-`ACTIVE` ones — archiving a
  template hides it from every desktop client instantly, no grant
  rows need to change.

  All three endpoints keep the desktop client on the same identity
  model built in Phase 7 (`resolveDeviceFromRequest` — a device token,
  or a licenseKey+deviceId fallback) rather than inventing a second
  auth mechanism, and `/app/config` / `/templates/list` both still
  refuse to answer if the calling device or its license isn't
  currently `ACTIVE` (PART 66 — device/license state is always
  re-checked, never assumed from a prior successful call).

  With Phases 6-8 done, the full server side of PART 68's spec is
  built: public site, auth, customer portal, admin portal, payments,
  licensing, and application control. Phase 9 is documentation only —
  no new application code — showing how the separate Python desktop
  client repo is expected to call everything built here.
- **PHASE 9 — COMPLETE.** `docs/desktop-integration.md` — the
  integration guide for the separate Python desktop client repo. Covers
  the security model (thin, untrusted client; server decides
  everything; no secret ever reaches the client), the base URL/request
  shape, every endpoint from Phases 7-8 with full request/response
  examples and error-status tables, where/how to store the short-lived
  device token, how to generate a stable `deviceId` and a
  privacy-conscious machine `fingerprint`, a minimal illustrative Python
  client (activation, validation, heartbeat, config, templates, with
  offline-caching behavior bounded by the token's expiry), and an
  explicit "never do this" list (never call Razorpay directly, never
  keep the raw license key past activation, never trust cached
  entitlement indefinitely, never build client-side device-limit logic).

  No application code changed in this phase — by design, per PART 68.

---

## All nine phases are now complete

MCloud Adapt Pilot's full server-side platform — public marketing site,
authentication, customer portal, admin portal, Razorpay billing,
licensing APIs, and application-management APIs for the desktop
client — is built. The **8 suggested modifications** from Phase 1 (see
above) were carried through every subsequent phase rather than
bolted on at the end: enums over free-text strings, `TemplateCategory`
as an admin-extensible table, JWT + `sessionVersion` revocation,
`Decimal` money everywhere, hashed license keys/fingerprints, DB-backed
rate limiting, and Neon as the recommended Postgres host all show up
directly in the schema and code delivered across Phases 1-9.

**What's genuinely out of scope for this build** (flagged honestly
rather than faked): true prorated plan-switching (Phase 6 charges the
new plan's full price today), installer file hosting/signed URLs
(`STORAGE_*` env vars are wired for a future pass), and the Python
desktop client itself (Phase 9 is its integration contract, not its
implementation — that's a separate repository).

**Before this goes to production:** run `npm run db:generate` and
`npm run db:migrate` against a real Postgres database (this sandbox
cannot reach `binaries.prisma.sh` to download the Prisma engine, so
every phase was verified via ESLint + `tsc --noEmit` + a full `next
build` reaching "Compiled successfully," with the remaining type
errors isolated and confirmed to be exactly the unresolved-Prisma-types
gap — see each phase's notes above), fill in real Razorpay keys and a
webhook secret, configure real SMTP credentials, and read
`docs/desktop-integration.md` before wiring up the Python client.
