import { endOfYear, startOfMonth, startOfYear, subMonths } from "date-fns";
import { Landmark, ReceiptText, WalletCards } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { deleteExpenseAction } from "@/actions/app";
import { isGuestRole } from "@/lib/roles";
import { formatDate, money, toDateInput } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { ExpenseForm } from "@/components/forms/expense-form";
import { DeleteButton, RecordActions } from "@/components/forms/shared";
import { ExpenseCharts } from "@/components/charts/expense-charts";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { TypeFilterForm } from "@/components/type-filter-form";
import { TypeIcon } from "@/components/type-icon";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "养狗开销" };

const PAGE_SIZE = 10;
const expenseCategories = ["狗粮", "零食", "医疗", "洗护", "玩具", "用品", "保险", "寄养", "其他"] as const;

function parsePage(value?: string) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ scope?: string; year?: string; month?: string; category?: string; page?: string }> }) {
  const session = await auth();
  const canWrite = !isGuestRole(session?.user.role);
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
    <PageHeader eyebrow="EXPENSES" title="养狗开销" description="看见钱都花去了哪里，也更从容地照顾好每一个需要。" action={canWrite ? <ExpenseForm disabled={!dog} /> : undefined} />
    <section className="mb-5 grid grid-cols-2 gap-3 sm:mb-6 sm:grid-cols-3 sm:gap-4"><Metric icon={WalletCards} label="本月总开销" value={money(monthTotal)} tone="orange" /><Metric icon={Landmark} label="本年度总开销" value={money(yearTotal)} tone="sage" /><Metric icon={ReceiptText} label="累计记录" value={`${summaryExpenses.length} 笔`} tone="violet" /></section>
    <ExpenseCharts key={`${scope}-${selectedYear}-${selectedMonth}`} categories={categories} months={months} scope={scope} selectedYear={selectedYear} selectedMonth={selectedMonth} years={years} />

    <section id="expense-records" className="mt-5 scroll-mt-24 soft-card rounded-2xl sm:mt-6 sm:rounded-3xl">
      <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div><h2 className="font-semibold">开销明细</h2><p className="mt-1 text-xs text-[var(--muted)]">最近记录优先 · 每页 10 条</p></div>
        <TypeFilterForm action="/expenses#expense-records" name="category" value={selectedCategory} options={expenseCategories} allLabel="全部分类" ariaLabel="开销分类" hidden={{ scope, year: selectedYear, month: selectedMonth }} />
      </div>

      {!dog ? <EmptyState title="先创建小狗档案" description="有了档案后，才能开始记录养宠开销。" /> : expenses.length ? <>
        <div className="space-y-3 p-3 sm:space-y-0 sm:divide-y sm:p-0">{expenses.map((expense) => <div key={expense.id} className="relative flex gap-3 rounded-2xl border bg-[var(--card)]/72 p-3.5 shadow-sm shadow-stone-900/[.025] sm:items-center sm:gap-4 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-5 sm:shadow-none">
          <TypeIcon kind="expense" type={expense.category} className="size-10 rounded-2xl sm:size-11" />
          <div className={`min-w-0 flex-1 ${canWrite ? "pr-16 sm:pr-0" : ""}`}>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h3 className="min-w-0 max-w-full break-words text-base font-semibold leading-snug sm:max-w-[28rem] sm:truncate sm:text-sm sm:font-medium">{expenseTitle(expense)}</h3>
              <Badge>{expense.category}</Badge>
              {expense.merchant && <Badge className="bg-[var(--sage-soft)] text-[#5f775f] dark:text-[#bdd8bb]">{expense.merchant}</Badge>}
            </div>
            <p className="mt-1 truncate text-xs text-[var(--muted)]">{expenseMeta(expense)}</p>
            <p className="mt-2 text-lg font-semibold tabular-nums sm:hidden">{money(expense.amountCents)}</p>
          </div>
          <p className="hidden text-lg font-semibold tabular-nums sm:block">{money(expense.amountCents)}</p>
          {canWrite && <RecordActions className="absolute right-3 top-3 sm:static"><ExpenseForm initial={{ id: expense.id, category: expense.category as never, itemName: expense.itemName || "", amount: expense.amountCents / 100, date: toDateInput(expense.date), merchant: expense.merchant || "", notes: expense.notes || "" }} /><DeleteButton action={deleteExpenseAction.bind(null, expense.id)} /></RecordActions>}
        </div>)}</div>
        <Pagination pathname="/expenses" page={page} totalPages={totalPages} params={listParams} anchor="expense-records" />
      </> : <EmptyState title={selectedCategory ? `没有${selectedCategory}开销` : "还没有开销记录"} description={selectedCategory ? "换一个分类或选择全部分类后再看看。" : "从下一袋狗粮或下一次洗护开始，慢慢了解每月花费。"} action={canWrite && !selectedCategory ? <ExpenseForm disabled={!dog} /> : undefined} />}
    </section>
  </div>;
}

function Metric({ icon: Icon, label, value, tone }: { icon: typeof WalletCards; label: string; value: string; tone: string }) {
  const colors: Record<string, string> = { orange: "bg-[var(--orange-soft)] text-[var(--orange)]", sage: "bg-[var(--sage-soft)] text-[var(--sage)]", violet: "bg-violet-500/10 text-violet-600" };
  return <div className="soft-card min-w-0 rounded-2xl p-4 sm:rounded-3xl sm:p-5"><div className={`grid size-9 place-items-center rounded-xl sm:size-10 sm:rounded-2xl ${colors[tone]}`}><Icon className="size-4 sm:size-5" /></div><p className="mt-4 text-xs text-[var(--muted)] sm:mt-5">{label}</p><p className="mt-1 truncate text-lg font-semibold tracking-tight sm:text-2xl">{value}</p></div>;
}

function expenseTitle(expense: { itemName: string | null; notes: string | null; category: string }) {
  return expense.itemName || expense.notes || expense.category;
}

function expenseMeta(expense: { date: Date; itemName: string | null; notes: string | null }) {
  return [
    formatDate(expense.date),
    expense.notes && expense.notes !== expense.itemName ? expense.notes : "",
  ].filter(Boolean).join(" · ");
}
