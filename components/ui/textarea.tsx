import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn("min-h-28 w-full resize-none rounded-2xl border bg-white/70 p-4 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,.55)] outline-none transition placeholder:text-[var(--muted)]/55 focus:border-orange-300 focus:bg-white/85 focus:ring-4 focus:ring-orange-100/60 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/[.045] dark:shadow-none dark:focus:bg-white/[.065] dark:focus:ring-orange-900/30", className)} {...props} />
));
Textarea.displayName = "Textarea";
