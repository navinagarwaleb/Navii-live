import Link from "next/link";
import { PerformerSetupForm } from "@/components/performer-setup-form";

export default function SetupPage() {
  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-col flex-col px-6 py-8 sm:px-8 sm:py-12">
      <Link
        href="/"
        className="font-serif text-xl font-semibold tracking-[-0.01em] text-deep-blue transition-opacity hover:opacity-70"
      >
        Song Table
      </Link>

      <section className="mt-12">
        <p className="text-[10px] font-bold tracking-[0.14em] text-[#9b671b] uppercase">
          One-time setup
        </p>
        <h1 className="mt-4 font-serif text-[clamp(1.75rem,5.5vw,2.25rem)] leading-[1.2] font-semibold tracking-[-0.01em] text-deep-blue">
          Claim your page
        </h1>
        <p className="mt-3 max-w-sm text-[0.95rem] leading-[1.55] text-mist">
          Pick a username and display name. Tips and songs can wait until
          you’re ready.
        </p>
        <PerformerSetupForm />
      </section>
    </main>
  );
}
