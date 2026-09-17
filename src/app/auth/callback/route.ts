import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

function authFailureRedirect(
  origin: string,
  next: string | null,
  reason: "expired" | "auth" | "config" = "auth",
) {
  if (reason === "config") {
    return NextResponse.redirect(`${origin}/login?error=config`);
  }
  // Only label password-reset failures as reset_expired.
  const isReset = next === "/reset-password";
  const error =
    reason === "expired" && isReset
      ? "reset_expired"
      : reason === "expired"
        ? "confirm_expired"
        : "auth";
  return NextResponse.redirect(`${origin}/login?error=${error}`);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));
  const authError =
    searchParams.get("error") ||
    searchParams.get("error_code") ||
    searchParams.get("error_description");

  if (authError && !code) {
    const expired =
      /otp_expired|expired|access_denied|invalid/i.test(authError) ||
      /otp_expired|expired|access_denied|invalid/i.test(
        searchParams.get("error_description") ?? "",
      );
    return authFailureRedirect(origin, next, expired ? "expired" : "auth");
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return authFailureRedirect(origin, next, "config");
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: performer } = await supabase
          .from("performers")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!performer) {
          return NextResponse.redirect(`${origin}/setup`);
        }

        return NextResponse.redirect(`${origin}/admin`);
      }
    }

    return authFailureRedirect(origin, next, "expired");
  }

  return authFailureRedirect(origin, next, "auth");
}
