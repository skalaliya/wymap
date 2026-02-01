import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CardProps = HTMLAttributes<HTMLDivElement>;

export const Card = ({ className, ...props }: CardProps) => (
  <div className={cn("surface", className)} {...props} />
);

export const CardHeader = ({ className, ...props }: CardProps) => (
  <div className={cn("space-y-2", className)} {...props} />
);

export const CardTitle = ({ className, ...props }: CardProps) => (
  <h2 className={cn("text-xl font-semibold", className)} {...props} />
);

export const CardDescription = ({ className, ...props }: CardProps) => (
  <p className={cn("text-sm text-[var(--text-muted)]", className)} {...props} />
);
