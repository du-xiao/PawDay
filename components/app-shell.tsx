"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { BellRing, Bone, Camera, ChevronDown, CircleDollarSign, Dog, HeartPulse, Home, KeyRound, LibraryBig, LogOut, Moon, Settings, Sun, NotebookPen, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { isGuestRole, roleLabel, type UserRole } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { QuickCreate } from "@/components/quick-create";

const nav = [
  { href: "/", label: "今天", icon: Home },
  { href: "/logs", label: "日常", icon: NotebookPen },
  { href: "/health", label: "健康", icon: HeartPulse },
  { href: "/expenses", label: "开销", icon: CircleDollarSign },
  { href: "/reminders", label: "提醒中心", icon: BellRing },
  { href: "/dog", label: "档案", icon: Dog },
  { href: "/photos", label: "相册", icon: Camera },
  { href: "/timeline", label: "时间线", icon: Sparkles },
];

const mobilePrimaryNav = [nav[0], nav[1], nav[2], nav[3]];
const mobileLibraryNav = [nav[5], nav[6], nav[7], nav[4]];

export function AppShell({ email, role, dogExists, quickLogs, children }: { email: string; role: UserRole; dogExists: boolean; quickLogs: { id: string; title: string }[]; children: React.ReactNode }) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isGuest = isGuestRole(role);
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);
  const libraryActive = mobileLibraryNav.some((item) => isActive(item.href));
  useEffect(() => setMounted(true), []);

  async function handleSignOut() {
    await signOut({ redirect: false, redirectTo: "/login" });
    window.location.assign(new URL("/login", window.location.href));
  }

  return <div className="min-h-dvh">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r bg-[var(--card)]/82 p-4 shadow-xl shadow-stone-900/[.035] backdrop-blur-xl lg:flex lg:flex-col">
      <Link href="/" className="flex items-center gap-3 rounded-3xl px-3 py-4 transition hover:bg-black/[.025] dark:hover:bg-white/[.035]"><span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[var(--orange)] to-[#d36e54] text-white shadow-lg shadow-orange-300/25"><Bone className="size-5 rotate-[-25deg]" /></span><div><div className="text-lg font-bold tracking-[-.04em]">PawDay</div><div className="text-[11px] text-[var(--muted)]">OUR LITTLE DAYS</div></div></Link>
      <nav className="mt-8 space-y-1.5">{nav.map((item) => { const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href); return <Link key={item.href} href={item.href} className={cn("flex h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium text-[var(--muted)] transition hover:translate-x-0.5 hover:bg-black/[.04] hover:text-[var(--foreground)] dark:hover:bg-white/[.05]", active && "bg-[var(--orange-soft)] text-[#9a5838] shadow-sm shadow-orange-200/20 dark:text-[#ffc19d]")}><item.icon className="size-[18px]" />{item.label}</Link>; })}</nav>
    </aside>
    <div className={cn("min-w-0 lg:ml-[248px]", isGuest ? "pb-20 lg:pb-0" : "pb-[calc(8.5rem+env(safe-area-inset-bottom))] lg:pb-32")}>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-[var(--background)]/78 px-3 shadow-sm shadow-stone-900/[.025] backdrop-blur-xl sm:h-20 sm:px-7 lg:px-10">
        <div className="flex items-center gap-2.5 lg:hidden"><span className="grid size-9 place-items-center rounded-xl bg-[var(--orange)] text-white sm:size-10 sm:rounded-2xl"><Bone className="size-5 rotate-[-25deg]" /></span><span className="font-bold tracking-tight">PawDay</span></div>
        <div className="hidden text-sm text-[var(--muted)] lg:block">把陪伴写进每一天</div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="切换主题" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>{resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}</Button>
          {mounted ? <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild><button className="flex items-center gap-2 rounded-2xl p-1.5 pr-2 outline-none transition hover:bg-black/[.04] focus-visible:ring-4 focus-visible:ring-orange-200/45 dark:hover:bg-white/[.05]"><span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[var(--orange)] to-[#d36e54] text-sm font-semibold text-white">{email.slice(0,1).toUpperCase()}</span><span className="hidden max-w-40 truncate text-sm sm:block">{email}</span><ChevronDown className="size-4 text-[var(--muted)]" /></button></DropdownMenu.Trigger>
            <DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={8} className="z-50 w-56 rounded-2xl border bg-[var(--background)] p-2 shadow-2xl shadow-stone-950/10">
              <DropdownMenu.Label className="px-3 py-2 text-xs text-[var(--muted)]">{roleLabel(role)}账号{isGuest ? " · 只读模式" : ""}</DropdownMenu.Label>
              <DropdownMenu.Item asChild><Link href="/settings" className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm outline-none hover:bg-black/[.04] dark:hover:bg-white/[.05]"><Settings className="size-4" />设置</Link></DropdownMenu.Item>
              {!isGuest && <DropdownMenu.Item asChild><Link href="/settings#password" className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm outline-none hover:bg-black/[.04] dark:hover:bg-white/[.05]"><KeyRound className="size-4" />修改密码</Link></DropdownMenu.Item>}
              <DropdownMenu.Separator className="my-1 h-px bg-[var(--line)]" />
              <DropdownMenu.Item onSelect={() => void handleSignOut()} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-500 outline-none hover:bg-red-500/10"><LogOut className="size-4" />退出登录</DropdownMenu.Item>
            </DropdownMenu.Content></DropdownMenu.Portal>
          </DropdownMenu.Root> : <div className="flex items-center gap-2 p-1.5 pr-2"><span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[var(--orange)] to-[#d36e54] text-sm font-semibold text-white">{email.slice(0,1).toUpperCase()}</span><span className="hidden max-w-40 truncate text-sm sm:block">{email}</span><ChevronDown className="size-4 text-[var(--muted)]" /></div>}
        </div>
      </header>
      <main className="mx-auto max-w-[1380px] p-3 sm:p-7 lg:p-10">{children}</main>
    </div>
    <QuickCreate canWrite={!isGuest} dogExists={dogExists} logs={quickLogs} />
    <nav className="fixed inset-x-2 bottom-[calc(.5rem+env(safe-area-inset-bottom))] z-30 grid grid-cols-5 items-center gap-0.5 rounded-2xl border bg-[var(--card)]/94 px-1 py-1.5 shadow-2xl shadow-stone-900/10 backdrop-blur-xl lg:hidden">
      {mobilePrimaryNav.map((item) => { const active = isActive(item.href); return <Link key={item.href} href={item.href} className={cn("flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-[10px] font-medium text-[var(--muted)] transition", active && "bg-[var(--orange-soft)] text-[#9a5838] shadow-sm shadow-orange-200/25 dark:text-[#ffc19d]")}><item.icon className="size-[19px]" /><span className="w-full truncate text-center">{item.label}</span></Link>; })}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button type="button" className={cn("flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-[10px] font-medium text-[var(--muted)] transition outline-none focus-visible:ring-4 focus-visible:ring-orange-200/45", libraryActive && "bg-[var(--orange-soft)] text-[#9a5838] shadow-sm shadow-orange-200/25 dark:text-[#ffc19d]")}>
            <LibraryBig className="size-[19px]" />
            <span className="w-full truncate text-center">资料库</span>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" side="top" sideOffset={10} className="z-50 w-48 rounded-2xl border bg-[var(--background)] p-2 shadow-2xl shadow-stone-950/12">
            {mobileLibraryNav.map((item) => {
              const active = isActive(item.href);
              return <DropdownMenu.Item key={item.href} asChild><Link href={item.href} className={cn("flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm outline-none hover:bg-black/[.04] dark:hover:bg-white/[.05]", active && "bg-[var(--orange-soft)] text-[#9a5838] dark:text-[#ffc19d]")}><item.icon className="size-4" />{item.label}</Link></DropdownMenu.Item>;
            })}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </nav>
  </div>;
}
