import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export function authFailureRedirect(
  origin: string,
  next: string | null,
  reason: "expired" | "auth" | "config" = "auth",
) {
  if (reason === "config") {
    return NextResponse.redirect(`${origin}/login?error=config`);
  }
  const isReset = next === "/reset-password";
  const error =
    reason === "expired" && isReset
      ? "reset_expired"
      : reason === "expired"
        ? "confirm_expired"
        : "auth";
  return NextResponse.redirect(`${origin}/login?error=${error}`);
}

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

/**
 * Route-handler Supabase client that collects session cookies so they can be
 * attached to the final redirect response (required for App Router).
 */
export function createSupabaseAuthRouteClient(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const jar: CookieToSet[] = [];

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        jar.length = 0;
        for (const cookie of cookiesToSet) {
          jar.push(cookie);
        }
      },
    },
  });

  return {
    supabase,
    applyCookies(response: NextResponse) {
      for (const { name, value, options } of jar) {
        response.cookies.set(name, value, options);
      }
      return response;
    },
  };
}

export async function redirectAfterAuth(
  origin: string,
  supabase: NonNullable<
    ReturnType<typeof createSupabaseAuthRouteClient>
  >["supabase"],
  next: string | null,
) {
  if (next) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return authFailureRedirect(origin, next, "auth");
  }

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
