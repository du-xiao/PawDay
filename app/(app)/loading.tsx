export default function Loading() {
  return <div className="space-y-7 animate-pulse"><div className="h-12 w-64 rounded-2xl bg-black/[.06] dark:bg-white/[.07]" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({length:4}).map((_,i)=><div key={i} className="h-36 rounded-3xl bg-black/[.05] dark:bg-white/[.06]" />)}</div><div className="grid gap-5 lg:grid-cols-2"><div className="h-80 rounded-3xl bg-black/[.05] dark:bg-white/[.06]" /><div className="h-80 rounded-3xl bg-black/[.05] dark:bg-white/[.06]" /></div></div>;
}
