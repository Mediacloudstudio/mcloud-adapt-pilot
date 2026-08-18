import {
  LayoutDashboard,
  CreditCard,
  KeyRound,
  Monitor,
  Download,
  LayoutTemplate,
  BarChart3,
  Receipt,
  LifeBuoy,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type PortalNavItem = { label: string; href: string; icon: LucideIcon };

export const portalNav: PortalNavItem[] = [
  { label: "Dashboard", href: "/portal", icon: LayoutDashboard },
  { label: "Subscription", href: "/portal/subscription", icon: CreditCard },
  { label: "License", href: "/portal/license", icon: KeyRound },
  { label: "Devices", href: "/portal/devices", icon: Monitor },
  { label: "Downloads", href: "/portal/downloads", icon: Download },
  { label: "Templates", href: "/portal/templates", icon: LayoutTemplate },
  { label: "Usage", href: "/portal/usage", icon: BarChart3 },
  { label: "Billing", href: "/portal/billing", icon: Receipt },
  { label: "Support", href: "/portal/support", icon: LifeBuoy },
  { label: "Team", href: "/portal/team", icon: Users },
  { label: "Account Settings", href: "/portal/settings", icon: Settings },
];
