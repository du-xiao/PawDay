import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn("min-h-28 w-full resize-none rounded-2xl border bg-white/65 p-4 text-sm outline-none transition placeholder:text-[var(--muted)]/60 focus:border-orange-300 focus:ring-4 focus:ring-orange-100/60 dark:bg-white/[.045]", className)} {...props} />
));
Textarea.displayName = "Textarea";
