import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { DEFAULT_BIO } from "@/lib/performer-defaults";
import { getPerformerByUsername } from "@/lib/performers";

type PageProps = {
  params: Promise<{ username: string }>;
};

export default async function PerformerLandingPage({ params }: PageProps) {
  const { username } = await params;
  const performer = await getPerformerByUsername(username);

  if (!performer) {
    notFound();
  }

  const bio = performer.bio?.trim() || DEFAULT_BIO;

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-col flex-col justify-between overflow-hidden px-6 py-8 sm:px-8 sm:py-12">
      <div
        aria-hidden
        className="landing-wash pointer-events-none absolute inset-0 z-0"
      />

      <div className="relative z-10">
        <Link
          href="/"
          className="text-sm font-semibold text-mist transition hover:text-deep-blue"
        >
          ← Home
        </Link>
      </div>

      <section className="relative z-10 py-16">
        <p className="animate-rise rise-1 text-[10px] font-bold tracking-[0.14em] text-[#9b671b] uppercase">
          Live requests
        </p>

        <h1 className="animate-rise rise-2 mt-4 font-serif text-[clamp(2.2rem,7vw,3.25rem)] leading-[1.15] font-semibold tracking-[-0.01em] text-deep-blue">
          {performer.display_name}
        </h1>

        <p className="animate-rise rise-3 mt-4 max-w-sm text-[0.95rem] leading-[1.55] text-mist">
          {bio}
        </p>

        <div className="animate-rise rise-4 mt-8">
          <Link
            href={`/${performer.username}/request`}
            className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-ink px-6 text-base font-semibold text-surface shadow-cta transition hover:bg-deep-blue active:scale-[0.98]"
          >
            Request a Song
            <ArrowRight size={16} />
          </Link>
        </div>

        <p className="animate-rise rise-5 pt-3 text-center text-[11px] text-mist">
          No account needed · Takes under a minute
        </p>
      </section>

      <div className="relative z-10 h-8" aria-hidden />
    </main>
  );
}
