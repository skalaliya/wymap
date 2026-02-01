import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "success" | "warning" | "danger";
};

const variants = {
  default: "border-[var(--surface-border)] text-[var(--text-muted)]",
  success: "border-emerald-500/40 text-emerald-200",
  warning: "border-amber-500/40 text-amber-200",
  danger: "border-red-500/40 text-red-200",
};

export const Badge = ({
  className,
  variant = "default",
  ...props
}: BadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-1 text-xs uppercase tracking-[0.2em]",
      variants[variant],
      className,
    )}
    {...props}
  />
);
