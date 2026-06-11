"use client";

import type { ComponentProps } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer as RechartsResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function ResponsiveContainer(props: ComponentProps<typeof RechartsResponsiveContainer>) {
  return <RechartsResponsiveContainer initialDimension={{ width: 700, height: 208 }} {...props} />;
}

export function WeightChart({ data, compact = false }: { data: { date: string; weight: number }[]; compact?: boolean }) {
  if (!data.length) return <div className="grid h-52 place-items-center text-sm text-[var(--muted)]">记录一次体重后，趋势会出现在这里</div>;
  return <div className={compact ? "h-52 min-w-0" : "h-72 min-w-0"}>
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
        <defs><linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8ca88b" stopOpacity={0.42}/><stop offset="95%" stopColor="#8ca88b" stopOpacity={0}/></linearGradient></defs>
        <CartesianGrid vertical={false} stroke="var(--line)"/>
        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize:11,fill:"var(--muted)"}}/>
        <YAxis axisLine={false} tickLine={false} tick={{fontSize:11,fill:"var(--muted)"}} domain={["dataMin - 0.5","dataMax + 0.5"]}/>
        <Tooltip contentStyle={{borderRadius:16,border:"1px solid var(--line)",background:"var(--background)",fontSize:12}} formatter={(value)=>[`${Number(value).toFixed(2)} kg`,"体重"]}/>
        <Area type="monotone" dataKey="weight" stroke="#7e9d7d" strokeWidth={3} fill="url(#weightFill)" dot={{r:3,fill:"#7e9d7d",strokeWidth:0}} activeDot={{r:5}}/>
      </AreaChart>
    </ResponsiveContainer>
  </div>;
}
