"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Handles auth redirects that land on `/` (common when Supabase Site URL is
 * the app origin). Forwards PKCE `code` to `/auth/callback`, and maps auth
 * errors to the login page.
 */
export function AuthErrorRedirect() {
  const router = useRouter();

  useEffect(() => {
    const url = new URL(window.location.href);
    const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
    const hashParams = new URLSearchParams(hash);

    // Site URL fallback often drops users on `/` with ?code= — exchange it.
    const code = url.searchParams.get("code");
    if (code) {
      const callback = new URL("/auth/callback", url.origin);
      url.searchParams.forEach((value, key) => {
        callback.searchParams.set(key, value);
      });
      router.replace(`${callback.pathname}${callback.search}`);
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
