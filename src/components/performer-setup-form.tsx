"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  completePerformerSetup,
  isUsernameAvailable,
  isValidUsername,
  normalizeUsername,
} from "@/lib/create-performer-account";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type UsernameStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "invalid"
  | "error";

export function PerformerSetupForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      setCheckingAuth(false);
      return;
    }

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/signup");
        return;
      }

      const { data: performer } = await supabase
        .from("performers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (performer) {
        router.replace("/admin");
        return;
      }

      const suggested =
        (typeof user.user_metadata?.full_name === "string" &&
          user.user_metadata.full_name) ||
        (typeof user.user_metadata?.name === "string" &&
          user.user_metadata.name) ||
        "";
      if (suggested) setDisplayName(suggested);
      setCheckingAuth(false);
    })();
  }, [router]);

  useEffect(() => {
    const handle = normalizeUsername(username);
    if (!handle) {
      setUsernameStatus("idle");
      return;
    }
    if (!isValidUsername(handle)) {
      setUsernameStatus("invalid");
      return;
    }

    setUsernameStatus("checking");
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const available = await isUsernameAvailable(handle);
          setUsernameStatus(available ? "available" : "taken");
        } catch {
          setUsernameStatus("error");
        }
      })();
    }, 400);

    return () => window.clearTimeout(timer);
  }, [username]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const handle = normalizeUsername(username);
    if (!isValidUsername(handle)) {
      setError(
        "Username must be lowercase letters, numbers, or hyphens (max 24).",
      );
      return;
    }
    if (usernameStatus === "taken") {
      setError("That username is already taken.");
      return;
    }
    if (!displayName.trim()) {
      setError("Add a display name for your page.");
      return;
    }

    setSubmitting(true);
    try {
      await completePerformerSetup({
        username: handle,
        displayName,
      });
      router.replace("/admin");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not finish setup.",
      );
      setSubmitting(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="mt-10 flex items-center gap-2 text-sm text-mist">
        <Loader2 size={16} className="animate-spin" />
        Checking your account…
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="mt-8 grid gap-4">
      <div>
        <label
          htmlFor="setup-username"
          className="mb-2 block text-sm font-medium text-mist"
        >
          Username
        </label>
        <div className="relative">
          <Input
            id="setup-username"
            required
            autoFocus
            value={username}
            onChange={(event) =>
              setUsername(normalizeUsername(event.target.value).slice(0, 24))
            }
            placeholder="your-name"
            className="pr-14"
            aria-invalid={
              usernameStatus === "taken" || usernameStatus === "invalid"
            }
          />
          <span className="absolute top-1/2 right-4 -translate-y-1/2">
            {usernameStatus === "checking" ? (
              <Loader2 size={18} className="animate-spin text-mist" />
            ) : usernameStatus === "available" ? (
              <Check
                size={18}
                className="text-emerald-600"
                aria-label="Username available"
              />
            ) : usernameStatus === "taken" || usernameStatus === "invalid" ? (
              <X
                size={18}
                className="text-[#C73A2B]"
                aria-label="Username unavailable"
              />
            ) : null}
          </span>
        </div>
        <p
          className={cn(
            "mt-2 text-xs",
            usernameStatus === "taken" || usernameStatus === "invalid"
              ? "font-semibold text-[#C73A2B]"
              : usernameStatus === "available"
                ? "font-semibold text-emerald-700"
                : "text-mist",
          )}
        >
          {usernameStatus === "taken"
            ? "That username is taken."
            : usernameStatus === "invalid"
              ? "Use lowercase letters, numbers, or hyphens (max 24)."
              : usernameStatus === "available"
                ? `Available — your page will be /${normalizeUsername(username)}`
                : `Your page will be /${username || "username"}`}
        </p>
      </div>
      <div>
        <label
          htmlFor="setup-display-name"
          className="mb-2 block text-sm font-medium text-mist"
        >
          Display name
        </label>
        <Input
          id="setup-display-name"
          required
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="How you appear on stage"
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
      <Button
        type="submit"
        size="lg"
        className="min-h-[52px] w-full rounded-full"
        disabled={
          submitting ||
          usernameStatus === "checking" ||
          usernameStatus === "taken" ||
          usernameStatus === "invalid" ||
          !normalizeUsername(username)
        }
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
        {submitting ? "Creating..." : "Create my page"}
      </Button>
      <p className="text-center text-sm text-mist">
        <Link href="/" className="font-semibold text-deep-blue hover:underline">
          Back to home
        </Link>
      </p>
    </form>
  );
}
