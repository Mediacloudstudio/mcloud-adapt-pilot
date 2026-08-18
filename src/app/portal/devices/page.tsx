import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { DeactivateDeviceButton } from "@/components/portal/deactivate-device-button";
import { getPortalContext } from "@/server/portal/context";
import { getDevices, getLicense } from "@/server/portal/queries";

export const metadata: Metadata = { title: "Devices" };
export const dynamic = "force-dynamic";

export default async function DevicesPage() {
  const { companyId } = await getPortalContext();
  const [devices, license] = await Promise.all([getDevices(companyId), getLicense(companyId)]);

  const deviceLimit = license?.deviceLimitOverride ?? license?.subscription?.plan.deviceLimit ?? 0;
  const activeCount = devices.filter((d) => d.status === "ACTIVE").length;

  return (
    <>
      <PageHeader
        title="Devices"
        description={`${activeCount} of ${deviceLimit} activated PCs in use. Deactivate a device from here to free up a slot for another computer.`}
      />

      {devices.length === 0 ? (
        <div className="rounded-xl2 border border-ink-100 bg-white p-8 text-center text-sm text-ink-500 shadow-card">
          No devices have activated MCloud Adapt Pilot yet. Install the desktop app and enter your license key to
          get started.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl2 border border-ink-100 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-100 bg-ink-50/60 text-left text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-5 py-3 font-medium">Device</th>
                <th className="px-5 py-3 font-medium">OS</th>
                <th className="px-5 py-3 font-medium">App Version</th>
                <th className="px-5 py-3 font-medium">Activated</th>
                <th className="px-5 py-3 font-medium">Last Seen</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {devices.map((device) => (
                <tr key={device.id}>
                  <td className="px-5 py-3 font-medium text-ink-900">{device.deviceName ?? device.deviceId}</td>
                  <td className="px-5 py-3 text-ink-600">{device.os ?? "—"}</td>
                  <td className="px-5 py-3 text-ink-600">{device.appVersion ?? "—"}</td>
                  <td className="px-5 py-3 text-ink-600">{formatDate(device.activatedAt)}</td>
                  <td className="px-5 py-3 text-ink-600">{device.lastSeenAt ? formatDate(device.lastSeenAt) : "Never"}</td>
                  <td className="px-5 py-3">
                    <StatusChip status={device.status} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    {device.status === "ACTIVE" && <DeactivateDeviceButton deviceId={device.id} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
