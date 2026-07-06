import Link from "next/link";
import { cn } from "@/lib/utils";

export function TypeTabs({
  pathname,
  anchor,
  name,
  value,
  options,
  allLabel,
  ariaLabel,
  hidden,
}: {
  pathname: string;
  anchor: string;
  name: string;
  value: string;
  options: readonly string[];
  allLabel: string;
  ariaLabel: string;
  hidden?: Record<string, string | number | undefined>;
}) {
  const items = [{ value: "", label: allLabel }, ...options.map((option) => ({ value: option, label: option }))];

  return (
    <nav aria-label={ariaLabel} className="-mx-1 max-w-full overflow-x-auto px-1 [scrollbar-width:none] sm:mx-0 sm:w-auto sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
      <div className="inline-flex min-w-max gap-1.5 rounded-2xl bg-black/[.03] p-1 dark:bg-white/[.045] sm:min-w-0 sm:flex-wrap">
        {items.map((item) => {
          const active = value === item.value;
          return (
            <Link
              key={item.value || "__all"}
              href={typeHref(pathname, anchor, name, item.value, hidden)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-xl px-3 py-2 text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--foreground)]",
                active && "bg-[var(--card)] text-[var(--foreground)] shadow-sm",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function typeHref(pathname: string, anchor: string, name: string, value: string, hidden?: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  if (hidden) {
    Object.entries(hidden).forEach(([key, item]) => {
      if (item !== undefined && item !== "") search.set(key, String(item));
    });
  }
  if (value) search.set(name, value);
  const query = search.toString();
  return `${pathname}${query ? `?${query}` : ""}#${anchor}`;
}
