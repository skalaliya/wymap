import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export const Select = ({ className, label, children, ...props }: SelectProps) => (
  <label className="flex w-full flex-col gap-2 text-sm text-[var(--text-muted)]">
    {label ? <span className="text-xs uppercase tracking-[0.3em]">{label}</span> : null}
    <select
      className={cn(
        "rounded-lg border border-[var(--surface-border)] bg-transparent px-3 py-2 text-base text-[var(--foreground)] focus:border-[var(--purple-1)] focus:outline-none",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  </label>
);
