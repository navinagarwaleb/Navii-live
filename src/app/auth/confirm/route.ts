import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";
import {
  authFailureRedirect,
  createSupabaseAuthRouteClient,
  redirectAfterAuth,
  safeNextPath,
} from "@/lib/supabase-auth-route";

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

/**
 * Email confirmation / recovery landing page.
 *
 * Prefer the dashboard Confirm signup template:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type={{ .Type }}
 *
 * Also accepts ?code= from the older verify→redirect PKCE flow.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = asOtpType(searchParams.get("type"));
  const code = searchParams.get("code");
  let next = safeNextPath(searchParams.get("next"));

  // Recovery emails should always land on the password form.
  if (type === "recovery" && !next) {
    next = "/reset-password";
  }
  // Signup / email confirm should never inherit a Site URL that points at reset.
  if (type && type !== "recovery" && next === "/reset-password") {
    next = null;
  }

  const authError =
    searchParams.get("error") ||
    searchParams.get("error_code") ||
    searchParams.get("error_description");

  if (authError && !tokenHash && !code) {
    const expired =
      /otp_expired|expired|access_denied|invalid/i.test(authError) ||
      /otp_expired|expired|access_denied|invalid/i.test(
        searchParams.get("error_description") ?? "",
      );
    return authFailureRedirect(origin, next, expired ? "expired" : "auth");
  }

  const client = createSupabaseAuthRouteClient(request);
  if (!client) {
    return authFailureRedirect(origin, next, "config");
  }

  if (tokenHash && type) {
    const { error } = await client.supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (error) {
      return authFailureRedirect(origin, next, "expired");
    }
  } else if (code) {
    const { error } = await client.supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return authFailureRedirect(origin, next, "expired");
    }
  } else {
    return authFailureRedirect(origin, next, "auth");
  }

  const redirect = await redirectAfterAuth(origin, client.supabase, next);
  return client.applyCookies(redirect);
}
