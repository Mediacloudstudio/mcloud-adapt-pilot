import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { ActionButton } from "@/components/admin/action-button";
import { getDevices } from "@/server/admin/queries";
import { adminResetDevice } from "@/server/admin/actions";

export const metadata: Metadata = { title: "Devices" };
export const dynamic = "force-dynamic";

export default async function AdminDevicesPage() {
  const devices = await getDevices();

  return (
    <>
      <PageHeader title="Devices" description={`${devices.length} devices across all customers.`} />
      <div className="overflow-x-auto rounded-xl2 border border-ink-100 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-100 bg-ink-50/60 text-left text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-5 py-3 font-medium">Device</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">OS</th>
              <th className="px-5 py-3 font-medium">Last Seen</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {devices.map((device) => (
              <tr key={device.id} className="hover:bg-ink-50/60">
                <td className="px-5 py-3 font-medium text-ink-900">{device.deviceName ?? device.deviceId}</td>
                <td className="px-5 py-3">
                  <Link href={`/admin/customers/${device.companyId}`} className="text-brand-700 hover:underline">
                    {device.company.companyName}
                  </Link>
                </td>
                <td className="px-5 py-3 text-ink-600">{device.os ?? "—"}</td>
                <td className="px-5 py-3 text-ink-600">{device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleDateString("en-IN") : "Never"}</td>
                <td className="px-5 py-3"><StatusChip status={device.status} /></td>
                <td className="px-5 py-3 text-right">
                  {device.status === "ACTIVE" && (
                    <ActionButton action={adminResetDevice.bind(null, device.id)} label="Reset" variant="ghost" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
