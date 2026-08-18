import {
  Wand2,
  Maximize2,
  LayoutTemplate,
  ImageIcon,
  TextCursorInput,
  Globe2,
  Database,
  ShieldCheck,
  Layers,
  FileOutput,
  Grid3x3,
  KeyRound,
  type LucideIcon,
} from "lucide-react";
import type { FeatureItem } from "@/lib/content/marketing";

const iconMap: Record<string, LucideIcon> = {
  automation: Wand2,
  resize: Maximize2,
  template: LayoutTemplate,
  image: ImageIcon,
  text: TextCursorInput,
  globe: Globe2,
  data: Database,
  shield: ShieldCheck,
  layers: Layers,
  file: FileOutput,
  grid: Grid3x3,
  key: KeyRound,
};

export function FeatureCard({ title, description, icon }: FeatureItem) {
  const Icon = iconMap[icon] ?? Wand2;

  return (
    <div className="flex flex-col gap-4 rounded-xl2 border border-ink-100 bg-white p-6 shadow-card transition-shadow hover:shadow-premium">
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-base font-semibold text-ink-900">{title}</h3>
        <p className="text-sm leading-relaxed text-ink-600">{description}</p>
      </div>
    </div>
  );
}
