import { BrandMark } from "@/components/brand-mark";
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
        : params.error === "reset_expired"
          ? "That password reset link is invalid or has expired. Request a new one below."
          : null;

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-col flex-col px-6 py-8 sm:px-8 sm:py-12">
      <BrandMark href="/" />

      <section className="mt-12">
        <p className="text-[10px] font-bold tracking-[0.14em] text-[#9b671b] uppercase">
          Artist login
        </p>
        <h1 className="mt-4 font-serif text-[clamp(1.75rem,5.5vw,2.25rem)] leading-[1.2] font-semibold tracking-[-0.01em] text-deep-blue">
          Welcome back
        </h1>
        <p className="mt-3 max-w-sm text-[0.95rem] leading-[1.55] text-mist">
          Sign in with Google, or use your email / username and password.
        </p>
        <LoginForm initialError={authError} />
      </section>
    </main>
  );
}
