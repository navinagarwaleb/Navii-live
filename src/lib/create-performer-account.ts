import { RESERVED_USERNAMES } from "@/lib/reserved-usernames";
import { DEFAULT_BIO } from "@/lib/performer-defaults";
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

/** Start Google OAuth; returns to /auth/callback after consent. */
export async function signInWithGoogle() {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local (local) or Vercel env (production), then restart/redeploy.",
    );
  }

  const origin = window.location.origin;
  const redirectTo = `${origin}/auth/callback`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  if (error) throw new Error(error.message);
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

/** Sign in with email or performer username + password. */
export async function signInWithIdentifier(
  identifier: string,
  password: string,
) {
  const response = await fetch("/api/auth/resolve-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier }),
  });
  const payload = (await response.json()) as {
    email?: string;
    error?: string;
  };
  if (!response.ok || !payload.email) {
    throw new Error(payload.error ?? "Could not sign in.");
  }
  return signInWithEmail(payload.email, password);
}

export async function sendPasswordReset(identifier: string) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const response = await fetch("/api/auth/resolve-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier }),
  });
  const payload = (await response.json()) as {
    email?: string;
    error?: string;
  };
  if (!response.ok || !payload.email) {
    throw new Error(payload.error ?? "Could not send reset email.");
  }

  const origin = window.location.origin;
  const { error } = await supabase.auth.resetPasswordForEmail(payload.email, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
  });

  if (error) throw new Error(error.message);
}

const MIN_PASSWORD_LENGTH = 8;

export function hasEmailPasswordIdentity(
  user: {
    identities?: { provider: string }[] | null;
    app_metadata?: Record<string, unknown> | null;
  } | null | undefined,
) {
  if (!user) return false;
  if (user.identities?.some((identity) => identity.provider === "email")) {
    return true;
  }
  const providers = user.app_metadata?.providers;
  return Array.isArray(providers) && providers.includes("email");
}

/**
 * Change password using standard re-auth: verify current password, then update.
 * OAuth-only accounts can set a first password without a current one.
 */
export async function changePassword(input: {
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const newPassword = input.newPassword;
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  if (newPassword !== input.confirmPassword) {
    throw new Error("New passwords do not match.");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user?.email) {
    throw new Error("You need to sign in again to change your password.");
  }

  const needsCurrent = hasEmailPasswordIdentity(user);
  if (needsCurrent) {
    const current = input.currentPassword?.trim() ?? "";
    if (!current) throw new Error("Enter your current password.");
    if (current === newPassword) {
      throw new Error("New password must be different from your current password.");
    }

    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    });
    if (reauthError) {
      throw new Error("Current password is incorrect.");
    }
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
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
    bio: DEFAULT_BIO,
  });

  if (insertError) throw new Error(insertError.message);

  return { userId: user.id, username };
}
