"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import {
  AuthOrDivider,
  GoogleSignInButton,
} from "@/components/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  sendPasswordReset,
  signInWithEmail,
} from "@/lib/create-performer-account";
import { createSupabaseBrowserClient } from "@/lib/supabase";

export function LoginForm({
  initialError,
}: {
  initialError?: string | null;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(initialError ?? "");
  const [message, setMessage] = useState("");

  async function onSignIn(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      await signInWithEmail(email, password);

      const supabase = createSupabaseBrowserClient();
      if (supabase) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: performer } = await supabase
            .from("performers")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();
          router.replace(performer ? "/admin" : "/setup");
          router.refresh();
          return;
        }
      }

      router.replace("/admin");
      router.refresh();
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : "Could not sign in.",
      );
      setSubmitting(false);
    }
  }

  async function onForgot(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      if (!email.trim()) {
        setError("Enter the email for your account.");
        setSubmitting(false);
        return;
      }
      await sendPasswordReset(email);
      setMessage("Check your email for a password reset link.");
      setSubmitting(false);
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : "Could not send reset email.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-8 grid gap-5">
      {mode === "signin" ? (
        <>
          <GoogleSignInButton />
          <AuthOrDivider />
          <form onSubmit={(event) => void onSignIn(event)} className="grid gap-4">
            <div>
              <label
                htmlFor="login-email"
                className="mb-2 block text-sm font-medium text-mist"
              >
                Email
              </label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@email.com"
              />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-mist"
                >
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs font-semibold text-deep-blue underline-offset-2 hover:underline"
                  onClick={() => {
                    setError("");
                    setMessage("");
                    setMode("forgot");
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
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
              Sign In
            </Button>
          </form>
        </>
      ) : (
        <form onSubmit={(event) => void onForgot(event)} className="grid gap-4">
          <p className="text-sm leading-relaxed text-mist">
            Enter your email and we’ll send a reset link.
          </p>
          <div>
            <label
              htmlFor="forgot-email"
              className="mb-2 block text-sm font-medium text-mist"
            >
              Email
            </label>
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@email.com"
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
            Send reset link
          </Button>
          <button
            type="button"
            className="text-sm font-semibold text-deep-blue underline-offset-2 hover:underline"
            onClick={() => {
              setError("");
              setMessage("");
              setMode("signin");
            }}
          >
            Back to sign in
          </button>
        </form>
      )}

      <p className="text-center text-sm text-mist">
        New here?{" "}
        <Link
          href="/signup"
          className="font-semibold text-deep-blue underline-offset-2 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
