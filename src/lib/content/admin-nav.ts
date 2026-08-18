import {
  LayoutDashboard,
  Building2,
  Package,
  CreditCard,
  Receipt,
  KeyRound,
  Monitor,
  LayoutTemplate,
  AppWindow,
  BarChart3,
  FileText,
  RotateCcw,
  LifeBuoy,
  ScrollText,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = { label: string; href: string; icon: LucideIcon };

export const adminNav: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Customers", href: "/admin/customers", icon: Building2 },
  { label: "Plans", href: "/admin/plans", icon: Package },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { label: "Payments", href: "/admin/payments", icon: Receipt },
  { label: "Licenses", href: "/admin/licenses", icon: KeyRound },
  { label: "Devices", href: "/admin/devices", icon: Monitor },
  { label: "Templates", href: "/admin/templates", icon: LayoutTemplate },
  { label: "Application", href: "/admin/application/versions", icon: AppWindow },
  { label: "Usage", href: "/admin/usage", icon: BarChart3 },
  { label: "Invoices", href: "/admin/invoices", icon: FileText },
  { label: "Refunds", href: "/admin/refunds", icon: RotateCcw },
  { label: "Support", href: "/admin/support", icon: LifeBuoy },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];
