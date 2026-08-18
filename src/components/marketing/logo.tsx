import Link from "next/link";

// A simple original monogram mark — deliberately not an imitation of any
// existing creative-software brand mark. A gradient rounded square with an
// "A" (Adapt) cut from negative space reads as a premium, technology-first
// wordmark at both header size and favicon size.
export function Logo({
  className = "",
  variant = "light",
}: {
  className?: string;
  variant?: "light" | "dark";
}) {
  const titleColor = variant === "light" ? "text-ink-900" : "text-white";
  const subtitleColor = variant === "light" ? "text-ink-400" : "text-ink-400";

  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`}>
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-800 text-white shadow-card">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path
            d="M4 18L11 6L14 12M20 18L14.5 7.5"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className={`text-[15px] font-bold tracking-tight ${titleColor}`}>MCloud Adapt Pilot</span>
        <span className={`text-[11px] font-medium tracking-wide ${subtitleColor}`}>MediaCloud Studio</span>
      </span>
    </Link>
  );
}
