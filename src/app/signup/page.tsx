import Link from "next/link";
import { SignupForm } from "@/components/signup-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const authError =
    params.error === "auth"
      ? "Google sign-in didn’t complete. Try again."
      : params.error === "config"
        ? "Auth isn’t configured. Check your Supabase env vars."
        : null;

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-col flex-col px-6 py-8 sm:px-8 sm:py-12">
      <Link
        href="/"
        className="font-serif text-xl font-semibold tracking-[-0.01em] text-deep-blue transition-opacity hover:opacity-70"
      >
        Navii Live
      </Link>

      <section className="mt-12">
        <p className="text-[10px] font-bold tracking-[0.14em] text-[#9b671b] uppercase">
          Artist onboarding
        </p>
        <h1 className="mt-4 font-serif text-[clamp(1.75rem,5.5vw,2.25rem)] leading-[1.2] font-semibold tracking-[-0.01em] text-deep-blue">
          Get your free page
        </h1>
        <p className="mt-3 max-w-sm text-[0.95rem] leading-[1.55] text-mist">
          Sign up with Google, Facebook, or email, then claim a username and go
          live.
        </p>
        {authError ? (
          <p
            role="alert"
            className="mt-6 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-[#C73A2B]"
          >
            {authError}
          </p>
        ) : null}
        <SignupForm />
      </section>
    </main>
  );
}
