import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type ModalProps = {
  open: boolean;
  title?: string;
  description?: string;
  children?: ReactNode;
  onClose: () => void;
  actions?: ReactNode;
};

export const Modal = ({
  open,
  title,
  description,
  children,
  onClose,
  actions,
}: ModalProps) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            {title ? <h3 className="text-lg font-semibold">{title}</h3> : null}
            {description ? (
              <p className="text-sm text-[var(--text-muted)]">{description}</p>
            ) : null}
          </div>
          <button
            className={cn(
              "rounded-full border border-[var(--surface-border)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]",
            )}
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        {children ? <div className="mt-4">{children}</div> : null}
        {actions ? <div className="mt-6 flex gap-3">{actions}</div> : null}
      </div>
    </div>
  );
};
