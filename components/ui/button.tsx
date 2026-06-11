import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all outline-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-4 focus-visible:ring-orange-200/50 active:scale-[.98]",
  {
    variants: {
      variant: {
        default: "bg-[#2d2924] text-white shadow-lg shadow-black/10 hover:bg-[#423c35] dark:bg-[#f4eee5] dark:text-[#211f1b]",
        warm: "bg-[var(--orange)] text-white shadow-lg shadow-orange-300/20 hover:brightness-105",
        secondary: "bg-[var(--orange-soft)] text-[#8d4d2f] hover:brightness-95 dark:text-[#ffc09b]",
        outline: "border bg-[var(--card)] hover:bg-black/[.03] dark:hover:bg-white/[.05]",
        ghost: "hover:bg-black/[.05] dark:hover:bg-white/[.06]",
        danger: "bg-red-500/10 text-red-600 hover:bg-red-500/15 dark:text-red-300",
      },
      size: { default: "h-11 px-5", sm: "h-9 px-3.5 rounded-xl", lg: "h-13 px-7 text-base", icon: "size-10 p-0 rounded-xl" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
