import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const authError =
    params.error === "auth"
      ? "Sign-in didn’t complete. Try again."
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
          Artist login
        </p>
        <h1 className="mt-4 font-serif text-[clamp(1.75rem,5.5vw,2.25rem)] leading-[1.2] font-semibold tracking-[-0.01em] text-deep-blue">
          Welcome back
        </h1>
        <p className="mt-3 max-w-sm text-[0.95rem] leading-[1.55] text-mist">
          Sign in with Google, Facebook, or email to manage your queue and page.
        </p>
        <LoginForm initialError={authError} />
      </section>
    </main>
  );
}
