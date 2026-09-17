"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
import {
  AuthOrDivider,
  GoogleSignInButton,
} from "@/components/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  resendSignupConfirmation,
  signUpWithEmail,
} from "@/lib/create-performer-account";
import { createSupabaseBrowserClient } from "@/lib/supabase";

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    if (!awaitingVerification) return;

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        router.replace("/setup");
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [awaitingVerification, router]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setResendMessage("");

    if (!email.trim()) {
      setError("Enter your email.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await signUpWithEmail(email, password);

      if (result.status === "session") {
        router.replace("/setup");
        router.refresh();
        return;
      }

      if (result.status === "already_registered") {
        setError(
          "An account with this email already exists. Sign in, or use Forgot password if you never finished setup.",
        );
        setSubmitting(false);
        return;
      }

      setPendingEmail(result.email);
      setAwaitingVerification(true);
      setSubmitting(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not create your account.",
      );
      setSubmitting(false);
    }
  }

  async function onResend() {
    if (!pendingEmail || resending) return;
    setResending(true);
    setResendMessage("");
    setError("");
    try {
      await resendSignupConfirmation(pendingEmail);
      setResendMessage("Confirmation email sent again. Check your inbox and spam.");
    } catch (resendError) {
      setError(
        resendError instanceof Error
          ? resendError.message
          : "Could not resend confirmation email.",
      );
    } finally {
      setResending(false);
    }
  }

  if (awaitingVerification) {
    return (
      <div>
        <p className="text-[10px] font-bold tracking-[0.14em] text-[#9b671b] uppercase">
          Almost there
        </p>
        <h1 className="mt-2 font-serif text-[clamp(1.5rem,5.5vw,2.25rem)] leading-[1.2] font-semibold tracking-[-0.01em] text-deep-blue sm:mt-4">
          Check your email
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-snug text-mist sm:mt-3 sm:text-[0.95rem] sm:leading-[1.55]">
          We sent a verification link to{" "}
          <strong className="font-semibold text-ink">{pendingEmail}</strong>.
          Open it to finish setup and claim your page.
        </p>
        <div className="mt-5 rounded-2xl border border-border bg-field p-5 text-center shadow-xs sm:mt-8 sm:p-6">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-selected text-[#B8862F] sm:size-14">
            <Mail size={22} />
          </span>
          <p className="mt-4 text-sm leading-relaxed text-mist sm:mt-5">
            Keep this tab open. We’ll redirect you automatically once you’re
            signed in.
          </p>
          {error ? (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-[#C73A2B]"
            >
              {error}
            </p>
          ) : null}
          {resendMessage ? (
            <p className="mt-4 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-800">
              {resendMessage}
            </p>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="mt-5 min-h-[48px] w-full rounded-full sm:min-h-[52px]"
            disabled={resending}
            onClick={() => void onResend()}
          >
            {resending ? <Loader2 size={16} className="animate-spin" /> : null}
            Resend confirmation email
          </Button>
        </div>
        <p className="mt-4 text-center text-sm text-mist">
          Wrong email?{" "}
          <button
            type="button"
            className="font-semibold text-deep-blue underline-offset-2 hover:underline"
            onClick={() => {
              setAwaitingVerification(false);
              setPendingEmail("");
              setResendMessage("");
              setError("");
            }}
          >
            Go back
          </button>
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[10px] font-bold tracking-[0.14em] text-[#9b671b] uppercase">
        Artist onboarding
      </p>
      <h1 className="mt-2 font-serif text-[clamp(1.5rem,5.5vw,2.25rem)] leading-[1.2] font-semibold tracking-[-0.01em] text-deep-blue sm:mt-4">
        Create your Song Table page
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-snug text-mist sm:mt-3 sm:text-[0.95rem] sm:leading-[1.55]">
        Sign up with Google or email. Next you’ll pick a username and go live.
      </p>

      <div className="mt-5 grid gap-4 sm:mt-8 sm:gap-5">
      <GoogleSignInButton />

      <AuthOrDivider />

      <form onSubmit={(event) => void onSubmit(event)} className="grid gap-3.5 sm:gap-4">
        <div>
          <label
            htmlFor="signup-email"
            className="mb-1.5 block text-sm font-medium text-mist sm:mb-2"
          >
            Email
          </label>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@email.com"
          />
        </div>

        <div>
          <label
            htmlFor="signup-password"
            className="mb-1.5 block text-sm font-medium text-mist sm:mb-2"
          >
            Password
          </label>
          <div className="relative">
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              className="pr-14"
            />
            <button
              type="button"
              className="absolute top-1/2 right-3 grid size-11 -translate-y-1/2 place-items-center rounded-full text-mist transition hover:text-ink"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="signup-confirm"
            className="mb-1.5 block text-sm font-medium text-mist sm:mb-2"
          >
            Confirm password
          </label>
          <div className="relative">
            <Input
              id="signup-confirm"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter password"
              className="pr-14"
            />
            <button
              type="button"
              className="absolute top-1/2 right-3 grid size-11 -translate-y-1/2 place-items-center rounded-full text-mist transition hover:text-ink"
              aria-label={
                showConfirm ? "Hide confirm password" : "Show confirm password"
              }
              onClick={() => setShowConfirm((value) => !value)}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-[#C73A2B]"
          >
            {error}{" "}
            {/already exists/i.test(error) ? (
              <Link
                href="/login"
                className="underline underline-offset-2 hover:text-ink"
              >
                Sign in
              </Link>
            ) : null}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="min-h-[48px] w-full rounded-full sm:min-h-[52px]"
          disabled={submitting}
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-mist">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-deep-blue underline-offset-2 hover:underline"
        >
          Sign in
        </Link>
      </p>
      </div>
    </div>
  );
}
