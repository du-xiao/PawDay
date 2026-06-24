import * as React from "react";
import { cn } from "@/lib/utils";

export function Field({ label, error, hint, className, children }: { label: string; error?: string; hint?: string; className?: string; children: React.ReactNode }) {
  return <label className={cn("block space-y-2", className)}><span className="ml-1 text-sm font-medium">{label}</span>{children}{error ? <span className="ml-1 text-xs text-red-500">{error}</span> : hint ? <span className="ml-1 text-xs text-[var(--muted)]">{hint}</span> : null}</label>;
}

export const selectClass = "h-12 w-full appearance-none rounded-2xl border bg-white/70 px-4 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,.55)] outline-none transition focus:border-orange-300 focus:bg-white/85 focus:ring-4 focus:ring-orange-100/60 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/[.045] dark:shadow-none dark:focus:bg-white/[.065] dark:focus:ring-orange-900/30";
