import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-[52px] h-14 w-full rounded-full border border-border bg-field px-6 text-base text-ink shadow-xs outline-none transition placeholder:text-muted focus:border-line-strong focus:ring-4 focus:ring-accent/25",
        className,
      )}
      {...props}
    />
  );
}
