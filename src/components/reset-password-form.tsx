"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase";

const MIN_PASSWORD_LENGTH = 8;

export function ResetPasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setSessionError("Supabase is not configured.");
      return;
    }

    let active = true;

    // If Site URL / allowlist sends the PKCE code here directly, hand it to
    // the server callback so cookies are set the same way as other auth flows.
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) {
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("code", code);
      callback.searchParams.set("next", "/reset-password");
      window.location.replace(`${callback.pathname}${callback.search}`);
      return;
    }

    // Hash-based recovery links (legacy) land with tokens in the URL fragment.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
        setSessionError("");
      }
    });

    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;
      if (session) {
        setReady(true);
      } else {
        setSessionError(
          "This reset link is invalid or has expired. Request a new one from the sign-in page.",
        );
      }
    })();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }

    setMessage("Password updated. Taking you to your dashboard…");
    window.setTimeout(() => {
      router.replace("/admin");
      router.refresh();
    }, 800);
  }

  if (sessionError && !ready) {
    return (
      <div className="mt-8 grid gap-4">
        <p
          role="alert"
          className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-[#C73A2B]"
        >
          {sessionError}
        </p>
        <Link
          href="/login"
          className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-ink px-6 text-base font-semibold text-surface"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="mt-12 flex items-center justify-center gap-2 text-sm text-mist">
        <Loader2 size={16} className="animate-spin" />
        Checking reset link…
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="mt-8 grid gap-4">
      <div>
        <label
          htmlFor="reset-password"
          className="mb-2 block text-sm font-medium text-mist"
        >
          New password
        </label>
        <div className="relative">
          <Input
            id="reset-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
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
          htmlFor="reset-confirm"
          className="mb-2 block text-sm font-medium text-mist"
        >
          Confirm new password
        </label>
        <Input
          id="reset-confirm"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Re-enter password"
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-[#C73A2B]"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-800">
          {message}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="min-h-[52px] w-full rounded-full"
        disabled={submitting}
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
        Update password
      </Button>
    </form>
  );
}
