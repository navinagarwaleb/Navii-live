import { BrandMark } from "@/components/brand-mark";
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
      <BrandMark href="/" />

      <section className="mt-12">
        {authError ? (
          <p
            role="alert"
            className="mb-6 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-[#C73A2B]"
          >
            {authError}
          </p>
        ) : null}
        <SignupForm />
      </section>
    </main>
  );
}
