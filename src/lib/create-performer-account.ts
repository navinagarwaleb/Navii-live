import { RESERVED_USERNAMES } from "@/lib/reserved-usernames";
import { createSupabaseBrowserClient } from "@/lib/supabase";

const USERNAME_RE = /^[a-z0-9-]{1,24}$/;

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function isValidUsername(value: string) {
  return USERNAME_RE.test(normalizeUsername(value));
}

export async function isUsernameAvailable(username: string) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const handle = normalizeUsername(username);
  const { data, error } = await supabase
    .from("performers")
    .select("id")
    .eq("username", handle)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return !data;
}

/** Start OAuth; returns to /auth/callback after consent. */
export async function signInWithOAuthProvider(
  provider: "google" | "facebook",
) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const origin = window.location.origin;
  const redirectTo = `${origin}/auth/callback`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });

  if (error) throw new Error(error.message);
}

export async function signInWithGoogle() {
  return signInWithOAuthProvider("google");
}

export async function signInWithFacebook() {
  return signInWithOAuthProvider("facebook");
}

export async function signUpWithEmail(email: string, password: string) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const origin = window.location.origin;
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/setup")}`,
    },
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function sendPasswordReset(email: string) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const origin = window.location.origin;
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/admin")}`,
  });

  if (error) throw new Error(error.message);
}

/**
 * One-time setup after auth: insert performers row for the signed-in user.
 */
export async function completePerformerSetup(input: {
  username: string;
  displayName: string;
}) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You need to sign in first.");

  const username = normalizeUsername(input.username);
  if (!isValidUsername(username)) {
    throw new Error(
      "Username must be lowercase letters, numbers, or hyphens (max 24).",
    );
  }
  if (RESERVED_USERNAMES.has(username)) {
    throw new Error("That username is reserved.");
  }

  const available = await isUsernameAvailable(username);
  if (!available) throw new Error("That username is already taken.");

  const { data: existing, error: existingError } = await supabase
    .from("performers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);
  if (existing) throw new Error("Your page is already set up.");

  const { error: insertError } = await supabase.from("performers").insert({
    user_id: user.id,
    username,
    display_name: input.displayName.trim(),
  });

  if (insertError) throw new Error(insertError.message);

  return { userId: user.id, username };
}
