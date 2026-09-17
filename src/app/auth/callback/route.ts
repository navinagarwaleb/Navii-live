import { type NextRequest } from "next/server";
import {
  authFailureRedirect,
  createSupabaseAuthRouteClient,
  redirectAfterAuth,
  safeNextPath,
} from "@/lib/supabase-auth-route";

/**
 * PKCE / OAuth callback. Used by Google sign-in and by email links that still
 * redirect with ?code= (legacy ConfirmationURL flow).
 */
export async function GET(request: NextRequest) {
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

  if (!code) {
    return authFailureRedirect(origin, next, "auth");
  }

  const client = createSupabaseAuthRouteClient(request);
  if (!client) {
    return authFailureRedirect(origin, next, "config");
  }

  const { error } = await client.supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return authFailureRedirect(origin, next, "expired");
  }

  const redirect = await redirectAfterAuth(origin, client.supabase, next);
  return client.applyCookies(redirect);
}
