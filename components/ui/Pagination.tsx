import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (next: number) => void;
  onPageSizeChange?: (next: number) => void;
  pageSizeOptions?: number[];
  label?: ReactNode;
};

export const Pagination = ({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  label,
}: PaginationProps) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
        {label ?? `Page ${page} of ${totalPages}`}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {onPageSizeChange ? (
          <select
            className="rounded-lg border border-[var(--surface-border)] bg-transparent px-2 py-2 text-xs text-[var(--text-muted)]"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option} / page
              </option>
            ))}
          </select>
        ) : null}
        <Button
          variant="secondary"
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
        >
          Prev
        </Button>
        <Button
          variant="secondary"
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
