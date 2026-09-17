"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Handles auth redirects that land on `/` (common when Supabase Site URL is
 * the app origin). Forwards PKCE `code` / token_hash to `/auth/confirm`.
 */
export function AuthErrorRedirect() {
  const router = useRouter();

  useEffect(() => {
    const url = new URL(window.location.href);
    const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
    const hashParams = new URLSearchParams(hash);

    const code = url.searchParams.get("code");
    const tokenHash = url.searchParams.get("token_hash");
    if (code || tokenHash) {
      const confirm = new URL("/auth/confirm", url.origin);
      url.searchParams.forEach((value, key) => {
        confirm.searchParams.set(key, value);
      });
      router.replace(`${confirm.pathname}${confirm.search}`);
      return;
    }

    const error =
      url.searchParams.get("error") ||
      url.searchParams.get("error_code") ||
      hashParams.get("error") ||
      hashParams.get("error_code");
    const description =
      url.searchParams.get("error_description") ||
      hashParams.get("error_description") ||
      "";

    if (!error) return;

    const expired = /otp_expired|expired|access_denied|invalid/i.test(
      `${error} ${description}`,
    );
    router.replace(`/login?error=${expired ? "confirm_expired" : "auth"}`);
  }, [router]);

  return null;
}
