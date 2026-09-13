import { createBrowserClient } from "@supabase/ssr";

export function isSupabaseConfigured() {
  // Must use static process.env.NEXT_PUBLIC_* access; dynamic keys are not inlined in the client bundle.
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;

  return createBrowserClient(url, anonKey);
}
