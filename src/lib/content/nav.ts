// Public site navigation (PART 4). Centralized so the Header and Footer
// never drift out of sync with each other.

export type NavLink = {
  label: string;
  href: string;
};

export const primaryNav: NavLink[] = [
  { label: "Product", href: "/product" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Features", href: "/features" },
  { label: "Solutions", href: "/solutions" },
  { label: "Pricing", href: "/pricing" },
  { label: "Downloads", href: "/downloads" },
  { label: "Resources", href: "/resources" },
];

export const footerColumns: { title: string; links: NavLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Product Overview", href: "/product" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "Creative Agencies", href: "/solutions#creative-agencies" },
      { label: "Brand Teams", href: "/solutions#brand-teams" },
      { label: "Retail Marketing", href: "/solutions#retail-marketing" },
      { label: "Multi-location Businesses", href: "/solutions#multi-location" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "Downloads", href: "/downloads" },
      { label: "Support", href: "/support" },
      { label: "Resources", href: "/resources" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Log In", href: "/login" },
      { label: "Get Started", href: "/register" },
    ],
  },
];
