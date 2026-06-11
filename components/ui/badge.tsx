import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("inline-flex items-center rounded-full bg-black/[.045] px-2.5 py-1 text-xs font-medium text-[var(--muted)] dark:bg-white/[.07]", className)} {...props} />;
}
