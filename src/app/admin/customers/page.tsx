import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { getCustomers } from "@/server/admin/queries";

export const metadata: Metadata = { title: "Customers" };
export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const customers = await getCustomers();

  return (
    <>
      <PageHeader title="Customers" description={`${customers.length} companies.`} />

      <div className="overflow-x-auto rounded-xl2 border border-ink-100 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-100 bg-ink-50/60 text-left text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-5 py-3 font-medium">Company</th>
              <th className="px-5 py-3 font-medium">Plan</th>
              <th className="px-5 py-3 font-medium">Subscription</th>
              <th className="px-5 py-3 font-medium">License</th>
              <th className="px-5 py-3 font-medium">Devices</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {customers.map((company) => {
              const subscription = company.subscriptions[0];
              const license = company.licenses[0];
              const activeDevices = company.devices.filter((d) => d.status === "ACTIVE").length;
              return (
                <tr key={company.id} className="hover:bg-ink-50/60">
                  <td className="px-5 py-3">
                    <Link href={`/admin/customers/${company.id}`} className="font-medium text-brand-700 hover:underline">
                      {company.companyName}
                    </Link>
                    <p className="text-xs text-ink-500">{company.users[0]?.user.email}</p>
                  </td>
                  <td className="px-5 py-3 text-ink-600">{subscription?.plan.name ?? "—"}</td>
                  <td className="px-5 py-3">{subscription ? <StatusChip status={subscription.status} /> : "—"}</td>
                  <td className="px-5 py-3">{license ? <StatusChip status={license.status} /> : "—"}</td>
                  <td className="px-5 py-3 text-ink-600">{activeDevices}</td>
                  <td className="px-5 py-3">
                    <StatusChip status={company.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
