import Image from "next/image";
import Link from "next/link";
import { endOfMonth, startOfMonth } from "date-fns";
import { ArrowUpRight, CalendarHeart, Camera, CircleDollarSign, Clock3, HeartPulse, NotebookPen, PawPrint, Plus, Sparkles } from "lucide-react";
import { prisma } from "@/lib/db";
import { daysTogether, dogAge, formatDate, formatDateTime, money } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { DogForm } from "@/components/forms/dog-form";
import { LogForm } from "@/components/forms/log-form";
import { WeightChart } from "@/components/charts/weight-chart";

const logColors:Record<string,string>={"喂食":"bg-amber-500/12 text-amber-700 dark:text-amber-300","遛狗":"bg-emerald-500/12 text-emerald-700 dark:text-emerald-300","洗澡":"bg-sky-500/12 text-sky-700 dark:text-sky-300","睡眠":"bg-violet-500/12 text-violet-700 dark:text-violet-300","训练":"bg-orange-500/12 text-orange-700 dark:text-orange-300"};

export default async function DashboardPage(){
  const dog=await prisma.dog.findFirst();
  if(!dog)return <div className="page-enter"><div className="relative overflow-hidden rounded-[2rem] border bg-[var(--card)] p-6 sm:p-10 lg:min-h-[620px] lg:p-14"><div className="relative z-10 max-w-xl"><Badge className="bg-[var(--sage-soft)] text-[#587158] dark:text-[#b9d6b8]">第一次来到 PawDay</Badge><h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-[-.055em] sm:text-6xl">先把它的名字，<br/>写进这里。</h1><p className="mt-5 max-w-lg text-base leading-relaxed text-[var(--muted)] sm:text-lg">创建小狗档案后，就可以开始记录散步、健康、照片和每一件值得记住的小事。</p><div className="mt-8"><DogForm onboarding/></div></div><div className="relative mt-10 h-72 overflow-hidden rounded-[2rem] lg:absolute lg:inset-y-8 lg:right-8 lg:mt-0 lg:w-[43%] lg:h-auto"><Image src="/pawday-hero.png" alt="温暖的小狗插画" fill className="object-cover" sizes="50vw"/><div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"/></div></div></div>;
  const now=new Date();
  const [logs,health,expenses,reminder,weights]=await Promise.all([
    prisma.dailyLog.findMany({where:{dogId:dog.id},orderBy:{occurredAt:"desc"},take:5}),
    prisma.healthRecord.findMany({where:{dogId:dog.id},orderBy:{date:"desc"},take:4}),
    prisma.expense.aggregate({where:{dogId:dog.id,date:{gte:startOfMonth(now),lte:endOfMonth(now)}},_sum:{amountCents:true}}),
    prisma.reminder.findFirst({where:{dogId:dog.id,completed:false,dueAt:{gte:new Date(now.toDateString())}},orderBy:{dueAt:"asc"}}),
    prisma.healthRecord.findMany({where:{dogId:dog.id,weightGrams:{not:null}},orderBy:{date:"asc"},take:12}),
  ]);
  const together=daysTogether(dog.adoptionDate);
  const chart=weights.map(x=>({date:formatDate(x.date,"M/d"),weight:(x.weightGrams||0)/1000}));
  return <div className="page-enter space-y-6 sm:space-y-8">
    <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-[var(--orange)]">{new Intl.DateTimeFormat("zh-CN",{month:"long",day:"numeric",weekday:"long"}).format(now)}</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.05em] sm:text-5xl">今天也要好好生活。</h1><p className="mt-3 text-[var(--muted)]">陪 {dog.name} 认真度过普通的一天。</p></div><LogForm/></section>
    <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#e9a476] via-[#e8895f] to-[#cc705b] p-6 text-white shadow-xl shadow-orange-300/20 sm:p-8"><div className="relative z-10 flex flex-col gap-7 sm:flex-row sm:items-center"><div className="relative size-24 shrink-0 overflow-hidden rounded-[1.75rem] border-4 border-white/30 bg-white/20 sm:size-28">{dog.avatarUrl?<Image src={dog.avatarUrl} alt={dog.name} fill unoptimized className="object-cover" sizes="112px"/>:<div className="grid size-full place-items-center"><PawPrint className="size-10"/></div>}</div><div><p className="text-sm text-white/75">MY BEST FRIEND</p><h2 className="mt-1 text-3xl font-semibold tracking-[-.04em]">{dog.name}</h2><div className="mt-3 flex flex-wrap gap-2"><Badge className="bg-white/18 text-white">{dog.breed||"品种未记录"}</Badge><Badge className="bg-white/18 text-white">{dogAge(dog.birthDate)}</Badge>{together&&<Badge className="bg-white/18 text-white">陪伴第 {together} 天</Badge>}</div></div><Button asChild variant="outline" className="border-white/25 bg-white/12 text-white hover:bg-white/20 sm:ml-auto"><Link href="/dog">查看档案<ArrowUpRight className="size-4"/></Link></Button></div><PawPrint className="absolute -bottom-14 -right-6 size-52 rotate-[-18deg] text-white/[.07]"/></section>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat icon={NotebookPen} label="最近记录" value={logs.length?logs[0].title:"还没有记录"} meta={logs.length?formatDateTime(logs[0].occurredAt):"从今天开始"} tone="orange"/>
      <Stat icon={HeartPulse} label="最近健康" value={health.length?health[0].title:"等待第一次记录"} meta={health.length?formatDate(health[0].date):"体重、疫苗、驱虫"} tone="sage"/>
      <Stat icon={CircleDollarSign} label="本月开销" value={money(expenses._sum.amountCents||0)} meta="本月累计" tone="gold"/>
      <Stat icon={CalendarHeart} label="下次提醒" value={reminder?reminder.title:"暂时没有提醒"} meta={reminder?formatDate(reminder.dueAt):"可以在健康记录中设置"} tone="violet"/>
    </section>
    <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
      <Card><CardHeader><div><CardTitle>体重趋势</CardTitle><p className="mt-1 text-xs text-[var(--muted)]">轻轻关注每一点变化</p></div><Button asChild size="sm" variant="ghost"><Link href="/health">查看健康<ArrowUpRight className="size-3.5"/></Link></Button></CardHeader><CardContent><WeightChart data={chart} compact/></CardContent></Card>
      <Card><CardHeader><div><CardTitle>最近的日子</CardTitle><p className="mt-1 text-xs text-[var(--muted)]">刚刚发生的小事</p></div><Button asChild size="sm" variant="ghost"><Link href="/logs">全部记录<ArrowUpRight className="size-3.5"/></Link></Button></CardHeader><CardContent>{logs.length?<div className="space-y-1">{logs.map(log=><Link href="/logs" key={log.id} className="flex items-center gap-3 rounded-2xl p-3 transition hover:bg-black/[.035] dark:hover:bg-white/[.04]"><span className={`grid size-10 shrink-0 place-items-center rounded-2xl ${logColors[log.type]||"bg-stone-500/10 text-stone-600 dark:text-stone-300"}`}><Sparkles className="size-4"/></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{log.title}</p><p className="mt-0.5 text-xs text-[var(--muted)]">{log.type} · {formatDateTime(log.occurredAt)}</p></div>{log.mood&&<span className="text-xs text-[var(--muted)]">{log.mood}</span>}</Link>)}</div>:<EmptyState compact title="今天还没有记录" description="散步、吃饭、打盹，都值得被记下来。"/>}</CardContent></Card>
    </section>
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Quick href="/logs" icon={Plus} label="记日常"/><Quick href="/photos" icon={Camera} label="存照片"/><Quick href="/health" icon={HeartPulse} label="健康记录"/><Quick href="/expenses" icon={CircleDollarSign} label="记开销"/></section>
  </div>
}

