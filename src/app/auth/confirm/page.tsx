"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { type EmailOtpType } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase";

const OTP_TYPES = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

function asOtpType(value: string | null): EmailOtpType | null {
  if (!value || !OTP_TYPES.has(value as EmailOtpType)) return null;
  return value as EmailOtpType;
}

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

/**
 * Email confirmation / recovery landing page.
 *
 * Must run in the browser for default Supabase PKCE email links
 * (`/auth/v1/verify?token=pkce_…`). The code verifier from signup lives in
 * this browser — a server route cannot complete that exchange.
 *
 * Also supports token_hash + type when the Confirm signup template can be
 * customized.
 */
export default function AuthConfirmPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Confirming your email…");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = asOtpType(params.get("type"));
      const code = params.get("code");
      let next = safeNextPath(params.get("next"));

      if (type === "recovery" && !next) {
        next = "/reset-password";
      }
      if (type && type !== "recovery" && next === "/reset-password") {
        next = null;
      }

      const authError =
        params.get("error") ||
        params.get("error_code") ||
        params.get("error_description");

      if (authError && !tokenHash && !code) {
        const expired = /otp_expired|expired|access_denied|invalid/i.test(
          `${params.get("error") ?? ""} ${params.get("error_code") ?? ""} ${params.get("error_description") ?? ""}`,
        );
        const isReset = next === "/reset-password";
        router.replace(
          `/login?error=${
            expired
              ? isReset
                ? "reset_expired"
                : "confirm_expired"
              : "auth"
          }`,
        );
        return;
      }

      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        router.replace("/login?error=config");
        return;
      }

      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          type,
          token_hash: tokenHash,
        });
        if (error) {
          if (!cancelled) {
            setStatus("That link is invalid or expired.");
          }
          const isReset = next === "/reset-password";
          router.replace(
            `/login?error=${isReset ? "reset_expired" : "confirm_expired"}`,
          );
          return;
        }
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          if (!cancelled) {
            setStatus("That link is invalid or expired.");
          }
          const isReset = next === "/reset-password";
          router.replace(
            `/login?error=${isReset ? "reset_expired" : "confirm_expired"}`,
          );
          return;
        }
      } else {
        router.replace("/login?error=auth");
        return;
      }

      if (next) {
        router.replace(next);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login?error=auth");
        return;
      }

      const { data: performer } = await supabase
        .from("performers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!cancelled) {
        setStatus("Email confirmed. Redirecting…");
      }
      router.replace(performer ? "/admin" : "/setup");
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-col flex-col items-center justify-center px-6 py-10 text-center">
      <Loader2 size={22} className="animate-spin text-mist" />
      <p className="mt-4 text-sm text-mist">{status}</p>
    </main>
  );
}
