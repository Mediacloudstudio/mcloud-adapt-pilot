// Single choke point for writing AuditLog rows (PART 55). Every admin
// mutation in src/server/admin/actions.ts calls this so "who changed
// what, when, from what value, to what value" can never be forgotten
// ad hoc inside an individual action.

import { db } from "@/lib/db";

export async function recordAuditLog(input: {
  // Optional: some events (webhook-triggered subscription activation,
  // renewal charges) have no human actor — those rows simply have a
  // null userId ("System") rather than being skipped, so the audit
  // trail still shows exactly when/why something changed.
  userId?: string | null;
  companyId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
}) {
  await db.auditLog.create({
    data: {
      userId: input.userId ?? null,
      companyId: input.companyId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      oldValue: input.oldValue === undefined ? undefined : (input.oldValue as object),
      newValue: input.newValue === undefined ? undefined : (input.newValue as object),
    },
  });
}
