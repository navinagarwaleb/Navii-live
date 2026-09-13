import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { PERFORMER_SELECT_SAFE } from "@/lib/performer-select";
import { RESERVED_USERNAMES } from "@/lib/reserved-usernames";
import type { Performer } from "@/lib/types";

export { RESERVED_USERNAMES };

export async function getPerformerByUsername(
  username: string,
): Promise<Performer | null> {
  const handle = username.trim().toLowerCase();
  if (!handle || RESERVED_USERNAMES.has(handle)) return null;

  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("performers")
    .select(PERFORMER_SELECT_SAFE)
    .eq("username", handle)
    .maybeSingle();

  if (error) {
    console.error(
      "Unable to load performer:",
      error.message ?? JSON.stringify(error),
    );
    return null;
  }

  return (data as Performer | null) ?? null;
}
