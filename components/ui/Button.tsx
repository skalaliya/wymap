import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
};

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--violet-1)]/80 text-white hover:bg-[var(--violet-1)]/100",
  secondary:
    "border border-[var(--surface-border)] bg-[var(--surface)] hover:bg-white/5",
  ghost: "hover:bg-white/5",
  danger: "bg-red-500/80 text-white hover:bg-red-500",
};

export const Button = ({
  className,
  variant = "primary",
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) => (
  <button
    className={cn(
      "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold uppercase tracking-[0.15em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--violet-1)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-60",
      variantClasses[variant],
      className,
    )}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : null}
    {children}
  </button>
);
