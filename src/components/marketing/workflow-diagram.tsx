import { Database, Wand2, LayoutTemplate, ArrowRight, FileImage } from "lucide-react";
import { outputExamples } from "@/lib/content/marketing";

// PART 5 asks for "a professional visual demonstrating: Input data →
// MCloud Adapt Pilot → Adobe InDesign → Multiple creative outputs". Built
// as an original diagram (no borrowed brand assets) rather than a product
// screenshot, since Phase 2 has no real UI to screenshot yet.
export function WorkflowDiagram() {
  return (
    <div className="w-full rounded-2xl border border-ink-100 bg-gradient-to-b from-brand-50/60 to-white p-6 shadow-premium sm:p-10">
      <div className="flex flex-col items-center gap-4 lg:flex-row lg:justify-between lg:gap-3">
        <DiagramNode icon={Database} label="Input Data" sublabel="Dimensions · Languages · Text · Images" />
        <Arrow />
        <DiagramNode icon={Wand2} label="MCloud Adapt Pilot" sublabel="Automation Engine" emphasized />
        <Arrow />
        <DiagramNode icon={LayoutTemplate} label="Adobe InDesign" sublabel="Template Rendering" />
        <Arrow />
        <DiagramNode icon={FileImage} label="Creative Outputs" sublabel={`${outputExamples.length} formats and counting`} />
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-2 border-t border-ink-100 pt-6">
        {outputExamples.map((item) => (
          <span
            key={item}
            className="rounded-full border border-ink-100 bg-white px-3.5 py-1.5 text-xs font-medium text-ink-600"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function DiagramNode({
  icon: Icon,
  label,
  sublabel,
  emphasized,
}: {
  icon: typeof Database;
  label: string;
  sublabel: string;
  emphasized?: boolean;
}) {
  return (
    <div
      className={`flex w-full flex-col items-center gap-2 rounded-xl2 border px-5 py-5 text-center lg:w-40 ${
        emphasized ? "border-brand-600 bg-brand-600 text-white shadow-card" : "border-ink-100 bg-white"
      }`}
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
          emphasized ? "bg-white/15" : "bg-brand-50 text-brand-700"
        }`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <span className={`text-sm font-semibold ${emphasized ? "text-white" : "text-ink-900"}`}>{label}</span>
      <span className={`text-xs ${emphasized ? "text-white/80" : "text-ink-500"}`}>{sublabel}</span>
    </div>
  );
}

function Arrow() {
  return (
    <ArrowRight
      className="hidden h-5 w-5 shrink-0 rotate-90 text-ink-300 lg:block lg:rotate-0"
      strokeWidth={2}
    />
  );
}
