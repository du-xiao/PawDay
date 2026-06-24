import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type PaginationProps = {
  pathname: string;
  page: number;
  totalPages: number;
  params?: Record<string, string | undefined>;
  anchor?: string;
};

function pageHref(pathname: string, page: number, params: PaginationProps["params"], anchor?: string) {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return `${pathname}${query ? `?${query}` : ""}${anchor ? `#${anchor}` : ""}`;
}

function visiblePages(page: number, totalPages: number) {
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, Math.max(5, page + 2));
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function Pagination({ pathname, page, totalPages, params, anchor }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = visiblePages(page, totalPages);

  return <nav aria-label="分页" className="flex flex-col items-center justify-between gap-3 border-t bg-black/[.012] px-4 py-4 sm:flex-row sm:px-6 dark:bg-white/[.018]">
    <p className="text-xs text-[var(--muted)]">第 {page} / {totalPages} 页</p>
    <div className="flex items-center gap-1 rounded-2xl bg-black/[.025] p-1 dark:bg-white/[.035]">
      <PageLink href={pageHref(pathname, page - 1, params, anchor)} disabled={page === 1} label="上一页"><ChevronLeft className="size-4" /></PageLink>
      {pages.map((item) => <Link
        key={item}
        href={pageHref(pathname, item, params, anchor)}
        aria-current={item === page ? "page" : undefined}
        className={cn(
          "grid size-9 place-items-center rounded-xl text-xs font-semibold transition",
          item === page ? "bg-[var(--orange)] text-white shadow-sm shadow-orange-300/25" : "text-[var(--muted)] hover:bg-[var(--orange-soft)] hover:text-[var(--orange)]",
        )}
      >{item}</Link>)}
      <PageLink href={pageHref(pathname, page + 1, params, anchor)} disabled={page === totalPages} label="下一页"><ChevronRight className="size-4" /></PageLink>
    </div>
  </nav>;
}

function PageLink({ href, disabled, label, children }: { href: string; disabled: boolean; label: string; children: React.ReactNode }) {
  if (disabled) return <span aria-disabled="true" className="grid size-9 place-items-center rounded-xl text-[var(--muted)]/35">{children}</span>;
  return <Link href={href} aria-label={label} className="grid size-9 place-items-center rounded-xl text-[var(--muted)] transition hover:bg-[var(--orange-soft)] hover:text-[var(--orange)]">{children}</Link>;
}
