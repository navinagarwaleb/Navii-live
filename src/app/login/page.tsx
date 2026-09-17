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
          : params.error === "confirm_expired"
            ? "That email confirmation link is invalid or has expired. Sign up again or request a new link."
            : null;

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-col flex-col px-5 py-5 sm:px-8 sm:py-12">
      <BrandMark href="/" compactMobile />

      <section className="mt-5 sm:mt-12">
        <p className="text-[10px] font-bold tracking-[0.14em] text-[#9b671b] uppercase">
          Artist login
        </p>
        <h1 className="mt-2 font-serif text-[clamp(1.5rem,5.5vw,2.25rem)] leading-[1.2] font-semibold tracking-[-0.01em] text-deep-blue sm:mt-4">
          Welcome back
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-snug text-mist sm:mt-3 sm:text-[0.95rem] sm:leading-[1.55]">
          Sign in with Google, or use your email / username and password.
        </p>
        <LoginForm initialError={authError} />
      </section>
    </main>
  );
}
