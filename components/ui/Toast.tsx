"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ToastVariant = "success" | "error" | "info";

export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
};

export const Toast = ({
  title,
  description,
  variant = "info",
}: ToastItem) => {
  const styles = {
    success: "border-emerald-500/40 text-emerald-200",
    error: "border-red-500/40 text-red-200",
    info: "border-[var(--surface-border)] text-[var(--foreground)]",
  };

  return (
    <div
      className={cn(
        "rounded-xl border bg-[var(--surface)] px-4 py-3 shadow-lg",
        styles[variant],
      )}
    >
      <p className="text-sm font-semibold">{title}</p>
      {description ? (
        <p className="text-xs text-[var(--text-muted)]">{description}</p>
      ) : null}
    </div>
  );
};

export const ToastContainer = ({ children }: { children: ReactNode }) => (
  <div className="fixed bottom-6 right-6 z-50 flex w-full max-w-sm flex-col gap-3">
    {children}
  </div>
);
