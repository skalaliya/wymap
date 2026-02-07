import type { InputHTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, ...props }, ref) => (
    <label className="flex w-full flex-col gap-2 text-sm text-[var(--text-muted)]">
      {label ? (
        <span className="text-xs uppercase tracking-[0.3em]">{label}</span>
      ) : null}
      <input
        ref={ref}
        className={cn(
          "rounded-lg border border-[var(--surface-border)] bg-transparent px-3 py-2 text-base text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-[var(--purple-1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--violet-1)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]",
          className,
        )}
        {...props}
      />
    </label>
  ),
);

Input.displayName = "Input";
