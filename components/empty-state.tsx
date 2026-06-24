import { Sparkles } from "lucide-react";

export function EmptyState({ title, description, action, compact = false }: { title: string; description: string; action?: React.ReactNode; compact?: boolean }) {
  return <div className={`grid place-items-center px-5 text-center ${compact ? "min-h-48 py-8" : "min-h-72 py-12"}`}><div><div className="mx-auto grid size-[3.25rem] place-items-center rounded-3xl bg-[var(--orange-soft)] text-[var(--orange)] shadow-lg shadow-orange-300/15"><Sparkles className="size-5" /></div><h3 className="mt-4 font-semibold tracking-[-.02em]">{title}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[var(--muted)]">{description}</p>{action && <div className="mt-5 [&>button]:w-full sm:[&>button]:w-auto">{action}</div>}</div></div>;
}