function Stat({icon:Icon,label,value,meta,tone}:{icon:typeof Clock3;label:string;value:string;meta:string;tone:string}){const tones:Record<string,string>={orange:"bg-[var(--orange-soft)] text-[var(--orange)]",sage:"bg-[var(--sage-soft)] text-[var(--sage)]",gold:"bg-amber-500/10 text-amber-600",violet:"bg-violet-500/10 text-violet-600"};return <Card className="p-5"><div className={`grid size-10 place-items-center rounded-2xl ${tones[tone]}`}><Icon className="size-5"/></div><p className="mt-5 text-xs font-medium text-[var(--muted)]">{label}</p><p className="mt-1 truncate text-lg font-semibold tracking-tight">{value}</p><p className="mt-1 truncate text-xs text-[var(--muted)]">{meta}</p></Card>}
function Quick({href,icon:Icon,label}:{href:string;icon:typeof Plus;label:string}){return <Link href={href} className="soft-card group flex items-center gap-3 rounded-2xl p-4 text-sm font-medium transition hover:-translate-y-0.5 hover:shadow-lg"><span className="grid size-9 place-items-center rounded-xl bg-black/[.04] text-[var(--muted)] transition group-hover:bg-[var(--orange-soft)] group-hover:text-[var(--orange)] dark:bg-white/[.06]"><Icon className="size-4"/></span>{label}</Link>}
