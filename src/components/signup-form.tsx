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
import { signUpWithEmail } from "@/lib/create-performer-account";
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
      const data = await signUpWithEmail(email, password);

      // Email confirmation disabled → session available immediately
      if (data.session) {
        router.replace("/setup");
        router.refresh();
        return;
      }

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

  if (awaitingVerification) {
    return (
      <div className="mt-8 rounded-2xl border border-border bg-field p-6 text-center shadow-xs">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-selected text-[#B8862F]">
          <Mail size={24} />
        </span>
        <h2 className="mt-5 font-serif text-xl font-semibold tracking-[-0.01em] text-deep-blue">
          Check your email to verify your account
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-mist">
          We sent a link to <strong className="text-ink">{email.trim()}</strong>.
          After you verify, you’ll continue to setup to claim your username.
        </p>
        <p className="mt-4 text-xs text-mist">
          Keep this tab open. We’ll redirect you automatically once you’re
          signed in.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-5">
      <GoogleSignInButton />

      <AuthOrDivider />

      <form onSubmit={(event) => void onSubmit(event)} className="grid gap-4">
        <div>
          <label
            htmlFor="signup-email"
            className="mb-2 block text-sm font-medium text-mist"
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
            className="mb-2 block text-sm font-medium text-mist"
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
            className="mb-2 block text-sm font-medium text-mist"
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
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="min-h-[52px] w-full rounded-full"
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
  );
}
