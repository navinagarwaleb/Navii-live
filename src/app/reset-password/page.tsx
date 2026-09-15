import { BrandMark } from "@/components/brand-mark";
import { ResetPasswordForm } from "@/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-col flex-col px-5 py-5 sm:px-8 sm:py-12">
      <BrandMark href="/" compactMobile />

      <section className="mt-5 sm:mt-12">
        <p className="text-[10px] font-bold tracking-[0.14em] text-[#9b671b] uppercase">
          Account
        </p>
        <h1 className="mt-2 font-serif text-[clamp(1.5rem,5.5vw,2.25rem)] leading-[1.2] font-semibold tracking-[-0.01em] text-deep-blue sm:mt-4">
          Choose a new password
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-snug text-mist sm:mt-3 sm:text-[0.95rem] sm:leading-[1.55]">
          Enter a new password for your Song Table account.
        </p>
        <ResetPasswordForm />
      </section>
    </main>
  );
}
