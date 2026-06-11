"use client";

import { CircleAlert, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return <div className="grid min-h-[60vh] place-items-center"><div className="max-w-md text-center"><div className="mx-auto grid size-16 place-items-center rounded-3xl bg-red-500/10 text-red-500"><CircleAlert className="size-7" /></div><h2 className="mt-5 text-2xl font-semibold">这一页暂时走神了</h2><p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">数据没有丢失。可以重新加载一次，如果问题持续，请检查数据库目录权限。</p><Button onClick={reset} className="mt-6"><RefreshCw className="size-4" />重新加载</Button></div></div>;
}
