import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { getAuditLogs } from "@/server/admin/queries";

export const metadata: Metadata = { title: "Audit Logs" };
export const dynamic = "force-dynamic";

export default async function AdminAuditLogsPage() {
  const logs = await getAuditLogs();

  return (
    <>
      <PageHeader
        title="Audit Logs"
        description={`${logs.length} most recent actions. Every admin mutation writes who, what, when, and before/after values here (PART 55).`}
      />
      <div className="overflow-x-auto rounded-xl2 border border-ink-100 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-100 bg-ink-50/60 text-left text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-5 py-3 font-medium">When</th>
              <th className="px-5 py-3 font-medium">Actor</th>
              <th className="px-5 py-3 font-medium">Action</th>
              <th className="px-5 py-3 font-medium">Entity</th>
              <th className="px-5 py-3 font-medium">Customer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-ink-50/60">
                <td className="px-5 py-3 text-ink-500">{new Date(log.createdAt).toLocaleString("en-IN")}</td>
                <td className="px-5 py-3 text-ink-600">{log.user?.email ?? "System"}</td>
                <td className="px-5 py-3 font-mono text-xs font-medium text-ink-900">{log.action}</td>
                <td className="px-5 py-3 text-ink-500">
                  {log.entity}
                  {log.entityId ? ` · ${log.entityId.slice(-6)}` : ""}
                </td>
                <td className="px-5 py-3 text-ink-500">
                  {log.company ? (
                    <Link href={`/admin/customers/${log.company.id}`} className="text-brand-700 hover:underline">
                      {log.company.companyName}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-ink-400">
                  No audit activity yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
