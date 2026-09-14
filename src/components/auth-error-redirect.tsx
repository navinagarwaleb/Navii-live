"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Sends Supabase auth errors that land on `/` over to login with a clear message. */
export function AuthErrorRedirect() {
  const router = useRouter();

  useEffect(() => {
    const url = new URL(window.location.href);
    const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
    const hashParams = new URLSearchParams(hash);
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
    router.replace(`/login?error=${expired ? "reset_expired" : "auth"}`);
  }, [router]);

  return null;
}
