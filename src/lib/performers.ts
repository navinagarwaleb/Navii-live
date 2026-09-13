import { createSupabaseAdminClient } from "@/lib/supabase-server";
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
    .select(
      "id,username,display_name,bio,tip_handle,interac_email,user_id,created_at",
    )
    .eq("username", handle)
    .maybeSingle();

  if (error) {
    console.error("Unable to load performer:", error);
    return null;
  }

  return (data as Performer | null) ?? null;
}
