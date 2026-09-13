"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/create-performer-account";
import { cn } from "@/lib/utils";

export function GoogleMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 18 18"
      aria-hidden
    >
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}

export function AuthOrDivider() {
  return (
    <div className="flex items-center gap-3 py-1" aria-hidden>
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs font-semibold tracking-[0.12em] text-mist uppercase">
        or
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function GoogleSignInButton({
  label = "Sign in with Google",
  className,
}: {
  label?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onClick() {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : "Could not start Google sign-in.",
      );
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-3">
      <Button
        type="button"
        size="lg"
        className={cn(
          "min-h-[52px] w-full gap-3 rounded-full bg-white text-ink shadow-xs hover:bg-[#FFF6EC]",
          className,
        )}
        variant="secondary"
        disabled={loading}
        onClick={() => void onClick()}
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <GoogleMark />
        )}
        {loading ? "Redirecting..." : label}
      </Button>
      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-[#C73A2B]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
