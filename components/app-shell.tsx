"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Bone, CalendarClock, Camera, ChevronDown, ChevronRight, CircleDollarSign, Dog, HeartPulse, Home, KeyRound, LogOut, Menu, Moon, Settings, Sun, NotebookPen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/", label: "今天", icon: Home },
  { href: "/logs", label: "日常", icon: NotebookPen },
  { href: "/health", label: "健康", icon: HeartPulse },
  { href: "/expenses", label: "开销", icon: CircleDollarSign },
  { href: "/photos", label: "相册", icon: Camera },
  { href: "/dog", label: "档案", icon: Dog },
];

type ReminderCard = { href: string; title: string; detail: string; urgent: boolean };

export function AppShell({ email, reminder, children }: { email: string; reminder: ReminderCard; children: React.ReactNode }) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return <div className="min-h-dvh">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r bg-[var(--card)]/80 p-4 backdrop-blur-xl lg:flex lg:flex-col">
      <Link href="/" className="flex items-center gap-3 px-3 py-4"><span className="grid size-11 place-items-center rounded-2xl bg-[var(--orange)] text-white shadow-lg shadow-orange-300/25"><Bone className="size-5 rotate-[-25deg]" /></span><div><div className="text-lg font-bold tracking-[-.04em]">PawDay</div><div className="text-[11px] text-[var(--muted)]">OUR LITTLE DAYS</div></div></Link>
      <nav className="mt-8 space-y-1.5">{nav.map((item) => { const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href); return <Link key={item.href} href={item.href} className={cn("flex h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium text-[var(--muted)] transition hover:bg-black/[.04] hover:text-[var(--foreground)] dark:hover:bg-white/[.05]", active && "bg-[var(--orange-soft)] text-[#9a5838] dark:text-[#ffc19d]")}><item.icon className="size-[18px]" />{item.label}</Link>; })}</nav>
      <Link href={reminder.href} className={cn("group mt-auto block rounded-3xl p-4 transition hover:-translate-y-0.5 hover:shadow-lg", reminder.urgent ? "bg-red-500/10" : "bg-[var(--sage-soft)]")}>
        <div className="flex items-start justify-between gap-3"><div className={cn("grid size-9 place-items-center rounded-xl bg-white/60 dark:bg-white/10", reminder.urgent ? "text-red-500" : "text-[var(--sage)]")}><CalendarClock className="size-5" /></div><ChevronRight className="mt-2 size-4 text-[var(--muted)] transition group-hover:translate-x-0.5" /></div>
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">健康提醒</p>
        <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">{reminder.title}</p>
        <p className={cn("mt-2 text-xs leading-relaxed", reminder.urgent ? "text-red-600 dark:text-red-300" : "text-[var(--muted)]")}>{reminder.detail}</p>
      </Link>
    </aside>
    <div className="min-w-0 pb-24 lg:ml-[248px] lg:pb-0">
      <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b bg-[var(--background)]/75 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
        <div className="flex items-center gap-3 lg:hidden"><span className="grid size-10 place-items-center rounded-2xl bg-[var(--orange)] text-white"><Bone className="size-5 rotate-[-25deg]" /></span><span className="font-bold tracking-tight">PawDay</span></div>
        <div className="hidden text-sm text-[var(--muted)] lg:block">把陪伴写进每一天</div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="切换主题" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>{resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}</Button>
          {mounted ? <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild><button className="flex items-center gap-2 rounded-2xl p-1.5 pr-2 outline-none hover:bg-black/[.04] dark:hover:bg-white/[.05]"><span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[var(--orange)] to-[#d36e54] text-sm font-semibold text-white">{email.slice(0,1).toUpperCase()}</span><span className="hidden max-w-40 truncate text-sm sm:block">{email}</span><ChevronDown className="size-4 text-[var(--muted)]" /></button></DropdownMenu.Trigger>
            <DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={8} className="z-50 w-56 rounded-2xl border bg-[var(--background)] p-2 shadow-2xl">
              <DropdownMenu.Label className="px-3 py-2 text-xs text-[var(--muted)]">主人账号</DropdownMenu.Label>
              <DropdownMenu.Item asChild><Link href="/settings" className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm outline-none hover:bg-black/[.04] dark:hover:bg-white/[.05]"><Settings className="size-4" />设置</Link></DropdownMenu.Item>
              <DropdownMenu.Item asChild><Link href="/settings#password" className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm outline-none hover:bg-black/[.04] dark:hover:bg-white/[.05]"><KeyRound className="size-4" />修改密码</Link></DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-[var(--line)]" />
              <DropdownMenu.Item onSelect={() => signOut({ callbackUrl: "/login" })} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-500 outline-none hover:bg-red-500/10"><LogOut className="size-4" />退出登录</DropdownMenu.Item>
            </DropdownMenu.Content></DropdownMenu.Portal>
          </DropdownMenu.Root> : <div className="flex items-center gap-2 p-1.5 pr-2"><span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[var(--orange)] to-[#d36e54] text-sm font-semibold text-white">{email.slice(0,1).toUpperCase()}</span><span className="hidden max-w-40 truncate text-sm sm:block">{email}</span><ChevronDown className="size-4 text-[var(--muted)]" /></div>}
        </div>
      </header>
      <main className="mx-auto max-w-[1380px] p-4 sm:p-7 lg:p-10">{children}</main>
    </div>
    <nav className="fixed inset-x-3 bottom-3 z-30 flex items-center justify-around rounded-3xl border bg-[var(--card)]/92 px-1 py-2 shadow-2xl backdrop-blur-xl lg:hidden">{nav.slice(0,5).map((item) => { const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href); return <Link key={item.href} href={item.href} className={cn("flex min-w-14 flex-col items-center gap-1 rounded-2xl px-2 py-1.5 text-[10px] font-medium text-[var(--muted)]", active && "bg-[var(--orange-soft)] text-[#9a5838] dark:text-[#ffc19d]")}><item.icon className="size-[19px]" />{item.label}</Link>; })}<Link href="/dog" aria-label="小狗档案" className={cn("grid size-11 place-items-center rounded-2xl text-[var(--muted)]", pathname.startsWith("/dog") && "bg-[var(--orange-soft)] text-[var(--orange)]")}><Menu className="size-5" /></Link></nav>
  </div>;
}
