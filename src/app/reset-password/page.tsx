import Link from "next/link";
import { ResetPasswordForm } from "@/components/reset-password-form";

export default function ResetPasswordPage() {
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
          Account
        </p>
        <h1 className="mt-4 font-serif text-[clamp(1.75rem,5.5vw,2.25rem)] leading-[1.2] font-semibold tracking-[-0.01em] text-deep-blue">
          Choose a new password
        </h1>
        <p className="mt-3 max-w-sm text-[0.95rem] leading-[1.55] text-mist">
          Enter a new password for your Song Table account.
        </p>
        <ResetPasswordForm />
      </section>
    </main>
  );
}
