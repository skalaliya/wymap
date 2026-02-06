import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Toolbar = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col gap-4 border-b border-[var(--surface-border)] pb-4 lg:flex-row lg:items-end lg:justify-between",
      className,
    )}
    {...props}
  />
);
