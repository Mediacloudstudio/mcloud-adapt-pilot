# Deploying MCloud Adapt Pilot — Beginner's Guide

This walks you through putting the site live on the internet, for free,
using **Vercel** (hosting) and **Neon** (Postgres database). It assumes
you've never deployed a website before. Total time: about 20–30 minutes.

**Why not deploy from inside this Claude session?** This workspace runs in
a sandboxed cloud environment that can't reach Vercel, Neon, or the
Prisma binary-download servers over the network (that's also why every
phase of this build was verified with lint + typecheck + a full `next
build` rather than an actual database connection). None of that
restriction exists on your own computer or on Vercel's build servers —
this guide runs entirely outside this session, in your browser and your
Mac's own Terminal.

---

## What you'll end up with

A real, working URL (something like `https://mcloud-adapt-pilot.vercel.app`,
or your own domain later) serving the actual site — marketing pages,
working login/registration, the customer portal, and the admin portal —
backed by a real Postgres database. Razorpay will be in **test mode** to
start, so nobody gets charged real money until you swap in live keys.

---

## Prerequisites

Three free accounts, all sign-up-with-GitHub or email:

1. **[GitHub](https://github.com/signup)** — where the code will live so
   Vercel can find it.
2. **[Neon](https://neon.tech)** — the Postgres database.
3. **[Vercel](https://vercel.com/signup)** — the hosting.

You'll also want **[GitHub Desktop](https://desktop.github.com)**
installed if you'd rather not use the command line for the "push my
code to GitHub" step — the guide below covers both ways.

---

## Step 1 — Push the project to GitHub

The project on your Mac is at:
```
~/Documents/Adaptpilot  Subscription site/mcloud-adapt-pilot
```

### Option A — GitHub Desktop (no command line)

1. Open GitHub Desktop, sign in with your GitHub account.
2. `File → Add Local Repository…` → choose the `mcloud-adapt-pilot`
   folder above.
3. If it says "this isn't a Git repository," click **create a
   repository** right there.
4. Click **Publish repository** at the top. Name it `mcloud-adapt-pilot`.
   You can leave it **Private** — Vercel can still access a private repo
   once you connect your GitHub account to it in Step 3.

### Option B — Terminal

Open Terminal, then:

```bash
cd "~/Documents/Adaptpilot  Subscription site/mcloud-adapt-pilot"
git init
git add .
git commit -m "Initial commit — MCloud Adapt Pilot"
```

Then create an empty repo on GitHub (github.com → the `+` in the top
right → **New repository** → name it `mcloud-adapt-pilot` → **do not**
check "Add a README" → Create). GitHub will show you two commands to run
next — they'll look like:

```bash
git remote add origin https://github.com/YOUR-USERNAME/mcloud-adapt-pilot.git
git branch -M main
git push -u origin main
```

Run those, entering your GitHub username/password (or a personal access
token, if GitHub asks for one) when prompted.

> **A `.gitignore` file is already included** — it excludes `node_modules`,
> `.next`, and your real `.env` file, so you won't accidentally commit
> secrets or bloat the repo. Double-check `git status` before your first
> commit doesn't show a `.env` file — if it does, stop and let me know
> before pushing.

---

## Step 2 — Create your Postgres database on Neon

1. Sign in to [neon.tech](https://neon.tech), click **Create a project**.
2. Name it `mcloud-adapt-pilot`, pick any region close to you, keep the
   defaults, click **Create project**.
3. On the project dashboard, find the **Connection string** box. Copy
   the one that looks like:
   ```
   postgresql://neondb_owner:AbC123xyz@ep-cool-name-12345.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   Save this somewhere — it's your `DATABASE_URL`.

---

## Step 3 — Deploy on Vercel

1. Sign in to [vercel.com](https://vercel.com), click **Add New… →
   Project**.
2. Connect your GitHub account if prompted, then find and **Import** the
   `mcloud-adapt-pilot` repo you just pushed.
3. Vercel will auto-detect it's a Next.js project — leave the build
   settings on their defaults.
4. Before clicking Deploy, open **Environment Variables** and add these
   (see `.env.example` in the repo for the full reference list):

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the Neon connection string from Step 2 |
   | `NEXTAUTH_SECRET` | generate one — see below |
   | `NEXTAUTH_URL` | leave blank for now; you'll fill this in after your first deploy gives you a URL (Step 3b) |
   | `NEXT_PUBLIC_APP_URL` | same as `NEXTAUTH_URL` — fill in after first deploy |
   | `RAZORPAY_KEY_ID` | your **test-mode** key from [Razorpay Dashboard → API Keys](https://dashboard.razorpay.com/app/keys) |
   | `RAZORPAY_KEY_SECRET` | the matching test-mode secret |
   | `RAZORPAY_WEBHOOK_SECRET` | see Step 5 — can add this after first deploy too |
   | `LICENSE_TOKEN_SIGNING_SECRET` | generate one — see below |

   To generate a random secret for `NEXTAUTH_SECRET` and
   `LICENSE_TOKEN_SIGNING_SECRET`, run this in Terminal and paste the
   output:
   ```bash
   openssl rand -base64 32
   ```
   (run it twice — once for each variable, they should be different
   values).

   Email (`EMAIL_SERVER_*`) is optional at first — without it, the app
   logs verification/reset emails to Vercel's function logs instead of
   sending real ones, so registration still works for testing.

5. Click **Deploy**. First deploy takes 1–3 minutes. This is the step
   where `prisma generate` actually runs successfully — it happens on
   Vercel's build servers, which have normal internet access.

### Step 3b — Fill in the URL variables

Once deployed, Vercel gives you a URL like
`https://mcloud-adapt-pilot-yourname.vercel.app`. Go back to
**Project → Settings → Environment Variables**, set both
`NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to that exact URL (including
`https://`), then **Deployments → ⋯ → Redeploy** so the change takes
effect.

---

## Step 4 — Set up the database schema and seed data

The database exists on Neon but is empty — no tables yet. Run this
**once**, from your own Mac's Terminal (not this Claude session), using
the same `DATABASE_URL` you put into Vercel:

```bash
cd "~/Documents/Adaptpilot  Subscription site/mcloud-adapt-pilot"
echo 'DATABASE_URL="paste-your-neon-connection-string-here"' > .env
npm install
npm run db:push     # creates all the tables on Neon
npm run db:seed     # loads demo plans, a demo customer, and the admin account
```

`db:seed` prints two login lines when it finishes — a demo customer
login and the MediaCloud platform admin login. Use those to sign in on
your live site.

> Re-run `npm run db:push` any time you pull schema changes into this
> project later — it's safe to run repeatedly.

---

## Step 5 — Point Razorpay's webhook at your live site

Payments will work without this (checkout + verify still activate the
subscription), but the webhook is what confirms things reliably in the
background (PART 29) and is required for automated refunds to update
your database.

1. [Razorpay Dashboard → Settings → Webhooks](https://dashboard.razorpay.com/app/webhooks) → **Add New Webhook**.
2. Webhook URL: `https://your-vercel-url.vercel.app/api/v1/webhooks/razorpay`
3. Subscribe to at least: `payment.captured`, `payment.failed`,
   `refund.processed`.
4. Razorpay shows you a **Webhook Secret** — copy it into Vercel's
   `RAZORPAY_WEBHOOK_SECRET` env var, then redeploy.

---

## Step 6 — Visit your site

Open your Vercel URL. You should see the real marketing homepage. Try:

- `/pricing` — live plan data from your Neon database
- `/login` — sign in with the seeded demo customer account (see Step 4's
  seed output) → lands in the customer portal
- `/login` with the seeded admin account → sign in, then visit `/admin`
  directly → the admin portal
- `/portal/subscription/checkout` (while signed in as the demo customer)
  to test a real Razorpay test-mode payment — use
  [Razorpay's test card numbers](https://razorpay.com/docs/payments/payments/test-card-upi-details/)

---

## Troubleshooting

- **"Invalid environment variables" error on the site** — you're
  missing a required env var in Vercel. Check `src/lib/env.ts` for
  what's required vs. optional, add what's missing, redeploy.
- **Login works but every page redirects to `/login`** — usually
  `NEXTAUTH_URL` doesn't exactly match your real deployed URL (including
  `https://`, no trailing slash). Fix it and redeploy.
- **Pricing page is empty / "no plans"** — `db:seed` (Step 4) hasn't run
  successfully against this database yet.
- **Changed an env var and nothing changed** — env var edits need a
  redeploy to take effect: **Deployments → ⋯ → Redeploy**.
- **Want to see server errors** — Vercel → your project →
  **Deployments** → click the latest one → **Functions** tab shows
  real-time logs, including the "email logged to console" fallback
  messages when SMTP isn't configured.

---

## Going further (optional, later)

- **Custom domain:** Vercel → Project → Settings → Domains → add your
  own domain and follow their DNS instructions; then update
  `NEXTAUTH_URL`/`NEXT_PUBLIC_APP_URL` to match and redeploy.
- **Real (non-test) Razorpay keys:** swap `RAZORPAY_KEY_ID` /
  `RAZORPAY_KEY_SECRET` for live-mode keys once you're ready to accept
  real payments, and set up a second live-mode webhook.
- **Real SMTP:** add `EMAIL_SERVER_HOST` / `PORT` / `USER` / `PASSWORD` /
  `EMAIL_FROM` (any provider — Resend, Postmark, SES, Mailgun all work)
  so verification/reset emails actually send instead of just logging.
