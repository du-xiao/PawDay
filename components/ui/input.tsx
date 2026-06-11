import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn("h-12 w-full rounded-2xl border bg-white/65 px-4 text-sm outline-none transition placeholder:text-[var(--muted)]/60 focus:border-orange-300 focus:ring-4 focus:ring-orange-100/60 dark:bg-white/[.045] dark:focus:ring-orange-900/30", className)} {...props} />
));
Input.displayName = "Input";
