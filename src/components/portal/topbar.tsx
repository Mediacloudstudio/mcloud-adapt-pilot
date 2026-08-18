import { SignOutButton } from "@/components/auth/sign-out-button";

export function PortalTopbar({ companyName, userName }: { companyName: string; userName: string }) {
  return (
    <div className="hidden items-center justify-between border-b border-ink-100 bg-white px-8 py-4 lg:flex">
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-ink-900">{companyName}</span>
        <span className="text-xs text-ink-500">Signed in as {userName}</span>
      </div>
      <SignOutButton />
    </div>
  );
}
