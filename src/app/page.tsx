import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-col flex-col justify-between overflow-hidden px-6 py-8 sm:px-8 sm:py-12">
      <div
        aria-hidden
        className="landing-wash pointer-events-none absolute inset-0 z-0"
      />

      <div className="relative z-10">
        <p className="font-serif text-xl font-semibold tracking-[-0.01em] text-deep-blue">
          Navii Live
        </p>
      </div>

      <section className="relative z-10 py-16">
        <p className="animate-rise rise-1 text-[10px] font-bold tracking-[0.14em] text-[#9b671b] uppercase">
          Live music · Song requests
        </p>

        <h1 className="animate-rise rise-2 mt-4 font-serif text-[clamp(2.4rem,8vw,3.5rem)] leading-[1.15] font-semibold tracking-[-0.01em] text-deep-blue">
          Make the moment unforgettable.
        </h1>

        <p className="animate-rise rise-3 mt-4 max-w-sm text-[0.95rem] leading-[1.55] text-mist">
Request a song, add a dedication, and make the moment yours.
        </p>

        <div className="animate-rise rise-4 mt-8 grid gap-3">
          <Link
            href="/request"
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-ink px-6 text-base font-semibold text-surface shadow-cta transition hover:bg-deep-blue active:scale-[0.98]"
          >
            Request a Song
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/songs"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-border bg-transparent px-6 text-base font-semibold text-ink transition hover:border-line-strong hover:bg-selected active:scale-[0.98]"
          >
            Browse the Setlist
          </Link>
        </div>

        <p className="animate-rise rise-5 pt-3 text-center text-[11px] text-mist">
          No account needed · Free to use
        </p>
      </section>

      <div className="relative z-10 h-8" aria-hidden />
    </main>
  );
}
