import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full px-5 text-[1.05rem] font-semibold transition-all outline-none disabled:pointer-events-none disabled:opacity-40 focus-visible:ring-4 focus-visible:ring-accent/35 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-ink text-surface shadow-cta hover:bg-deep-blue",
        secondary:
          "border border-border bg-surface text-ink shadow-xs hover:border-line-strong hover:bg-selected",
        ghost: "text-mist hover:bg-surface hover:text-ink",
        success: "bg-emerald-600 text-white hover:bg-emerald-700",
        destructive: "bg-border text-ink hover:bg-selected",
      },
      size: {
        default: "h-[52px]",
        lg: "h-[60px] text-[1.05rem]",
        icon: "size-11 min-h-[44px] min-w-[44px] px-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
