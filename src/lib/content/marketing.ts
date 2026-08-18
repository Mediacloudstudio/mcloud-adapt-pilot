// Copy and structured content for the public marketing site.
// Kept separate from page components so the pages themselves stay focused
// on layout, and so this copy can later be moved to a CMS without
// touching any component code.

export const heroContent = {
  eyebrow: "MediaCloud Studio Pvt Ltd",
  headline: "Design Once. Deliver Everywhere.",
  subhead:
    "MCloud Adapt Pilot transforms Adobe InDesign templates into intelligent, automated production workflows — helping creative teams generate multiple sizes, versions, languages and personalized outputs faster while maintaining complete brand consistency.",
  primaryCta: { label: "Get Started", href: "/register" },
  secondaryCta: { label: "See How It Works", href: "/how-it-works" },
};

export const outputExamples = [
  "Poster",
  "Social Creative",
  "Banner",
  "Outdoor Creative",
  "Retail Signage",
  "Multiple Language Versions",
];

export type ProblemItem = {
  title: string;
  description: string;
};

export const problems: ProblemItem[] = [
  {
    title: "Manual Resizing",
    description: "Designers spend hours recreating the same design for different dimensions.",
  },
  {
    title: "Repeated Localization",
    description: "Language versions require repeated manual design work.",
  },
  {
    title: "Brand Inconsistency",
    description: "Manual adaptation creates layout and branding errors.",
  },
  {
    title: "Slow Turnaround",
    description: "Large campaigns need hundreds or thousands of outputs.",
  },
  {
    title: "High Production Cost",
    description: "Creative teams waste valuable time on repetitive production work.",
  },
];

export const solutionSteps = [
  "Create InDesign template",
  "Configure automation-ready frames",
  "Connect customer data",
  "Select required output dimensions",
  "Run MCloud Adapt Pilot",
  "Automatically generate finished files",
];

export type HowItWorksStep = {
  step: number;
  title: string;
  description: string;
};

export const howItWorksSteps: HowItWorksStep[] = [
  {
    step: 1,
    title: "Build Your Master Template",
    description: "Create the approved design in Adobe InDesign.",
  },
  {
    step: 2,
    title: "Prepare It for Automation",
    description: "Define adaptable image, text and layout frames.",
  },
  {
    step: 3,
    title: "Connect Your Data",
    description: "Provide dimensions, locations, customer information, text and image assets.",
  },
  {
    step: 4,
    title: "Run Adapt Pilot",
    description: "The desktop application communicates with InDesign.",
  },
  {
    step: 5,
    title: "Generate Multiple Outputs",
    description: "Produce localized and resized creative files automatically.",
  },
];

export type FeatureItem = {
  title: string;
  description: string;
  icon: string; // key into the Icon map in FeatureCard
};

export const features: FeatureItem[] = [
  {
    title: "Automated InDesign Production",
    description: "Automatically generate creative outputs through Adobe InDesign.",
    icon: "automation",
  },
  {
    title: "Multi-Size Adaptation",
    description: "Generate multiple dimensions and aspect ratios from a single template.",
    icon: "resize",
  },
  {
    title: "Template Automation",
    description: "Convert structured InDesign templates into reusable production templates.",
    icon: "template",
  },
  {
    title: "Image Replacement",
    description: "Automatically replace images and customer assets.",
    icon: "image",
  },
  {
    title: "Text Personalization",
    description: "Automatically populate customer text and campaign data.",
    icon: "text",
  },
  {
    title: "Localization",
    description: "Create multilingual creative variations.",
    icon: "globe",
  },
  {
    title: "Data-Driven Production",
    description: "Use structured data as input for automated production.",
    icon: "data",
  },
  {
    title: "Brand Consistency",
    description: "Protect approved layouts and brand rules.",
    icon: "shield",
  },
  {
    title: "Batch Processing",
    description: "Process multiple jobs automatically.",
    icon: "layers",
  },
  {
    title: "PDF Export",
    description: "Automatically generate production-ready PDF files.",
    icon: "file",
  },
  {
    title: "Template Management",
    description: "Control which templates each customer can access.",
    icon: "grid",
  },
  {
    title: "Centralized Licensing",
    description: "Control application usage through the MediaCloud server.",
    icon: "key",
  },
];

export type SolutionSegment = {
  id: string;
  title: string;
  description: string;
};

export const solutionSegments: SolutionSegment[] = [
  {
    id: "creative-agencies",
    title: "Creative Agencies",
    description:
      "Deliver more campaign variations for more clients without expanding your production headcount.",
  },
  {
    id: "brand-teams",
    title: "Brand Teams",
    description:
      "Keep every regional and channel adaptation locked to approved layouts and brand guidelines.",
  },
  {
    id: "retail-marketing",
    title: "Retail Marketing",
    description:
      "Generate in-store signage, shelf-talkers and promotional creative across every store format.",
  },
  {
    id: "trade-marketing",
    title: "Trade Marketing",
    description:
      "Produce dealer- and distributor-specific creative at the speed trade calendars demand.",
  },
  {
    id: "printing-production",
    title: "Printing & Production Companies",
    description:
      "Turn incoming client templates into repeatable, automated production pipelines.",
  },
  {
    id: "multi-location",
    title: "Multi-location Businesses",
    description:
      "Adapt one master design to every location's dimensions, language and local offer.",
  },
  {
    id: "campaign-localization",
    title: "Campaign Localization",
    description:
      "Launch a single campaign in every required market and language simultaneously.",
  },
  {
    id: "dealer-personalization",
    title: "Dealer / Retailer Personalization",
    description:
      "Personalize campaign creative per dealer or retailer without a manual production queue.",
  },
  {
    id: "corporate-marketing",
    title: "Corporate Marketing Teams",
    description:
      "Give internal stakeholders self-service access to on-brand, automatically produced creative.",
  },
];

export const sharedPlanFeatures = [
  "MCloud Adapt Pilot Desktop Application",
  "Adobe InDesign Automation",
  "Automated Creative Adaptation",
  "Template Access",
  "Software Updates",
  "Customer Portal",
  "Device Management",
  "Usage Dashboard",
  "Support",
];
