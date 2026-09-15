import { cn } from "@/lib/utils";

/**
 * Admin toolbar chips — match “Manage tags”:
 * 12px / semibold / min-h 36 / leading-none.
 * Use explicit px size so Link and button match (buttons used to inherit body size).
 */
export const adminChipBase =
  "inline-flex h-9 min-h-[36px] items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold leading-none tracking-normal";

export function adminChipClass(className?: string) {
  return cn(
    adminChipBase,
    "border border-white/10 bg-[#1C1917] text-[#A8A29E] transition hover:border-white/20 hover:text-[#FAFAF9]",
    className,
  );
}

export function adminSegmentGroupClass(className?: string) {
  return cn(
    "inline-flex rounded-full border border-white/10 bg-[#1C1917] p-0.5",
    className,
  );
}

export function adminSegmentClass(active: boolean, className?: string) {
  return cn(
    adminChipBase,
    "transition",
    active
      ? "bg-[#FAFAF9] text-[#1C1917]"
      : "text-[#A8A29E] hover:text-[#FAFAF9]",
    className,
  );
}

/** Compact filled admin CTA (New setlist, Add) — same size, heavier weight. */
export function adminPrimaryChipClass(className?: string) {
  return cn(
    adminChipBase,
    "bg-[#FAFAF9] font-bold text-[#1C1917] transition hover:bg-white disabled:opacity-40",
    className,
  );
}
