import { Sparkles } from "lucide-react";

export function EmptyState({ title, description, action, compact = false }: { title: string; description: string; action?: React.ReactNode; compact?: boolean }) {
  return <div className={`grid place-items-center px-4 text-center sm:px-5 ${compact ? "min-h-40 py-6 sm:min-h-48 sm:py-8" : "min-h-56 py-8 sm:min-h-72 sm:py-12"}`}><div><div className="mx-auto grid size-11 place-items-center rounded-2xl bg-[var(--orange-soft)] text-[var(--orange)] shadow-lg shadow-orange-300/15 sm:size-[3.25rem] sm:rounded-3xl"><Sparkles className="size-5" /></div><h3 className="mt-3 font-semibold tracking-[-.02em] sm:mt-4">{title}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[var(--muted)]">{description}</p>{action && <div className="mt-4 [&>button]:w-full sm:mt-5 sm:[&>button]:w-auto">{action}</div>}</div></div>;
}
