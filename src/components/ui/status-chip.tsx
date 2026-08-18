const styles: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-700 border-green-200",
  DONE: "bg-green-50 text-green-700 border-green-200",
  PAID: "bg-green-50 text-green-700 border-green-200",
  RESOLVED: "bg-green-50 text-green-700 border-green-200",
  CLOSED: "bg-ink-100 text-ink-500 border-ink-200",
  TRIAL: "bg-blue-50 text-blue-700 border-blue-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PENDING_PAYMENT: "bg-amber-50 text-amber-700 border-amber-200",
  PROCESSING: "bg-amber-50 text-amber-700 border-amber-200",
  OPEN: "bg-amber-50 text-amber-700 border-amber-200",
  IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-200",
  WAITING_FOR_CUSTOMER: "bg-amber-50 text-amber-700 border-amber-200",
  GRACE_PERIOD: "bg-amber-50 text-amber-700 border-amber-200",
  EXPIRING: "bg-amber-50 text-amber-700 border-amber-200",
  PAYMENT_ISSUE: "bg-red-50 text-red-700 border-red-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
  ERROR: "bg-red-50 text-red-700 border-red-200",
  SUSPENDED: "bg-red-50 text-red-700 border-red-200",
  EXPIRED: "bg-red-50 text-red-700 border-red-200",
  REVOKED: "bg-red-50 text-red-700 border-red-200",
  BLOCKED: "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-ink-100 text-ink-500 border-ink-200",
  DEACTIVATED: "bg-ink-100 text-ink-500 border-ink-200",
  REFUNDED: "bg-ink-100 text-ink-500 border-ink-200",
  PARTIALLY_REFUNDED: "bg-ink-100 text-ink-500 border-ink-200",
  DRAFT: "bg-ink-100 text-ink-500 border-ink-200",
  ISSUED: "bg-blue-50 text-blue-700 border-blue-200",
  VOID: "bg-ink-100 text-ink-500 border-ink-200",
};

export function StatusChip({ status }: { status: string }) {
  const style = styles[status] ?? "bg-ink-100 text-ink-600 border-ink-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
