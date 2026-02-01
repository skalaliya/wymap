import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  shimmer?: boolean;
};

export const Skeleton = ({ className, shimmer = true, ...props }: SkeletonProps) => (
  <div
    className={cn(
      "rounded-lg bg-white/5",
      shimmer ? "animate-pulse" : "",
      className,
    )}
    {...props}
  />
);
