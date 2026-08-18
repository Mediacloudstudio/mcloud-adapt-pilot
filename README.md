# MCloud Adapt Pilot — Web Platform

Commercial website + SaaS control portal for **MCloud Adapt Pilot**, built by
**MediaCloud Studio Pvt Ltd**. This repository is being built in phases —
see `docs/ARCHITECTURE.md` for the full plan. This README covers **Phase 1**
only: getting the project running locally.

This guide assumes you have never used Node.js, PostgreSQL, or Prisma
before. Follow every step in order.

---

## 1. Install prerequisites

You need three things on your computer:

1. **Node.js 18 or newer** — download from https://nodejs.org (choose the
   "LTS" version). To check it's installed, open a terminal and run:
   ```
   node -v
   ```
   You should see something like `v20.x.x` or higher.

2. **A PostgreSQL database.** You do **not** need to install Postgres on
   your own machine — the easiest path for a beginner is a free hosted
   database:
   - [Neon](https://neon.tech) (recommended — free tier, works great with
     Vercel later) or
   - [Supabase](https://supabase.com) (also free tier)

   Create a project on either site, then copy the **connection string**
   they give you (it looks like `postgresql://user:password@host/dbname`).

   *(If you'd rather run Postgres locally, install
   [Docker Desktop](https://www.docker.com/products/docker-desktop/) and
   run: `docker run --name mcap-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16`)*

3. **A code editor** — [VS Code](https://code.visualstudio.com) is
   recommended.

---

## 2. Install project dependencies

Open a terminal in this project folder and run:

```
npm install
```

**What this does:** downloads every package listed in `package.json`
(Next.js, React, Prisma, Tailwind, Auth.js, etc.) into a `node_modules`
folder. This takes 1–3 minutes the first time.

**What you should see:** a `node_modules` folder appears, and the terminal
ends with something like `added 350 packages`.

---

## 3. Configure environment variables

Copy the example file:

```
cp .env.example .env
```

Open the new `.env` file and fill in:

- `DATABASE_URL` — paste the connection string from Neon/Supabase/Docker.
- `NEXTAUTH_SECRET` — generate one by running:
  ```
  openssl rand -base64 32
  ```
  and pasting the output.

Leave the Razorpay, email, and storage variables as placeholders for now —
they're wired up in later phases (6, 3, and 8 respectively) and are not
required for Phase 1 to run.

**Never commit `.env`** — it's already in `.gitignore`.

---

## 4. Create the database tables

This project uses **Prisma** to manage the database schema
(`prisma/schema.prisma`). Run:

```
npm run db:push
```

**What this does:** reads `prisma/schema.prisma` and creates every table
(`users`, `companies`, `plans`, `subscriptions`, `licenses`, `devices`,
etc.) in the Postgres database you configured above.

**What you should see:** `Your database is now in sync with your Prisma
schema.`

> Later phases will switch from `db:push` to proper migrations
> (`npm run db:migrate`) once the schema stabilizes — `db:push` is faster
> to iterate with during early development.

---

## 5. Load demo data

```
npm run db:seed
```

**What this does:** inserts the three pricing plans (₹10,000 / ₹15,000 /
₹20,000), role definitions, template categories, and a full demo company
("ABC Creative Pvt Ltd") with an active subscription, a license, two
activated devices, a paid invoice, and a month of usage history — matching
PART 62 of the product spec.

**What you should see:** the terminal ends with:
```
✅ Seed complete.
   Demo login: demo.admin@abccreative.example / Demo@12345
```

(This demo login won't actually work until Phase 3 builds the login page —
right now it just proves the data model works end-to-end.)

---

## 6. Run the app

```
npm run dev
```

**What you should see:** `Local: http://localhost:3000`. Open that URL in
your browser — you'll see a plain placeholder page confirming the stack is
wired up correctly. The real homepage is built in Phase 2.

To inspect your database visually at any time, run:
```
npm run db:studio
```
This opens Prisma Studio in your browser — a spreadsheet-like view of every
table, useful for confirming the seed data landed correctly.

---

## Useful commands reference

| Command | What it does |
|---|---|
| `npm run dev` | Start the app locally with hot-reload |
| `npm run build` | Production build (used before deploying) |
| `npm run typecheck` | Check for TypeScript errors without building |
| `npm run lint` | Check for code-style issues |
| `npm run db:push` | Sync the database schema (dev-friendly, no migration history) |
| `npm run db:migrate` | Create a tracked, reversible migration (used once schema stabilizes) |
| `npm run db:seed` | Load demo data |
| `npm run db:studio` | Open a visual database browser |

---

## Project status

**PHASE 1 COMPLETE** — project scaffold, database schema, auth structure.
**PHASE 2 COMPLETE** — public marketing site, Login (functional) and
Register (validated UI) pages. See `docs/ARCHITECTURE.md` for details and
what's next.

Try the pricing page after seeding the database (`npm run db:seed`) — it
reads live from Postgres. Try logging in at `/login` with the seed demo
account: `demo.admin@abccreative.example` / `Demo@12345`.
