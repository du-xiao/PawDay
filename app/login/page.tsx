import Image from "next/image";
import { Suspense } from "react";
import { Heart, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import heroImg from "@/public/pawday-hero.png";
export const metadata = { title: "登录" };
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return <main className="min-h-dvh p-2 sm:p-5 lg:p-7">
    <div className="mx-auto grid min-h-[calc(100dvh-1rem)] max-w-[1500px] overflow-hidden rounded-[1.5rem] border bg-[var(--card)] shadow-2xl shadow-stone-900/10 sm:min-h-[calc(100dvh-2.5rem)] sm:rounded-[2rem] lg:grid-cols-[1.15fr_.85fr]">
      <section className="relative hidden overflow-hidden bg-[#efe6d8] lg:block dark:bg-[#28251f]">
        <Image src={heroImg} alt="一只沐浴在晨光中的小狗" fill priority className="object-cover" sizes="60vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#372d22]/55 via-transparent to-white/10" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white xl:p-14">
          <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur"><Heart className="size-6 fill-white/80" /></div>
          <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-[-.045em] xl:text-5xl">Welcome to PawDay</h1>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-white/82">那些散步、打盹、摇尾巴的小事，后来都会成为最珍贵的日子。</p>
        </div>
      </section>
      <section className="relative flex items-center justify-center px-4 py-8 sm:px-12 sm:py-12 lg:px-16">
        <div className="absolute right-4 top-4 flex items-center gap-2 text-xs text-[var(--muted)] sm:right-6 sm:top-6"><ShieldCheck className="size-4 text-[var(--sage)]" />私人空间 · 安全登录</div>
        <div className="w-full max-w-md page-enter">
          <div className="mb-6 lg:hidden"><div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-[var(--orange-soft)] text-[var(--orange)]"><Heart className="size-5 fill-current" /></div><h1 className="text-3xl font-semibold tracking-[-.04em]">PawDay</h1><p className="mt-2 text-sm text-[var(--muted)]">把陪伴写进每一天。</p></div>
          <div className="glass rounded-[1.5rem] border p-5 sm:rounded-[2rem] sm:p-9">
            <div className="mb-6 sm:mb-8"><p className="text-sm font-medium text-[var(--orange)]">欢迎回来</p><h2 className="mt-2 text-2xl font-semibold tracking-[-.035em] sm:text-3xl sm:tracking-[-.04em]">回到你们的小世界</h2><p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">登录后继续记录今天的快乐和牵挂。</p></div>
            <Suspense><LoginForm /></Suspense>
          </div>
          <p className="mt-4 text-center text-xs text-[var(--muted)] sm:mt-6">PawDay 只属于你和它，所有数据都保存在自己的设备上。</p>
        </div>
      </section>
    </div>
  </main>;
}
