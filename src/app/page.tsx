import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-col flex-col justify-between px-6 py-8 sm:px-8 sm:py-12">
      <p className="font-serif text-xl font-semibold tracking-[-0.01em] text-deep-blue">
        Navii Live
      </p>

      <section className="py-16">
        <div className="mb-5 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-accent bg-surface px-4 py-2 text-sm font-semibold text-[#B8862F]">
          <Sparkles size={14} /> Your moment, your song
        </div>
        <h1 className="font-serif text-[clamp(2.4rem,8vw,3.5rem)] leading-[1.15] font-semibold tracking-[-0.01em] text-deep-blue">
          Make tonight unforgettable.
        </h1>
        <p className="mt-4 max-w-sm text-[0.95rem] leading-[1.55] text-mist">
          Request a song, add a dedication, and let Navii bring your moment to
          life.
        </p>
      </section>

      <Link
        href="/request"
        className="inline-flex min-h-[52px] items-center justify-between rounded-full bg-ink px-6 text-[1.05rem] font-semibold text-surface shadow-cta transition hover:bg-deep-blue"
      >
        Request a song
        <span className="grid size-8 place-items-center rounded-full bg-white/10">
          <ArrowRight size={16} />
        </span>
      </Link>
    </main>
  );
}
