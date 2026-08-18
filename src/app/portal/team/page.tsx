import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { InviteMemberForm } from "@/components/portal/invite-member-form";
import { getPortalContext } from "@/server/portal/context";
import { getTeamMembers, getRoles } from "@/server/portal/queries";

export const metadata: Metadata = { title: "Team" };
export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const { companyId, role } = await getPortalContext();
  const [members, roles] = await Promise.all([getTeamMembers(companyId), getRoles()]);
  const isAdmin = role === "COMPANY_ADMIN";

  return (
    <>
      <PageHeader title="Team" description="Everyone with access to your company account." />

      <div className={`grid grid-cols-1 gap-6 ${isAdmin ? "lg:grid-cols-[1fr_1.3fr]" : ""}`}>
        {isAdmin && <InviteMemberForm roles={roles} />}

        <div className="overflow-x-auto rounded-xl2 border border-ink-100 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-100 bg-ink-50/60 text-left text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="px-5 py-3 font-medium text-ink-900">
                    {member.user.firstName} {member.user.lastName}
                  </td>
                  <td className="px-5 py-3 text-ink-600">{member.user.email}</td>
                  <td className="px-5 py-3 text-ink-600">{member.role.name}</td>
                  <td className="px-5 py-3">
                    <StatusChip status={member.user.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
