import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) { return <div className={cn("soft-card rounded-3xl", className)} {...props} />; }
export function CardHeader({ className, ...props }: React.ComponentProps<"div">) { return <div className={cn("flex items-start justify-between gap-4 p-5 pb-2 sm:p-6 sm:pb-3", className)} {...props} />; }
export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) { return <h3 className={cn("font-semibold tracking-[-.02em]", className)} {...props} />; }
export function CardContent({ className, ...props }: React.ComponentProps<"div">) { return <div className={cn("p-5 pt-3 sm:p-6 sm:pt-3", className)} {...props} />; }
