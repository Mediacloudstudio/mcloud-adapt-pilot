// Prisma client singleton.
// Next.js hot-reloads modules in development, which would otherwise create
// a new PrismaClient (and a new DB connection pool) on every file save.
// Stashing the instance on `globalThis` avoids that.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
