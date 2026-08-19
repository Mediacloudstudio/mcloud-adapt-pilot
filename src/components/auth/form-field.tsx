import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

type FormFieldProps = { label: string; error?: string } & InputHTMLAttributes<HTMLInputElement>;

// Wrapped in forwardRef so react-hook-form's register() can attach its ref
// straight to the underlying <input>. Without this, <FormField {...register("x")} />
// spreads `ref` onto FormField itself -- a plain function component can't
// receive a ref, so React silently drops it, react-hook-form's field never
// finishes registering, and every field reads back as undefined at submit
// time (surfacing as Zod's generic "Required" message on every field).
export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(function FormField(
  { label, error, ...rest },
  ref
) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink-700">{label}</span>
      <input
        ref={ref}
        {...rest}
        className={`rounded-lg border px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-colors placeholder:text-ink-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 ${
          error ? "border-red-400" : "border-ink-200"
        }`}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
});
