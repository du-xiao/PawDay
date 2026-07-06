import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, CalendarClock, FileText, HeartPulse, Scale, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { daysTogether, dogAge, formatDate } from "@/lib/utils";
import { imageVariantUrl } from "@/lib/image-variants";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { PrintButton } from "@/components/print-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "健康档案" };

export default async function DogReportPage() {
  const dog = await prisma.dog.findFirst({
    include: {
      documents: { orderBy: { updatedAt: "desc" } },
      health: { orderBy: { date: "desc" } },
      reminders: { where: { completed: false }, orderBy: { dueAt: "asc" }, take: 6 },
    },
  });

  if (!dog) {
    return (
      <div className="page-enter">
        <PageHeader eyebrow="HEALTH REPORT" title="健康档案" description="先创建小狗档案后，才能生成打印页。" action={<Button asChild variant="outline"><Link href="/dog"><ArrowLeft className="size-4" />返回档案</Link></Button>} />
        <div className="soft-card rounded-2xl sm:rounded-3xl">
          <EmptyState title="还没有小狗档案" description="补齐基础信息后，这里会生成适合打印或保存 PDF 的健康档案。" />
        </div>
      </div>
    );
  }

  const vaccines = dog.health.filter((item) => item.type === "疫苗").slice(0, 8);
  const deworming = dog.health.filter((item) => item.type === "驱虫").slice(0, 8);
  const recentHealth = dog.health.slice(0, 12);
  const latestWeight = dog.health.find((item) => item.weightGrams)?.weightGrams ?? dog.weightGrams;
  const latestReminder = dog.reminders[0];

  return (
    <div className="page-enter">
      <div className="no-print">
        <PageHeader
          eyebrow="HEALTH REPORT"
          title={`${dog.name} 的健康档案`}
          description="适合打印、交给医院查看，或通过浏览器另存为 PDF。"
          action={<div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link href="/dog"><ArrowLeft className="size-4" />返回档案</Link></Button><PrintButton /></div>}
        />
      </div>

      <article className="print-report mx-auto max-w-5xl rounded-2xl border bg-white p-4 text-[#24211d] shadow-xl shadow-stone-900/[.06] sm:rounded-[1.5rem] sm:p-8 print:shadow-none">
        <header className="flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:pb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-100 sm:size-24 sm:rounded-2xl">
              {dog.avatarUrl ? <Image src={imageVariantUrl(dog.avatarUrl, "thumb")} alt={dog.name} fill unoptimized className="object-cover" sizes="96px" /> : <div className="grid size-full place-items-center text-stone-400"><HeartPulse className="size-8 sm:size-9" /></div>}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-[#8d5a3c]">PawDay Health Report</p>
              <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{dog.name}</h1>
              <p className="mt-1 text-sm text-stone-500">{dog.breed || "品种未记录"} · {dog.sex || "性别未知"} · 生成于 {formatDate(new Date())}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm sm:w-72">
            <Fact label="年龄" value={dogAge(dog.birthDate)} />
            <Fact label="陪伴" value={daysTogether(dog.adoptionDate) ? `${daysTogether(dog.adoptionDate)} 天` : "未记录"} />
            <Fact label="体重" value={latestWeight ? `${(latestWeight / 1000).toFixed(2)} kg` : "未记录"} />
            <Fact label="下次提醒" value={latestReminder ? formatDate(latestReminder.dueAt) : "暂无"} />
          </div>
        </header>

        <section className="mt-5 grid gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4">
          <ReportBlock icon={BadgeCheck} title="基础信息">
            <Rows rows={[
              ["生日", formatDate(dog.birthDate)],
              ["到家日", dog.adoptionDate ? formatDate(dog.adoptionDate) : "未记录"],
              ["当前体重", dog.weightGrams ? `${(dog.weightGrams / 1000).toFixed(2)} kg` : "未记录"],
              ["备注", "由 PawDay 私有数据生成"],
            ]} />
          </ReportBlock>
          <ReportBlock icon={CalendarClock} title="待处理提醒">
            {dog.reminders.length ? <div className="space-y-2">{dog.reminders.map((item) => <div key={item.id} className="rounded-xl border border-stone-200 p-3"><div className="flex items-center justify-between gap-3"><span className="font-medium">{item.title}</span><Badge>{item.type}</Badge></div><p className="mt-1 text-xs text-stone-500">{formatDate(item.dueAt)}{item.repeatInterval && item.repeatUnit ? ` · 每 ${item.repeatInterval} ${item.repeatUnit}` : ""}</p></div>)}</div> : <p className="text-sm text-stone-500">暂无待处理提醒。</p>}
          </ReportBlock>
        </section>

        <section className="mt-5 grid gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-2">
          <CareTable icon={ShieldCheck} title="疫苗记录" rows={vaccines.map((item) => [formatDate(item.date), item.title, item.notes || ""])} empty="暂无疫苗记录" />
          <CareTable icon={ShieldCheck} title="驱虫记录" rows={deworming.map((item) => [formatDate(item.date), item.title, item.notes || ""])} empty="暂无驱虫记录" />
        </section>

        <section className="mt-5 sm:mt-6">
          <CareTable icon={HeartPulse} title="最近健康记录" rows={recentHealth.map((item) => [formatDate(item.date), `${item.type} · ${item.title}`, item.weightGrams ? `${(item.weightGrams / 1000).toFixed(2)} kg` : item.notes || ""])} empty="暂无健康记录" />
        </section>

        <section className="mt-5 sm:mt-6">
          <ReportTitle icon={FileText} title="证件信息" />
          {dog.documents.length ? <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {dog.documents.map((document) => (
              <div key={document.id} className="rounded-2xl border border-stone-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{document.title || document.type}</h3>
                    <p className="mt-1 text-xs text-stone-500">{document.issuer || "签发机构未记录"}{document.expiresAt ? ` · 有效期至 ${formatDate(document.expiresAt)}` : ""}</p>
                  </div>
                  <Badge>{document.type}</Badge>
                </div>
                <Rows rows={[
                  ["编号", document.identifier || "未记录"],
                  ["签发日期", document.issuedAt ? formatDate(document.issuedAt) : "未记录"],
                  ["备注", document.notes || "无"],
                ]} compact />
                {(document.frontImageUrl || document.backImageUrl) && <div className="mt-3 grid grid-cols-2 gap-2">
                  {[document.frontImageUrl, document.backImageUrl].map((url, index) => url ? <div key={url} className="relative aspect-[1.58/1] overflow-hidden rounded-xl border border-stone-200 bg-stone-100"><Image src={imageVariantUrl(url, "medium")} alt={`${document.type}${index === 0 ? "正面" : "反面"}`} fill unoptimized className="object-cover" sizes="240px" /></div> : <div key={index} />)}
                </div>}
              </div>
            ))}
          </div> : <p className="mt-3 rounded-2xl border border-stone-200 p-4 text-sm text-stone-500">暂无证件信息。</p>}
        </section>
      </article>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-stone-100 px-2.5 py-2 sm:rounded-xl sm:px-3"><p className="text-[11px] text-stone-500">{label}</p><p className="mt-0.5 truncate text-sm font-semibold sm:text-base">{value}</p></div>;
}

function ReportBlock({ icon: Icon, title, children }: { icon: typeof Scale; title: string; children: React.ReactNode }) {
  return <section className="rounded-xl border border-stone-200 p-3 sm:rounded-2xl sm:p-4"><ReportTitle icon={Icon} title={title} />{children}</section>;
}

function ReportTitle({ icon: Icon, title }: { icon: typeof Scale; title: string }) {
  return <div className="mb-3 flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-[#f6ddcc] text-[#9a5838] sm:rounded-xl"><Icon className="size-4" /></span><h2 className="font-semibold">{title}</h2></div>;
}

function Rows({ rows, compact = false }: { rows: [string, string][]; compact?: boolean }) {
  return <div className={compact ? "mt-3 divide-y divide-stone-200 text-sm" : "divide-y divide-stone-200 text-sm"}>{rows.map(([label, value]) => <div key={label} className="flex justify-between gap-4 py-2"><span className="shrink-0 text-stone-500">{label}</span><span className="text-right font-medium">{value}</span></div>)}</div>;
}

function CareTable({ icon: Icon, title, rows, empty }: { icon: typeof Scale; title: string; rows: string[][]; empty: string }) {
  return (
    <section className="rounded-xl border border-stone-200 p-3 sm:rounded-2xl sm:p-4">
      <ReportTitle icon={Icon} title={title} />
      {rows.length ? <div className="overflow-hidden rounded-xl border border-stone-200">
        {rows.map((row, index) => <div key={`${row[0]}-${index}`} className="grid grid-cols-[6.5rem_1fr] gap-2 border-b border-stone-200 px-2.5 py-2 text-sm last:border-b-0 sm:grid-cols-[8rem_1fr_1.2fr] sm:gap-3 sm:px-3"><span className="text-stone-500">{row[0]}</span><span className="font-medium">{row[1]}</span><span className="col-span-2 text-stone-500 sm:col-span-1">{row[2] || "-"}</span></div>)}
      </div> : <p className="text-sm text-stone-500">{empty}</p>}
    </section>
  );
}
