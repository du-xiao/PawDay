export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div>{eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[.18em] text-[var(--orange)]">{eyebrow}</p>}<h1 className="text-3xl font-semibold tracking-[-.045em] sm:text-4xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">{description}</p></div>{action}</div>;
}
