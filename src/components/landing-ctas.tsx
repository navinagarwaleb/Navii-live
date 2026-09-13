import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function LandingCtas() {
  return (
    <div className="animate-rise rise-4 mt-8 grid gap-3">
      <Link
        href="/signup"
        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-ink px-6 text-base font-semibold text-surface shadow-cta transition hover:bg-deep-blue active:scale-[0.98]"
      >
        Get your free page
        <ArrowRight size={16} />
      </Link>

      <Link
        href="/login"
        className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-border bg-transparent px-6 text-base font-semibold text-ink transition hover:border-line-strong hover:bg-selected active:scale-[0.98]"
      >
        Sign in
      </Link>
    </div>
  );
}
