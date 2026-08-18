# `src/server/`

This directory is reserved for the backend business-logic modules that later
phases will add. Keeping them out of `src/app/api/**/route.ts` files directly
means the logic is independently testable and reusable between the customer
portal API, the admin API, and the desktop-application API.

Planned modules (do not create until the relevant phase):

- `server/subscriptions/` — subscription state machine (PART 28), grace
  period transitions, upgrade/downgrade logic (PART 24–26). Phase 6/7.
- `server/licensing/` — license key generation/hashing, activation,
  validation, device-limit enforcement (PART 20–23, 47–52). Phase 7.
- `server/payments/` — Razorpay order/subscription creation, signature
  verification, webhook handlers (PART 15–16, 29). Phase 6.
- `server/billing/` — invoice generation, GST calculation from configurable
  rates (PART 32). Phase 6.
- `server/entitlements/` — resolves a company's effective plan, device
  limit, and feature flags, accounting for `CompanyPlanOverride` and
  `FeatureFlag` scoping (GLOBAL → PLAN → COMPANY, most specific wins).
  Phase 7/8.
- `server/audit/` — a single `recordAuditLog()` helper every admin mutation
  calls, so PART 55 logging can't be forgotten ad hoc in route handlers.
  Phase 5.

Every function in `src/server/**` must treat its inputs as untrusted and
re-derive price, plan, device limit, and payment/license status from the
database — never from a value passed in by the frontend or the desktop
client (PART 53/66).
