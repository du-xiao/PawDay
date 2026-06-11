"use client";

import type { ComponentProps } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer as RechartsResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money } from "@/lib/utils";

function ResponsiveContainer(props: ComponentProps<typeof RechartsResponsiveContainer>) {
  return <RechartsResponsiveContainer initialDimension={{ width: 480, height: 256 }} {...props} />;
}

const colors=["#e88758","#8ca88b","#d6aa68","#9a8ac3","#6f9fb6","#d27b84","#a7a19a","#c5b7a2","#7f8f76"];

type ExpenseChartsProps={categories:{name:string;value:number}[];months:{month:string;value:number}[];scope:"month"|"year";selectedYear:number;selectedMonth:number;years:number[]};

export function ExpenseCharts({categories,months,scope,selectedYear,selectedMonth,years}:ExpenseChartsProps){
  const router=useRouter();const searchParams=useSearchParams();
  const periodLabel=scope==="year"?`${selectedYear} 年`:`${selectedYear} 年 ${selectedMonth} 月`;
  const categoryTotal=categories.reduce((sum,item)=>sum+item.value,0);
  function update(next:Record<string,string>){const params=new URLSearchParams(searchParams.toString());Object.entries(next).forEach(([key,value])=>params.set(key,value));router.replace(`/expenses?${params.toString()}`,{scroll:false});}
  return <div className="grid min-w-0 gap-5 xl:grid-cols-2">
    <div className="soft-card min-w-0 rounded-3xl p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="font-semibold">分类占比</h3><p className="mt-1 text-xs text-[var(--muted)]">{periodLabel} · 合计 {money(categoryTotal)}</p></div><div className="flex rounded-xl bg-black/[.035] p-1 dark:bg-white/[.05]"><button type="button" onClick={()=>update({scope:"month"})} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${scope==="month"?"bg-[var(--background)] text-[var(--orange)] shadow-sm":"text-[var(--muted)]"}`}>按月</button><button type="button" onClick={()=>update({scope:"year"})} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${scope==="year"?"bg-[var(--background)] text-[var(--orange)] shadow-sm":"text-[var(--muted)]"}`}>按年</button></div></div>
      <div className="mt-4 flex gap-2"><select aria-label="选择年份" value={selectedYear} onChange={event=>update({year:event.target.value})} className="h-9 rounded-xl border bg-white/60 px-3 text-xs font-medium outline-none focus:border-orange-300 dark:bg-white/[.05]">{years.map(year=><option key={year} value={year}>{year} 年</option>)}</select>{scope==="month"&&<select aria-label="选择月份" value={selectedMonth} onChange={event=>update({month:event.target.value})} className="h-9 rounded-xl border bg-white/60 px-3 text-xs font-medium outline-none focus:border-orange-300 dark:bg-white/[.05]">{Array.from({length:12},(_,index)=>index+1).map(month=><option key={month} value={month}>{month} 月</option>)}</select>}</div>
      {categories.length?<div className="mt-2 grid min-w-0 items-center sm:grid-cols-[1fr_150px]"><div className="h-56 min-w-0"><ResponsiveContainer minWidth={0}><PieChart><Pie data={categories} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={3}>{categories.map((_,i)=><Cell key={i} fill={colors[i%colors.length]}/>)}</Pie><Tooltip formatter={(value)=>money(Number(value))} contentStyle={{borderRadius:16,border:"1px solid var(--line)",background:"var(--background)",fontSize:12}}/></PieChart></ResponsiveContainer></div><div className="space-y-2">{categories.slice(0,6).map((item,i)=><div key={item.name} className="flex items-center justify-between gap-3 text-xs"><span className="flex items-center gap-2"><i className="size-2 rounded-full" style={{background:colors[i%colors.length]}}/>{item.name}</span><span className="text-[var(--muted)]">{money(item.value)}</span></div>)}</div></div>:<div className="grid h-56 place-items-center text-center text-sm text-[var(--muted)]">{periodLabel} 暂无开销数据</div>}
    </div>
    <div className="soft-card min-w-0 rounded-3xl p-5 sm:p-6">
      <h3 className="font-semibold">月度趋势</h3><p className="mt-1 text-xs text-[var(--muted)]">过去 12 个月</p>
      <div className="mt-6 h-64 min-w-0"><ResponsiveContainer minWidth={0}><BarChart data={months} margin={{left:-8,right:4}}><CartesianGrid vertical={false} stroke="var(--line)"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize:10,fill:"var(--muted)"}}/><YAxis width={46} axisLine={false} tickLine={false} tick={{fontSize:10,fill:"var(--muted)"}} tickFormatter={(value)=>`¥${Math.round(Number(value)/100)}`}/><Tooltip formatter={(value)=>money(Number(value))} contentStyle={{borderRadius:16,border:"1px solid var(--line)",background:"var(--background)",fontSize:12}}/><Bar dataKey="value" fill="#e88758" radius={[8,8,3,3]} maxBarSize={34}/></BarChart></ResponsiveContainer></div>
    </div>
  </div>;
}
