import type { HTMLAttributes, TableHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Table = ({
  className,
  ...props
}: TableHTMLAttributes<HTMLTableElement>) => (
  <table className={cn("w-full text-sm", className)} {...props} />
);

export const TableHead = ({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) => (
  <thead
    className={cn(
      "sticky top-0 z-10 bg-[rgba(8,6,18,0.9)] text-left text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]",
      className,
    )}
    {...props}
  />
);

export const TableRow = ({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn("border-b border-[var(--surface-border)]", className)} {...props} />
);

export const TableCell = ({ className, ...props }: HTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn("px-3 py-3", className)} {...props} />
);

export const TableHeaderCell = ({ className, ...props }: HTMLAttributes<HTMLTableCellElement>) => (
  <th className={cn("px-3 py-3 font-semibold", className)} {...props} />
);
