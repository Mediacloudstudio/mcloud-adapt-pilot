export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  maxWidth = "max-w-2xl",
  titleClassName,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  // Optional per-instance overrides -- every existing call site keeps its
  // current width/size (the defaults below match the old hardcoded
  // values) unless it explicitly opts into something wider/smaller, e.g.
  // a long hero title that needs more room to wrap onto fewer lines.
  maxWidth?: string;
  titleClassName?: string;
}) {
  const alignment = align === "center" ? "text-center items-center mx-auto" : "text-left items-start";

  return (
    <div className={`flex ${maxWidth} flex-col gap-4 ${alignment}`}>
      {eyebrow && (
        <span className="text-sm font-semibold uppercase tracking-widest text-brand-600">
          {eyebrow}
        </span>
      )}
      <h2 className={`font-bold tracking-tight text-ink-900 ${titleClassName ?? "text-3xl sm:text-4xl"}`}>
        {title}
      </h2>
      {description && <p className="text-lg text-ink-600">{description}</p>}
    </div>
  );
}
