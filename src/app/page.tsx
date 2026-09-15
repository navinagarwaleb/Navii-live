import { BrandMark } from "@/components/brand-mark";
import { LandingCtas } from "@/components/landing-ctas";
import { AuthErrorRedirect } from "@/components/auth-error-redirect";

export default function Home() {
  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-col flex-col justify-between overflow-hidden px-6 py-8 sm:px-8 sm:py-12">
      <AuthErrorRedirect />
      <div
        aria-hidden
        className="landing-wash pointer-events-none absolute inset-0 z-0"
      />

      <div className="relative z-10">
        <BrandMark />
      </div>

      <section className="relative z-10 py-16">
        <p className="animate-rise rise-1 text-[10px] font-bold tracking-[0.14em] text-[#9b671b] uppercase">
          For live artists
        </p>

        <h1 className="animate-rise rise-2 mt-4 font-serif text-[clamp(2.4rem,8vw,3.5rem)] leading-[1.15] font-semibold tracking-[-0.01em] text-deep-blue">
          Make the moment unforgettable.
        </h1>

        <p className="animate-rise rise-3 mt-4 max-w-sm text-[0.95rem] leading-[1.55] text-mist">
          Get a free page where your audience can request songs and leave
          dedications, live from their phones.
        </p>

        <LandingCtas />

        <p className="animate-rise rise-5 pt-3 text-center text-[11px] text-mist">
          Free to start · Your page, your list
        </p>
      </section>

      <div className="relative z-10 h-8" aria-hidden />
    </main>
  );
}
