import Link from "next/link";
import { endOfYear, startOfMonth, startOfYear, subMonths } from "date-fns";
import { Filter, Landmark, ReceiptText, WalletCards } from "lucide-react";
import { prisma } from "@/lib/db";
import { deleteExpenseAction } from "@/actions/app";
import { cn, formatDate, money, toDateInput } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { ExpenseForm } from "@/components/forms/expense-form";
import { DeleteButton } from "@/components/forms/shared";
import { ExpenseCharts } from "@/components/charts/expense-charts";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { selectClass } from "@/components/ui/form-field";

export const metadata = { title: "养狗开销" };

const PAGE_SIZE = 10;
const expenseCategories = ["狗粮", "零食", "医疗", "洗护", "玩具", "用品", "保险", "寄养", "其他"] as const;

function parsePage(value?: string) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function expenseHref(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const query = search.toString();
  return `/expenses${query ? `?${query}` : ""}#expense-records`;
}

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ scope?: string; year?: string; month?: string; category?: string; page?: string }> }) {
  const params = await searchParams;
  const dog = await prisma.dog.findFirst();
  const now = new Date();
  const currentYear = now.getFullYear();
  const scope = params.scope === "year" ? "year" : "month";
  const requestedYear = Number(params.year);
  const selectedYear = Number.isInteger(requestedYear) && requestedYear >= 2000 && requestedYear <= 2100 ? requestedYear : currentYear;
  const requestedMonth = Number(params.month);
  const selectedMonth = Number.isInteger(requestedMonth) && requestedMonth >= 1 && requestedMonth <= 12 ? requestedMonth : now.getMonth() + 1;
  const selectedCategory = expenseCategories.includes(params.category as typeof expenseCategories[number]) ? params.category || "" : "";
  const requestedPage = parsePage(params.page);
  const detailWhere = dog ? { dogId: dog.id, ...(selectedCategory ? { category: selectedCategory } : {}) } : null;

  const [summaryExpenses, expenseCount] = dog ? await Promise.all([
    prisma.expense.findMany({ where: { dogId: dog.id }, orderBy: { date: "desc" }, select: { date: true, amountCents: true, category: true } }),
    prisma.expense.count({ where: detailWhere! }),
  ]) : [[], 0];
  const totalPages = Math.max(1, Math.ceil(expenseCount / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const expenses = dog ? await prisma.expense.findMany({
    where: detailWhere!,
    orderBy: { date: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  }) : [];

  const monthTotal = summaryExpenses.filter((item) => item.date >= startOfMonth(now)).reduce((sum, item) => sum + item.amountCents, 0);
  const yearTotal = summaryExpenses.filter((item) => item.date >= startOfYear(now) && item.date <= endOfYear(now)).reduce((sum, item) => sum + item.amountCents, 0);
  const periodExpenses = summaryExpenses.filter((item) => item.date.getFullYear() === selectedYear && (scope === "year" || item.date.getMonth() === selectedMonth - 1));
  const categoryMap = new Map<string, number>();
  periodExpenses.forEach((item) => categoryMap.set(item.category, (categoryMap.get(item.category) || 0) + item.amountCents));
  const categories = [...categoryMap].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const months = Array.from({ length: 12 }, (_, index) => {
    const date = subMonths(now, 11 - index);
    return {
      month: `${date.getMonth() + 1}月`,
      value: summaryExpenses.filter((item) => item.date.getFullYear() === date.getFullYear() && item.date.getMonth() === date.getMonth()).reduce((sum, item) => sum + item.amountCents, 0),
    };
  });
  const years = Array.from(new Set([currentYear, selectedYear, ...summaryExpenses.map((item) => item.date.getFullYear())])).sort((a, b) => b - a);
  const listParams = { scope, year: String(selectedYear), month: String(selectedMonth), category: selectedCategory };

  return <div className="page-enter">
    <PageHeader eyebrow="EXPENSES" title="养狗开销" description="看见钱都花去了哪里，也更从容地照顾好每一个需要。" action={<ExpenseForm disabled={!dog} />} />
    <section className="mb-6 grid gap-4 sm:grid-cols-3"><Metric icon={WalletCards} label="本月总开销" value={money(monthTotal)} tone="orange" /><Metric icon={Landmark} label="本年度总开销" value={money(yearTotal)} tone="sage" /><Metric icon={ReceiptText} label="累计记录" value={`${summaryExpenses.length} 笔`} tone="violet" /></section>
    <ExpenseCharts categories={categories} months={months} scope={scope} selectedYear={selectedYear} selectedMonth={selectedMonth} years={years} />

    <section id="expense-records" className="mt-6 scroll-mt-24 soft-card rounded-3xl">
      <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div><h2 className="font-semibold">开销明细</h2><p className="mt-1 text-xs text-[var(--muted)]">最近记录优先 · 每页 10 条</p></div>
        <form className="flex gap-2">
          <input type="hidden" name="scope" value={scope} />
          <input type="hidden" name="year" value={selectedYear} />
          <input type="hidden" name="month" value={selectedMonth} />
          <div className="relative min-w-0 flex-1 sm:w-44"><Filter className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-[var(--muted)]" /><select name="category" defaultValue={selectedCategory} aria-label="开销分类" className={cn(selectClass, "h-9 rounded-xl border-0 bg-black/[.025] pl-10 pr-8 focus:ring-0 dark:bg-white/[.04]")}><option value="">全部分类</option>{expenseCategories.map((category) => <option key={category}>{category}</option>)}</select></div>
          <Button type="submit" size="sm">查询</Button>
          {selectedCategory && <Button asChild size="sm" variant="ghost"><Link href={expenseHref({ scope, year: String(selectedYear), month: String(selectedMonth) })}>清除</Link></Button>}
        </form>
      </div>

      {!dog ? <EmptyState title="先创建小狗档案" description="有了档案后，才能开始记录养宠开销。" /> : expenses.length ? <>
        <div className="divide-y">{expenses.map((expense) => <div key={expense.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--orange-soft)] text-[var(--orange)]"><ReceiptText className="size-5" /></div>
          <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="font-medium">{expense.merchant || expense.category}</h3><Badge>{expense.category}</Badge></div><p className="mt-1 truncate text-xs text-[var(--muted)]">{formatDate(expense.date)}{expense.notes ? ` · ${expense.notes}` : ""}</p></div>
          <p className="text-lg font-semibold tabular-nums">{money(expense.amountCents)}</p>
          <div className="flex"><ExpenseForm initial={{ id: expense.id, category: expense.category as never, amount: expense.amountCents / 100, date: toDateInput(expense.date), merchant: expense.merchant || "", notes: expense.notes || "" }} /><DeleteButton action={deleteExpenseAction.bind(null, expense.id)} /></div>
        </div>)}</div>
        <Pagination pathname="/expenses" page={page} totalPages={totalPages} params={listParams} anchor="expense-records" />
      </> : <EmptyState title={selectedCategory ? `没有${selectedCategory}开销` : "还没有开销记录"} description={selectedCategory ? "换一个分类或清除筛选后再看看。" : "从下一袋狗粮或下一次洗护开始，慢慢了解每月花费。"} action={!selectedCategory ? <ExpenseForm disabled={!dog} /> : undefined} />}
    </section>
  </div>;
}

function Metric({ icon: Icon, label, value, tone }: { icon: typeof WalletCards; label: string; value: string; tone: string }) {
  const colors: Record<string, string> = { orange: "bg-[var(--orange-soft)] text-[var(--orange)]", sage: "bg-[var(--sage-soft)] text-[var(--sage)]", violet: "bg-violet-500/10 text-violet-600" };
  return <div className="soft-card rounded-3xl p-5"><div className={`grid size-10 place-items-center rounded-2xl ${colors[tone]}`}><Icon className="size-5" /></div><p className="mt-5 text-xs text-[var(--muted)]">{label}</p><p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p></div>;
}
