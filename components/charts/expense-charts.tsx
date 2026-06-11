"use client";

import type { ComponentProps } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer as RechartsResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money } from "@/lib/utils";

function ResponsiveContainer(props: ComponentProps<typeof RechartsResponsiveContainer>) {
  return <RechartsResponsiveContainer initialDimension={{ width: 480, height: 256 }} {...props} />;
}

const colors=["#e88758","#8ca88b","#d6aa68","#9a8ac3","#6f9fb6","#d27b84","#a7a19a","#c5b7a2","#7f8f76"];

export function ExpenseCharts({categories,months}:{categories:{name:string;value:number}[];months:{month:string;value:number}[]}){
  return <div className="grid min-w-0 gap-5 xl:grid-cols-2">
    <div className="soft-card min-w-0 rounded-3xl p-5 sm:p-6">
      <h3 className="font-semibold">分类占比</h3><p className="mt-1 text-xs text-[var(--muted)]">最近 12 个月</p>
      {categories.length?<div className="mt-4 grid min-w-0 items-center sm:grid-cols-[1fr_150px]"><div className="h-64 min-w-0"><ResponsiveContainer minWidth={0}><PieChart><Pie data={categories} dataKey="value" nameKey="name" innerRadius={56} outerRadius={88} paddingAngle={3}>{categories.map((_,i)=><Cell key={i} fill={colors[i%colors.length]}/>)}</Pie><Tooltip formatter={(value)=>money(Number(value))} contentStyle={{borderRadius:16,border:"1px solid var(--line)",background:"var(--background)",fontSize:12}}/></PieChart></ResponsiveContainer></div><div className="space-y-2">{categories.slice(0,6).map((item,i)=><div key={item.name} className="flex items-center justify-between gap-3 text-xs"><span className="flex items-center gap-2"><i className="size-2 rounded-full" style={{background:colors[i%colors.length]}}/>{item.name}</span><span className="text-[var(--muted)]">{money(item.value)}</span></div>)}</div></div>:<div className="grid h-64 place-items-center text-sm text-[var(--muted)]">还没有开销数据</div>}
    </div>
    <div className="soft-card min-w-0 rounded-3xl p-5 sm:p-6">
      <h3 className="font-semibold">月度趋势</h3><p className="mt-1 text-xs text-[var(--muted)]">过去 12 个月</p>
      <div className="mt-6 h-64 min-w-0"><ResponsiveContainer minWidth={0}><BarChart data={months} margin={{left:-8,right:4}}><CartesianGrid vertical={false} stroke="var(--line)"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize:10,fill:"var(--muted)"}}/><YAxis width={46} axisLine={false} tickLine={false} tick={{fontSize:10,fill:"var(--muted)"}} tickFormatter={(value)=>`¥${Math.round(Number(value)/100)}`}/><Tooltip formatter={(value)=>money(Number(value))} contentStyle={{borderRadius:16,border:"1px solid var(--line)",background:"var(--background)",fontSize:12}}/><Bar dataKey="value" fill="#e88758" radius={[8,8,3,3]} maxBarSize={34}/></BarChart></ResponsiveContainer></div>
    </div>
  </div>;
}
